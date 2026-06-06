import {
  combineAccountingExpenses,
  getSettlementPrintedSessionTotals,
  roundMoney,
  summarizeFinanceIncome,
  summarizeExpenses
} from "@/lib/accountingUtils";
import { getRecordMilkAmount, getRecordMilkTotal } from "@/lib/reportUtils";
import { getIndiaTodayISODate, normalizeToolDateRange } from "@/lib/aiAssistantDate";

const MORNING = "सकाळ";
const EVENING = "संध्याकाळ";

function numberOrZero(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function dateIsCoveredBySettlements(date, settlements = []) {
  return settlements.some(
    (settlement) =>
      settlement.period_start &&
      settlement.period_end &&
      date >= settlement.period_start &&
      date <= settlement.period_end
  );
}

function isSettlementFullyInsideRange(settlement, startDate, endDate) {
  return (
    settlement.period_start &&
    settlement.period_end &&
    settlement.period_start >= startDate &&
    settlement.period_end <= endDate
  );
}

function ensureDailyBucket(map, date) {
  if (!map.has(date)) {
    map.set(date, {
      date,
      morningMilk: 0,
      eveningMilk: 0,
      totalMilk: 0,
      revenue: 0,
      morningFromSlips: false,
      eveningFromSlips: false,
      fatWeightedTotal: 0,
      fatWeight: 0,
      snfWeightedTotal: 0,
      snfWeight: 0,
      sources: []
    });
  }

  return map.get(date);
}

function addQuality(bucket, liters, fat, snf) {
  const weight = numberOrZero(liters);

  if (weight <= 0) {
    return;
  }

  const fatValue = optionalNumber(fat);
  const snfValue = optionalNumber(snf);

  if (fatValue !== null) {
    bucket.fatWeightedTotal += fatValue * weight;
    bucket.fatWeight += weight;
  }

  if (snfValue !== null) {
    bucket.snfWeightedTotal += snfValue * weight;
    bucket.snfWeight += weight;
  }
}

function addSession(bucket, session, liters, revenue, source, quality = {}) {
  const litreValue = numberOrZero(liters);
  const revenueValue = numberOrZero(revenue);

  if (session === MORNING) {
    bucket.morningMilk += litreValue;
    if (source === "dairy_slips") bucket.morningFromSlips = true;
  } else if (session === EVENING) {
    bucket.eveningMilk += litreValue;
    if (source === "dairy_slips") bucket.eveningFromSlips = true;
  }

  bucket.totalMilk += litreValue;
  bucket.revenue += revenueValue;
  bucket.sources.push(source);
  addQuality(bucket, litreValue, quality.fat, quality.snf);
}

function finalizeDailyBucket(bucket) {
  return {
    date: bucket.date,
    morningMilk: roundMoney(bucket.morningMilk),
    eveningMilk: roundMoney(bucket.eveningMilk),
    totalMilk: roundMoney(bucket.totalMilk),
    revenue: roundMoney(bucket.revenue),
    averageFat: bucket.fatWeight > 0 ? roundMoney(bucket.fatWeightedTotal / bucket.fatWeight) : null,
    averageSNF: bucket.snfWeight > 0 ? roundMoney(bucket.snfWeightedTotal / bucket.snfWeight) : null,
    source: Array.from(new Set(bucket.sources)).join("+") || "none"
  };
}

async function fetchDairySlips(supabase, farmId, startDate, endDate) {
  const { data, error } = await supabase
    .from("dairy_slips")
    .select("id, slip_date, session, liters, fat_percentage, snf_percentage, rate_per_liter, total_amount")
    .eq("farm_id", farmId)
    .gte("slip_date", startDate)
    .lte("slip_date", endDate)
    .order("slip_date", { ascending: true })
    .order("session", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchMilkRecords(supabase, farmId, startDate, endDate) {
  const { data, error } = await supabase
    .from("milk_records")
    .select(
      "id, date, cow_id, morning_litres, evening_litres, total_litres, price_per_litre, morning_price_per_litre, evening_price_per_litre, total_amount, fat_percentage, morning_fat_percentage, evening_fat_percentage, snf_value, morning_snf_value, evening_snf_value"
    )
    .eq("farm_id", farmId)
    .is("cow_id", null)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchSettlements(supabase, farmId, startDate, endDate) {
  const { data, error } = await supabase
    .from("dairy_settlements")
    .select("id, period_start, period_end, settlement_date, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, morning_total_liters, evening_total_liters, session_totals, ai_raw_data")
    .eq("farm_id", farmId)
    .lte("period_start", endDate)
    .gte("period_end", startDate);

  if (error) {
    throw error;
  }

  return data || [];
}

async function fetchExpenseInputs(supabase, farmId, startDate, endDate) {
  const [monthlyExpensesResult, financeRecordsResult, healthRecordsResult, aiRecordsResult] = await Promise.all([
    supabase
      .from("monthly_expenses")
      .select("*")
      .eq("farm_id", farmId)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate),
    supabase
      .from("finance_records")
      .select("id, farm_id, cow_id, date, type, category, amount, accounting_period, description, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("health_records")
      .select("id, farm_id, cow_id, date, type, description, doctor_name, cost, vaccine_name, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .gt("cost", 0)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("ai_records")
      .select("id, farm_id, cow_id, ai_date, cost, bull_breed, bull_code, doctor_name, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .gt("cost", 0)
      .gte("ai_date", startDate)
      .lte("ai_date", endDate)
  ]);

  const firstError = [
    monthlyExpensesResult.error,
    financeRecordsResult.error,
    healthRecordsResult.error,
    aiRecordsResult.error
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  return {
    monthlyExpenses: monthlyExpensesResult.data || [],
    financeRecords: financeRecordsResult.data || [],
    healthRecords: healthRecordsResult.data || [],
    aiRecords: aiRecordsResult.data || []
  };
}

async function fetchFinanceIncomeRecords(supabase, farmId, startDate, endDate) {
  const { data, error } = await supabase
    .from("finance_records")
    .select("id, date, type, category, amount, accounting_period")
    .eq("farm_id", farmId)
    .eq("type", "उत्पन्न")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    throw error;
  }

  return data || [];
}

async function summarizeExpenseRange(supabase, farmId, startDate, endDate) {
  const [expenseInputs, settlements] = await Promise.all([
    fetchExpenseInputs(supabase, farmId, startDate, endDate),
    fetchSettlements(supabase, farmId, startDate, endDate)
  ]);
  const combinedExpenses = combineAccountingExpenses(expenseInputs);
  const expenseSummary = summarizeExpenses(combinedExpenses);
  const fullSettlements = settlements.filter((settlement) =>
    isSettlementFullyInsideRange(settlement, startDate, endDate)
  );
  const feedDeductions = fullSettlements.reduce(
    (sum, settlement) => sum + numberOrZero(settlement.cattle_feed_deduction),
    0
  );
  const otherDeductions = fullSettlements.reduce(
    (sum, settlement) => sum + numberOrZero(settlement.other_deductions),
    0
  );
  const dairyDeductions = roundMoney(feedDeductions + otherDeductions);

  return {
    directExpense: expenseSummary.monthlyTotal,
    byCategory: expenseSummary.byCategory,
    feedDeductions: roundMoney(feedDeductions),
    otherDeductions: roundMoney(otherDeductions),
    dairyDeductions,
    totalExpense: roundMoney(expenseSummary.monthlyTotal + dairyDeductions),
    expenseCount: combinedExpenses.length,
    settlementCount: fullSettlements.length
  };
}

async function buildDailyCollection(supabase, farmId, startDate, endDate) {
  const [slips, milkRecords] = await Promise.all([
    fetchDairySlips(supabase, farmId, startDate, endDate),
    fetchMilkRecords(supabase, farmId, startDate, endDate)
  ]);
  const byDate = new Map();

  slips.forEach((slip) => {
    const bucket = ensureDailyBucket(byDate, slip.slip_date);
    addSession(
      bucket,
      slip.session,
      slip.liters,
      slip.total_amount ?? numberOrZero(slip.liters) * numberOrZero(slip.rate_per_liter),
      "dairy_slips",
      {
        fat: slip.fat_percentage,
        snf: slip.snf_percentage
      }
    );
  });

  milkRecords.forEach((record) => {
    const bucket = ensureDailyBucket(byDate, record.date);
    const hasMorningSlip = bucket.morningFromSlips;
    const hasEveningSlip = bucket.eveningFromSlips;

    if (!hasMorningSlip && numberOrZero(record.morning_litres) > 0) {
      addSession(
        bucket,
        MORNING,
        record.morning_litres,
        numberOrZero(record.morning_litres) *
          numberOrZero(record.morning_price_per_litre ?? record.price_per_litre),
        "milk_records",
        {
          fat: record.morning_fat_percentage ?? record.fat_percentage,
          snf: record.morning_snf_value ?? record.snf_value
        }
      );
    }

    if (!hasEveningSlip && numberOrZero(record.evening_litres) > 0) {
      addSession(
        bucket,
        EVENING,
        record.evening_litres,
        numberOrZero(record.evening_litres) *
          numberOrZero(record.evening_price_per_litre ?? record.price_per_litre),
        "milk_records",
        {
          fat: record.evening_fat_percentage ?? record.fat_percentage,
          snf: record.evening_snf_value ?? record.snf_value
        }
      );
    }

    if (!hasMorningSlip && !hasEveningSlip && bucket.totalMilk === 0 && getRecordMilkTotal(record) > 0) {
      bucket.totalMilk += getRecordMilkTotal(record);
      bucket.revenue += getRecordMilkAmount(record);
      bucket.sources.push("milk_records");
      addQuality(bucket, getRecordMilkTotal(record), record.fat_percentage, record.snf_value);
    }
  });

  return Array.from(byDate.values())
    .map(finalizeDailyBucket)
    .filter((day) => day.totalMilk > 0)
    .sort((first, second) => first.date.localeCompare(second.date));
}

function summarizeDailyCollection(days, dayCount) {
  const totalMilk = roundMoney(days.reduce((sum, day) => sum + numberOrZero(day.totalMilk), 0));
  const morningMilk = roundMoney(days.reduce((sum, day) => sum + numberOrZero(day.morningMilk), 0));
  const eveningMilk = roundMoney(days.reduce((sum, day) => sum + numberOrZero(day.eveningMilk), 0));
  const revenue = roundMoney(days.reduce((sum, day) => sum + numberOrZero(day.revenue), 0));

  return {
    totalMilk,
    morningMilk,
    eveningMilk,
    revenue,
    dataDays: days.length,
    dayCount,
    averageMilk: dayCount > 0 ? roundMoney(totalMilk / dayCount) : 0,
    averageMilkOnDataDays: days.length > 0 ? roundMoney(totalMilk / days.length) : 0
  };
}

async function summarizeRangeMilk(supabase, farmId, startDate, endDate, dayCount, session = "total") {
  const [days, settlements] = await Promise.all([
    buildDailyCollection(supabase, farmId, startDate, endDate),
    fetchSettlements(supabase, farmId, startDate, endDate)
  ]);
  const fullSettlements = settlements.filter((settlement) =>
    isSettlementFullyInsideRange(settlement, startDate, endDate)
  );
  const settlementCoverage =
    session === "total"
      ? fullSettlements
      : fullSettlements.filter((settlement) => getSettlementPrintedSessionTotals(settlement).hasPrintedSessionTotals);
  const uncoveredDays = days.filter((day) => !dateIsCoveredBySettlements(day.date, settlementCoverage));
  const daySummary = summarizeDailyCollection(uncoveredDays, dayCount);
  const settlementSummary = fullSettlements.reduce(
    (summary, settlement) => {
      const printed = getSettlementPrintedSessionTotals(settlement);
      const totalMilk = printed.hasPrintedSessionTotals
        ? printed.totalLiters
        : numberOrZero(settlement.total_liters);

      return {
        totalMilk: roundMoney(summary.totalMilk + totalMilk),
        morningMilk: roundMoney(summary.morningMilk + (printed.hasPrintedSessionTotals ? printed.morningLiters : 0)),
        eveningMilk: roundMoney(summary.eveningMilk + (printed.hasPrintedSessionTotals ? printed.eveningLiters : 0)),
        settlementCount: summary.settlementCount + 1
      };
    },
    { totalMilk: 0, morningMilk: 0, eveningMilk: 0, settlementCount: 0 }
  );

  const totalMilk = roundMoney(daySummary.totalMilk + settlementSummary.totalMilk);
  const morningMilk = roundMoney(daySummary.morningMilk + settlementSummary.morningMilk);
  const eveningMilk = roundMoney(daySummary.eveningMilk + settlementSummary.eveningMilk);

  return {
    totalMilk,
    morningMilk,
    eveningMilk,
    dataDays: uncoveredDays.length + fullSettlements.reduce((sum, settlement) => {
      if (!settlement.period_start || !settlement.period_end) return sum;
      return sum + Math.max(1, Math.round((new Date(`${settlement.period_end}T00:00:00Z`) - new Date(`${settlement.period_start}T00:00:00Z`)) / 86400000) + 1);
    }, 0),
    dayCount,
    averageMilk: dayCount > 0 ? roundMoney(totalMilk / dayCount) : 0,
    settlementCount: settlementSummary.settlementCount,
    source: settlementSummary.settlementCount > 0 ? "dairy_settlements+dairy_slips" : "dairy_slips/milk_records"
  };
}

function noData(range) {
  return {
    ...range,
    noData: true,
    message: "या कालावधीसाठी माहिती उपलब्ध नाही."
  };
}

export async function getTodayMilkCollection({ supabase, farmId }) {
  const today = getIndiaTodayISODate();
  const days = await buildDailyCollection(supabase, farmId, today, today);
  const summary = summarizeDailyCollection(days, 1);

  return {
    date: today,
    morningMilk: summary.morningMilk,
    eveningMilk: summary.eveningMilk,
    totalMilk: summary.totalMilk,
    noData: summary.totalMilk <= 0,
    source: days[0]?.source || "none"
  };
}

export async function getHighestMilkDay({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const days = await buildDailyCollection(supabase, farmId, range.startDate, range.endDate);

  if (!days.length) {
    return noData(range);
  }

  const best = days.reduce((top, day) => (day.totalMilk > top.totalMilk ? day : top), days[0]);

  return {
    ...range,
    date: best.date,
    totalMilk: best.totalMilk,
    morningMilk: best.morningMilk,
    eveningMilk: best.eveningMilk,
    dataDays: days.length
  };
}

export async function getLowestMilkDay({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const days = await buildDailyCollection(supabase, farmId, range.startDate, range.endDate);

  if (!days.length) {
    return noData(range);
  }

  const lowest = days.reduce((low, day) => (day.totalMilk < low.totalMilk ? day : low), days[0]);

  return {
    ...range,
    date: lowest.date,
    totalMilk: lowest.totalMilk,
    morningMilk: lowest.morningMilk,
    eveningMilk: lowest.eveningMilk,
    dataDays: days.length
  };
}

export async function getAverageMilk({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const summary = await summarizeRangeMilk(supabase, farmId, range.startDate, range.endDate, range.dayCount);

  if (summary.totalMilk <= 0) {
    return noData(range);
  }

  return { ...range, ...summary };
}

export async function getTotalMilk({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const summary = await summarizeRangeMilk(supabase, farmId, range.startDate, range.endDate, range.dayCount);

  if (summary.totalMilk <= 0) {
    return noData(range);
  }

  return { ...range, totalMilk: summary.totalMilk, dataDays: summary.dataDays, source: summary.source };
}

export async function getRevenue({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const [days, settlements] = await Promise.all([
    buildDailyCollection(supabase, farmId, range.startDate, range.endDate),
    fetchSettlements(supabase, farmId, range.startDate, range.endDate)
  ]);
  const fullSettlements = settlements.filter((settlement) =>
    isSettlementFullyInsideRange(settlement, range.startDate, range.endDate)
  );
  const settlementRevenue = fullSettlements.reduce(
    (sum, settlement) => sum + numberOrZero(settlement.total_milk_income),
    0
  );
  const uncoveredRevenue = days
    .filter((day) => !dateIsCoveredBySettlements(day.date, fullSettlements))
    .reduce((sum, day) => sum + numberOrZero(day.revenue), 0);
  const revenue = roundMoney(settlementRevenue + uncoveredRevenue);

  if (revenue <= 0) {
    return noData(range);
  }

  return {
    ...range,
    revenue,
    settlementRevenue: roundMoney(settlementRevenue),
    dailySlipRevenue: roundMoney(uncoveredRevenue),
    settlementCount: fullSettlements.length
  };
}

async function getWeightedQuality({ supabase, farmId, args, quality }) {
  const range = normalizeToolDateRange(args);
  const days = await buildDailyCollection(supabase, farmId, range.startDate, range.endDate);
  const key = quality === "fat" ? "averageFat" : "averageSNF";
  const weighted = days.reduce(
    (summary, day) => {
      const value = optionalNumber(day[key]);

      if (value === null || day.totalMilk <= 0) {
        return summary;
      }

      return {
        total: summary.total + value * day.totalMilk,
        weight: summary.weight + day.totalMilk
      };
    },
    { total: 0, weight: 0 }
  );
  const average = weighted.weight > 0 ? roundMoney(weighted.total / weighted.weight) : null;

  if (average === null) {
    return noData(range);
  }

  return {
    ...range,
    [quality === "fat" ? "averageFat" : "averageSNF"]: average,
    dataDays: days.length
  };
}

export async function getAverageFat(context) {
  return getWeightedQuality({ ...context, quality: "fat" });
}

export async function getAverageSNF(context) {
  return getWeightedQuality({ ...context, quality: "snf" });
}

export async function getMorningMilk({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const summary = await summarizeRangeMilk(supabase, farmId, range.startDate, range.endDate, range.dayCount, "morning");

  if (summary.morningMilk <= 0) {
    return noData(range);
  }

  return {
    ...range,
    morningMilk: summary.morningMilk,
    totalMilk: summary.totalMilk,
    dataDays: summary.dataDays,
    source: summary.source
  };
}

export async function getEveningMilk({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const summary = await summarizeRangeMilk(supabase, farmId, range.startDate, range.endDate, range.dayCount, "evening");

  if (summary.eveningMilk <= 0) {
    return noData(range);
  }

  return {
    ...range,
    eveningMilk: summary.eveningMilk,
    totalMilk: summary.totalMilk,
    dataDays: summary.dataDays,
    source: summary.source
  };
}

export async function getExpenses({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const summary = await summarizeExpenseRange(supabase, farmId, range.startDate, range.endDate);

  if (summary.totalExpense <= 0) {
    return noData(range);
  }

  return { ...range, ...summary };
}

export async function getProfit({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const [revenue, expenses, financeIncomeRecords] = await Promise.all([
    getRevenue({ supabase, farmId, args }),
    summarizeExpenseRange(supabase, farmId, range.startDate, range.endDate),
    fetchFinanceIncomeRecords(supabase, farmId, range.startDate, range.endDate)
  ]);
  const incomeSummary = summarizeFinanceIncome(financeIncomeRecords, numberOrZero(revenue.revenue));

  if (incomeSummary.totalIncome <= 0 && expenses.totalExpense <= 0) {
    return noData(range);
  }

  return {
    ...range,
    revenue: numberOrZero(revenue.revenue),
    totalIncome: incomeSummary.totalIncome,
    otherIncome: incomeSummary.otherIncome,
    totalExpense: expenses.totalExpense,
    directExpense: expenses.directExpense,
    dairyDeductions: expenses.dairyDeductions,
    netProfit: roundMoney(incomeSummary.totalIncome - expenses.totalExpense)
  };
}

export async function getMilkTrend({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const days = await buildDailyCollection(supabase, farmId, range.startDate, range.endDate);

  if (!days.length) {
    return noData(range);
  }

  return {
    ...range,
    points: days.slice(-45).map((day) => ({
      date: day.date,
      totalMilk: day.totalMilk,
      morningMilk: day.morningMilk,
      eveningMilk: day.eveningMilk
    })),
    totalMilk: roundMoney(days.reduce((sum, day) => sum + day.totalMilk, 0)),
    dataDays: days.length
  };
}

export async function getMonthlySummary({ supabase, farmId, args }) {
  const range = normalizeToolDateRange(args);
  const [milk, revenue, expenses, financeIncomeRecords] = await Promise.all([
    summarizeRangeMilk(supabase, farmId, range.startDate, range.endDate, range.dayCount),
    getRevenue({ supabase, farmId, args }),
    summarizeExpenseRange(supabase, farmId, range.startDate, range.endDate),
    fetchFinanceIncomeRecords(supabase, farmId, range.startDate, range.endDate)
  ]);
  const revenueValue = numberOrZero(revenue.revenue);
  const incomeSummary = summarizeFinanceIncome(financeIncomeRecords, revenueValue);

  if (milk.totalMilk <= 0 && incomeSummary.totalIncome <= 0 && expenses.totalExpense <= 0) {
    return noData(range);
  }

  return {
    ...range,
    totalMilk: milk.totalMilk,
    morningMilk: milk.morningMilk,
    eveningMilk: milk.eveningMilk,
    averageMilk: milk.averageMilk,
    revenue: revenueValue,
    totalIncome: incomeSummary.totalIncome,
    otherIncome: incomeSummary.otherIncome,
    totalExpense: expenses.totalExpense,
    directExpense: expenses.directExpense,
    dairyDeductions: expenses.dairyDeductions,
    netProfit: roundMoney(incomeSummary.totalIncome - expenses.totalExpense)
  };
}

export async function getFarmStatus({ supabase, farmId }) {
  const today = getIndiaTodayISODate();
  const monthStart = `${today.slice(0, 7)}-01`;
  const todayMilk = await getTodayMilkCollection({ supabase, farmId });
  const monthSummary = await getMonthlySummary({
    supabase,
    farmId,
    args: { startDate: monthStart, endDate: today }
  });

  return {
    date: today,
    todayMilk,
    currentMonth: monthSummary
  };
}

export const aiAssistantToolHandlers = {
  getTodayMilkCollection,
  getHighestMilkDay,
  getLowestMilkDay,
  getAverageMilk,
  getTotalMilk,
  getRevenue,
  getAverageFat,
  getAverageSNF,
  getMorningMilk,
  getEveningMilk,
  getExpenses,
  getProfit,
  getMilkTrend,
  getMonthlySummary,
  getFarmStatus
};
