import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  analyzeSettlementSessionCoverage,
  summarizeMilkSessionsForMonth
} from "@/lib/accountingUtils";
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

function buildMonthlyTrendFromAccounting(slips, settlements, selectedMonth, selectedYear) {
  const months = Array.from({ length: 6 }, (_, index) =>
    addMonths(selectedMonth, selectedYear, index - 5)
  );

  return months.map(({ month, year }) => {
    const key = `${year}-${padDatePart(month)}`;
    const monthRange = getMonthRange(month, year);
    const monthSlips = (slips || []).filter((slip) => slip.slip_date >= monthRange.start && slip.slip_date < monthRange.end);
    const monthSettlements = (settlements || []).filter((settlement) => {
      const accountingDate = settlement.period_end || settlement.settlement_date;
      return accountingDate >= monthRange.start && accountingDate < monthRange.end;
    });
    const summary = summarizeMilkSessionsForMonth(monthSlips, monthSettlements).monthlyTotal;

    return {
      month,
      year,
      label: getMonthLabel(month, year),
      total: Number((summary.totalLiters || 0).toFixed(2)),
      current: month === selectedMonth && year === selectedYear
    };
  });
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthInput = getMonthInput(searchParams);

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
      .lt("date", monthRange.end)
      .is("cow_id", null);

    const [selectedRecords, selectedSlips, trendSlips, selectedSettlements, trendSettlements] = await Promise.all([
      selectedQuery.order("date", { ascending: true }),
      supabase
        .from("dairy_slips")
        .select("*")
        .eq("farm_id", farmId)
        .gte("slip_date", monthRange.start)
        .lt("slip_date", monthRange.end)
        .order("slip_date", { ascending: true }),
      supabase
        .from("dairy_slips")
        .select("*")
        .eq("farm_id", farmId)
        .gte("slip_date", oldestRange.start)
        .lt("slip_date", monthRange.end)
        .order("slip_date", { ascending: true }),
      supabase
        .from("dairy_settlements")
        .select("id, settlement_date, period_start, period_end, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, ai_raw_data")
        .eq("farm_id", farmId)
        .gte("period_end", monthRange.start)
        .lt("period_end", monthRange.end),
      supabase
        .from("dairy_settlements")
        .select("id, settlement_date, period_start, period_end, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, ai_raw_data")
        .eq("farm_id", farmId)
        .gte("period_end", oldestRange.start)
        .lt("period_end", monthRange.end)
    ]);

    if (selectedRecords.error) {
      throw selectedRecords.error;
    }

    const firstAccountingError = [
      selectedSlips.error,
      trendSlips.error,
      selectedSettlements.error,
      trendSettlements.error
    ].find(Boolean);

    if (firstAccountingError) {
      throw firstAccountingError;
    }

    const stats = calculateMilkStats(selectedRecords.data || [], monthRange.daysInMonth);
    const accountingMilk = summarizeMilkSessionsForMonth(selectedSlips.data || [], selectedSettlements.data || []).monthlyTotal;
    const usesSettlementPrintedTotals = accountingMilk.source === "settlement_printed_totals";
    const recordSessionSummary = buildSessionSummary(selectedRecords.data || []);
    const sessionSummary = {
      ...recordSessionSummary,
      morningLitres: accountingMilk.morningLiters,
      eveningLitres: accountingMilk.eveningLiters,
      totalLitres: accountingMilk.totalLiters,
      totalAmount: accountingMilk.totalAmount,
      averageRate: accountingMilk.averageRate,
      daysWithMilk: accountingMilk.daysWithData,
      source: accountingMilk.source
    };
    const dailyData = fillDailyData(
      selectedRecords.data || [],
      month,
      year,
      monthRange.daysInMonth
    );

    const nonZeroDailyData = dailyData.filter((day) => Number(day.total || 0) > 0);
    const bestDay = nonZeroDailyData.reduce(
      (best, day) => (day.total > best.total ? day : best),
      nonZeroDailyData[0] || null
    );
    const worstDay = nonZeroDailyData.reduce(
      (worst, day) => (day.total < worst.total ? day : worst),
      nonZeroDailyData[0] || null
    );

    return NextResponse.json({
      data: {
        month,
        year,
        totalLitres: Number((accountingMilk.totalLiters || 0).toFixed(2)),
        dailyAverage: Number(
          (accountingMilk.daysWithData > 0 ? accountingMilk.totalLiters / accountingMilk.daysWithData : 0).toFixed(2)
        ),
        rowTotalLitres: Number(stats.total.toFixed(2)),
        sessionSummary,
        qualitySummary: buildQualitySummary(selectedRecords.data || []),
        bestDay: bestDay
          ? {
              date: bestDay.date,
              litres: bestDay.total,
              source: usesSettlementPrintedTotals ? "daily_records_audit" : "milk_records"
            }
          : { date: null, litres: 0 },
        worstDay: worstDay
          ? {
              date: worstDay.date,
              litres: worstDay.total,
              source: usesSettlementPrintedTotals ? "daily_records_audit" : "milk_records"
            }
          : { date: null, litres: 0 },
        dailyDataSource: usesSettlementPrintedTotals ? "daily_records_audit" : "milk_records",
        dailyData,
        dailyRecords: buildDailyRecords(selectedRecords.data || []),
        settlementSessionAudits: (selectedSettlements.data || []).map(analyzeSettlementSessionCoverage),
        perCow: [],
        monthlyTrend: buildMonthlyTrendFromAccounting(trendSlips.data || [], trendSettlements.data || [], month, year)
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
