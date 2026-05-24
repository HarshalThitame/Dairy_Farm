import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  addMonths,
  calculateMilkStats,
  getMonthInput,
  getMonthLabel,
  getMonthRange,
  getRecordMilkTotal,
  padDatePart
} from "@/lib/reportUtils";

export const dynamic = "force-dynamic";

function fillDailyData(records, month, year, daysInMonth) {
  const totals = new Map();

  records.forEach((record) => {
    totals.set(record.date, (totals.get(record.date) || 0) + getRecordMilkTotal(record));
  });

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${year}-${padDatePart(month)}-${padDatePart(day)}`;

    return {
      date,
      day,
      total: Number((totals.get(date) || 0).toFixed(2))
    };
  });
}

function buildPerCow(records, cows, daysInMonth) {
  const cowMap = new Map();

  cows.forEach((cow) => {
    cowMap.set(cow.id, {
      cow_id: cow.id,
      name: cow.name,
      breed: cow.breed,
      status: cow.status,
      total: 0,
      average: 0,
      best: 0
    });
  });

  records.forEach((record) => {
    const cow = record.cows || {};
    const cowId = record.cow_id;

    if (!cowMap.has(cowId)) {
      cowMap.set(cowId, {
        cow_id: cowId,
        name: cow.name || "गाय",
        breed: cow.breed || "",
        status: cow.status || "",
        total: 0,
        average: 0,
        best: 0
      });
    }

    const item = cowMap.get(cowId);
    const total = getRecordMilkTotal(record);
    item.total += total;
    item.best = Math.max(item.best, total);
  });

  return Array.from(cowMap.values())
    .map((item) => ({
      ...item,
      total: Number(item.total.toFixed(2)),
      average: Number((item.total / daysInMonth).toFixed(2)),
      best: Number(item.best.toFixed(2))
    }))
    .sort((first, second) => second.total - first.total || first.name.localeCompare(second.name, "mr-IN"));
}

function buildMonthlyTrend(records, selectedMonth, selectedYear) {
  const totals = new Map();
  const months = Array.from({ length: 6 }, (_, index) =>
    addMonths(selectedMonth, selectedYear, index - 5)
  );

  months.forEach(({ month, year }) => {
    totals.set(`${year}-${padDatePart(month)}`, 0);
  });

  records.forEach((record) => {
    const key = record.date.slice(0, 7);
    totals.set(key, (totals.get(key) || 0) + getRecordMilkTotal(record));
  });

  return months.map(({ month, year }) => {
    const key = `${year}-${padDatePart(month)}`;

    return {
      month,
      year,
      label: getMonthLabel(month, year),
      total: Number((totals.get(key) || 0).toFixed(2)),
      current: month === selectedMonth && year === selectedYear
    };
  });
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthInput = getMonthInput(searchParams);
    const cowId = searchParams.get("cow_id");

    if (!monthInput) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const { month, year } = monthInput;
    const monthRange = getMonthRange(month, year);
    const oldestMonth = addMonths(month, year, -5);
    const oldestRange = getMonthRange(oldestMonth.month, oldestMonth.year);
    const supabase = getSupabaseServerClient();

    let selectedQuery = supabase
      .from("milk_records")
      .select("*, cows(id, name, breed, status)")
      .eq("farm_id", farmId)
      .gte("date", monthRange.start)
      .lt("date", monthRange.end);

    if (cowId) {
      selectedQuery = selectedQuery.eq("cow_id", cowId);
    }

    let trendQuery = supabase
      .from("milk_records")
      .select("date, morning_litres, evening_litres, total_litres")
      .eq("farm_id", farmId)
      .gte("date", oldestRange.start)
      .lt("date", monthRange.end);

    if (cowId) {
      trendQuery = trendQuery.eq("cow_id", cowId);
    }

    const [selectedRecords, trendRecords, cowsResult] = await Promise.all([
      selectedQuery.order("date", { ascending: true }),
      trendQuery.order("date", { ascending: true }),
      cowId
        ? supabase.from("cows").select("id, name, breed, status").eq("farm_id", farmId).eq("id", cowId)
        : supabase.from("cows").select("id, name, breed, status").eq("farm_id", farmId).eq("is_active", true)
    ]);

    if (selectedRecords.error) {
      throw selectedRecords.error;
    }

    if (trendRecords.error) {
      throw trendRecords.error;
    }

    if (cowsResult.error) {
      throw cowsResult.error;
    }

    const stats = calculateMilkStats(selectedRecords.data || [], monthRange.daysInMonth);
    const dailyData = fillDailyData(
      selectedRecords.data || [],
      month,
      year,
      monthRange.daysInMonth
    );

    const bestDay = dailyData.reduce(
      (best, day) => (day.total > best.total ? day : best),
      dailyData[0]
    );
    const worstDay = dailyData.reduce(
      (worst, day) => (day.total < worst.total ? day : worst),
      dailyData[0]
    );

    return NextResponse.json({
      data: {
        month,
        year,
        totalLitres: Number(stats.total.toFixed(2)),
        dailyAverage: Number(stats.average.toFixed(2)),
        bestDay: bestDay
          ? { date: bestDay.date, litres: bestDay.total }
          : { date: null, litres: 0 },
        worstDay: worstDay
          ? { date: worstDay.date, litres: worstDay.total }
          : { date: null, litres: 0 },
        dailyData,
        perCow: buildPerCow(selectedRecords.data || [], cowsResult.data || [], monthRange.daysInMonth),
        monthlyTrend: buildMonthlyTrend(trendRecords.data || [], month, year)
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
