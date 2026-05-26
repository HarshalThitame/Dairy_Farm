import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  addMonths,
  calculateMilkStats,
  getMonthInput,
  getMonthLabel,
  getMonthRange,
  getRecordMilkAmount,
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

function buildDailyRecords(records) {
  return records.map((record) => {
    const total = getRecordMilkTotal(record);
    const amount = getRecordMilkAmount(record);

    return {
      id: record.id,
      date: record.date,
      morning: Number(record.morning_litres || 0),
      evening: Number(record.evening_litres || 0),
      total: Number(total.toFixed(2)),
      morningRate: toOptionalNumber(record.morning_price_per_litre ?? record.price_per_litre),
      eveningRate: toOptionalNumber(record.evening_price_per_litre ?? record.price_per_litre),
      averageRate: total > 0 ? Number((amount / total).toFixed(2)) : 0,
      morningFat: toOptionalNumber(record.morning_fat_percentage ?? record.fat_percentage),
      eveningFat: toOptionalNumber(record.evening_fat_percentage ?? record.fat_percentage),
      morningSnf: toOptionalNumber(record.morning_snf_value ?? record.snf_value),
      eveningSnf: toOptionalNumber(record.evening_snf_value ?? record.snf_value),
      morningDegree: toOptionalNumber(record.morning_degree_reading ?? record.degree_reading),
      eveningDegree: toOptionalNumber(record.evening_degree_reading ?? record.degree_reading),
      amount: Number(amount.toFixed(2))
    };
  });
}

function toOptionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Number(numberValue.toFixed(2)) : null;
}

function sumField(records, field) {
  return records.reduce((sum, record) => sum + Number(record[field] || 0), 0);
}

function weightedAverage(records, valueField, weightField, fallbackField = null) {
  const summary = records.reduce(
    (values, record) => {
      const rawValue = record[valueField] ?? (fallbackField ? record[fallbackField] : null);
      const value = Number(rawValue);
      const weight = Number(record[weightField] || 0);

      if (!Number.isFinite(value) || weight <= 0) {
        return values;
      }

      return {
        total: values.total + value * weight,
        weight: values.weight + weight
      };
    },
    { total: 0, weight: 0 }
  );

  return summary.weight > 0 ? Number((summary.total / summary.weight).toFixed(2)) : null;
}

function combineWeightedAverages(...items) {
  const summary = items.reduce(
    (values, item) => {
      if (item.value === null || item.value === undefined || item.weight <= 0) {
        return values;
      }

      return {
        total: values.total + Number(item.value) * Number(item.weight),
        weight: values.weight + Number(item.weight)
      };
    },
    { total: 0, weight: 0 }
  );

  return summary.weight > 0 ? Number((summary.total / summary.weight).toFixed(2)) : null;
}

function buildSessionSummary(records) {
  const morningLitres = sumField(records, "morning_litres");
  const eveningLitres = sumField(records, "evening_litres");
  const totalLitres = morningLitres + eveningLitres;
  const morningAmount = records.reduce(
    (sum, record) =>
      sum +
      Number(record.morning_litres || 0) *
        Number(record.morning_price_per_litre ?? record.price_per_litre ?? 0),
    0
  );
  const eveningAmount = records.reduce(
    (sum, record) =>
      sum +
      Number(record.evening_litres || 0) *
        Number(record.evening_price_per_litre ?? record.price_per_litre ?? 0),
    0
  );
  const totalAmount = morningAmount + eveningAmount;

  return {
    morningLitres: Number(morningLitres.toFixed(2)),
    eveningLitres: Number(eveningLitres.toFixed(2)),
    totalLitres: Number(totalLitres.toFixed(2)),
    morningAmount: Number(morningAmount.toFixed(2)),
    eveningAmount: Number(eveningAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    averageRate: totalLitres > 0 ? Number((totalAmount / totalLitres).toFixed(2)) : 0,
    daysWithMilk: records.filter((record) => getRecordMilkTotal(record) > 0).length,
    recordCount: records.length
  };
}

function buildQualitySummary(records) {
  const morningLitres = sumField(records, "morning_litres");
  const eveningLitres = sumField(records, "evening_litres");
  const morningFat = weightedAverage(records, "morning_fat_percentage", "morning_litres", "fat_percentage");
  const eveningFat = weightedAverage(records, "evening_fat_percentage", "evening_litres", "fat_percentage");
  const morningSnf = weightedAverage(records, "morning_snf_value", "morning_litres", "snf_value");
  const eveningSnf = weightedAverage(records, "evening_snf_value", "evening_litres", "snf_value");
  const morningDegree = weightedAverage(records, "morning_degree_reading", "morning_litres", "degree_reading");
  const eveningDegree = weightedAverage(records, "evening_degree_reading", "evening_litres", "degree_reading");

  return {
    morningFat,
    eveningFat,
    averageFat: combineWeightedAverages(
      { value: morningFat, weight: morningLitres },
      { value: eveningFat, weight: eveningLitres }
    ),
    morningSnf,
    eveningSnf,
    averageSnf: combineWeightedAverages(
      { value: morningSnf, weight: morningLitres },
      { value: eveningSnf, weight: eveningLitres }
    ),
    morningDegree,
    eveningDegree,
    averageDegree: combineWeightedAverages(
      { value: morningDegree, weight: morningLitres },
      { value: eveningDegree, weight: eveningLitres }
    )
  };
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
      .select("*")
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
    } else {
      trendQuery = trendQuery.is("cow_id", null);
    }

    if (!cowId) {
      selectedQuery = selectedQuery.is("cow_id", null);
    }

    const [selectedRecords, trendRecords] = await Promise.all([
      selectedQuery.order("date", { ascending: true }),
      trendQuery.order("date", { ascending: true })
    ]);

    if (selectedRecords.error) {
      throw selectedRecords.error;
    }

    if (trendRecords.error) {
      throw trendRecords.error;
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
	        sessionSummary: buildSessionSummary(selectedRecords.data || []),
	        qualitySummary: buildQualitySummary(selectedRecords.data || []),
	        bestDay: bestDay
          ? { date: bestDay.date, litres: bestDay.total }
          : { date: null, litres: 0 },
        worstDay: worstDay
          ? { date: worstDay.date, litres: worstDay.total }
          : { date: null, litres: 0 },
        dailyData,
        dailyRecords: buildDailyRecords(selectedRecords.data || []),
        perCow: [],
        monthlyTrend: buildMonthlyTrend(trendRecords.data || [], month, year)
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
