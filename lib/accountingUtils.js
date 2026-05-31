import { ACCOUNTING_PERIOD_ANNUAL, ACCOUNTING_PERIOD_MONTHLY } from "@/lib/accountingPeriods";
import {
  getMonthRange,
  getMonthInput,
  addMonths,
  getMonthLabel,
  displayFinanceCategory
} from "@/lib/reportUtils";
import { toMarathiNumerals } from "@/lib/marathiUtils";

export const DAIRY_SESSION_MORNING = "सकाळ";
export const DAIRY_SESSION_EVENING = "संध्याकाळ";

export const accountingExpenseCategories = ["चारा", "भूसा", "औषध", "मजुरी", "परिवहन", "इतर"];

export const expenseCategoryMeta = {
  "चारा": { emoji: "🌾", label: "खाद्य/चारा", summaryField: "total_feed_expenses" },
  "भूसा": { emoji: "🥕", summaryField: "total_straw_expenses" },
  "औषध": { emoji: "💊", summaryField: "total_medicine_expenses" },
  "मजुरी": { emoji: "👷", summaryField: "total_labor_expenses" },
  "परिवहन": { emoji: "🚚", summaryField: "total_transport_expenses" },
  "इतर": { emoji: "📝", summaryField: "total_other_expenses" }
};

export function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function monthKeyFromParts(month, year) {
  return `${Number(year)}-${String(Number(month)).padStart(2, "0")}`;
}

function dateMonthParts(dateString) {
  const [year, month] = String(dateString || "").split("-").map(Number);
  return { month, year };
}

export function getMonthYearString(dateOrMonth, year) {
  if (year !== undefined) {
    return monthKeyFromParts(dateOrMonth, year);
  }

  const parts = dateMonthParts(dateOrMonth);
  return monthKeyFromParts(parts.month, parts.year);
}

export function getMonthInputOrCurrent(searchParams) {
  return getMonthInput(searchParams);
}

export function formatCurrencyMarathi(amount) {
  const numberValue = Number(amount || 0);
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(numberValue);

  return `₹ ${toMarathiNumerals(formatted)}`;
}

export function normalizeAccountingExpenseCategory(category) {
  const displayCategory = displayFinanceCategory(category);

  if (displayCategory === "खाद्य" || displayCategory === "चारा") {
    return "चारा";
  }

  if (displayCategory === "भूसा") {
    return "भूसा";
  }

  if (displayCategory === "औषध" || displayCategory === "पशुवैद्यक") {
    return "औषध";
  }

  if (displayCategory === "मजुरी") {
    return "मजुरी";
  }

  if (displayCategory === "वाहतूक" || displayCategory === "परिवहन") {
    return "परिवहन";
  }

  return accountingExpenseCategories.includes(displayCategory) ? displayCategory : "इतर";
}

function normalizeAmount(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? roundMoney(amount) : 0;
}

function isLegacyAnnualFeedExpense(record) {
  const description = String(record?.description || "").trim();

  return (
    record?.type === "खर्च" &&
    normalizeAccountingExpenseCategory(record?.category) === "चारा" &&
    (description.startsWith("मुरघास") || description.startsWith("भुसा"))
  );
}

function getFinanceAccountingPeriod(record) {
  if (record?.accounting_period === ACCOUNTING_PERIOD_ANNUAL) {
    return ACCOUNTING_PERIOD_ANNUAL;
  }

  if (!record?.accounting_period && isLegacyAnnualFeedExpense(record)) {
    return ACCOUNTING_PERIOD_ANNUAL;
  }

  return ACCOUNTING_PERIOD_MONTHLY;
}

function buildFinanceExpenseDescription(record) {
  const details = [
    record?.description ? String(record.description).replace(/\s+/g, " ").trim() : "",
    record?.cows?.name ? `गाय: ${record.cows.name}` : ""
  ].filter(Boolean);

  return details.join(" | ");
}

function getFinanceExpenseDisplayCategory(record) {
  const displayCategory = displayFinanceCategory(record?.category);
  const description = String(record?.description || "").trim();

  if (displayCategory === "चारा" && description.startsWith("खाद्य")) {
    return "खाद्य";
  }

  return displayCategory;
}

export function buildFinanceAccountingExpenses(financeRecords = []) {
  return (financeRecords || [])
    .filter((record) => record?.type === "खर्च")
    .filter((record) => getFinanceAccountingPeriod(record) !== ACCOUNTING_PERIOD_ANNUAL)
    .filter((record) => normalizeAmount(record?.amount) > 0)
    .map((record) => {
      const displayCategory = getFinanceExpenseDisplayCategory(record);

      return {
        id: `finance-${record.id}`,
        farm_id: record.farm_id,
        cow_id: record.cow_id || null,
        expense_date: record.date,
        category: normalizeAccountingExpenseCategory(displayCategory),
        display_category: displayCategory,
        amount: normalizeAmount(record.amount),
        description: buildFinanceExpenseDescription(record),
        vendor_name: null,
        source: "finance_records",
        source_record_id: record.id,
        is_derived: true,
        editable: false
      };
    });
}

function buildHealthExpenseDescription(record) {
  const details = [
    record?.vaccine_name ? `औषध: ${record.vaccine_name}` : record?.type || "आरोग्य नोंद",
    record?.description ? String(record.description).replace(/\s+/g, " ").trim() : "",
    record?.cows?.name ? `गाय: ${record.cows.name}` : "",
    record?.doctor_name ? `पशुवैद्यक: ${record.doctor_name}` : ""
  ].filter(Boolean);

  return details.join(" | ");
}

export function buildHealthAccountingExpenses(healthRecords = []) {
  return (healthRecords || [])
    .filter((record) => normalizeAmount(record?.cost) > 0)
    .map((record) => ({
      id: `health-${record.id}`,
      farm_id: record.farm_id,
      cow_id: record.cow_id || null,
      expense_date: record.date,
      category: "औषध",
      display_category: "औषध",
      amount: normalizeAmount(record.cost),
      description: buildHealthExpenseDescription(record),
      vendor_name: record.doctor_name || null,
      source: "health_records",
      source_record_id: record.id,
      is_derived: true,
      editable: false
    }));
}

export function normalizeMonthlyExpenseRecord(record) {
  const category = normalizeAccountingExpenseCategory(record.category);

  return {
    ...record,
    category,
    display_category: record.display_category || expenseCategoryMeta[category]?.label || record.category,
    amount: normalizeAmount(record.amount),
    source: record.source || "monthly_expenses",
    source_record_id: record.source_record_id || record.id,
    editable: record.editable !== false
  };
}

export function combineAccountingExpenses({
  monthlyExpenses = [],
  financeRecords = [],
  healthRecords = []
} = {}) {
  return [
    ...(monthlyExpenses || []).map(normalizeMonthlyExpenseRecord),
    ...buildFinanceAccountingExpenses(financeRecords),
    ...buildHealthAccountingExpenses(healthRecords)
  ].sort((first, second) => {
    const dateCompare = String(second.expense_date || "").localeCompare(String(first.expense_date || ""));

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(second.id || "").localeCompare(String(first.id || ""));
  });
}

export function getSlipAmount(slip) {
  return roundMoney(slip?.total_amount ?? Number(slip?.liters || 0) * Number(slip?.rate_per_liter || 0));
}

export function summarizeDairySlips(slips = []) {
  const byDate = {};
  let totalLiters = 0;
  let totalAmount = 0;
  let totalRateWeightedLiters = 0;

  slips.forEach((slip) => {
    const date = slip.slip_date;
    const liters = Number(slip.liters || 0);
    const amount = getSlipAmount(slip);

    if (!byDate[date]) {
      byDate[date] = {
        date,
        totalLiters: 0,
        totalAmount: 0,
        sessions: {}
      };
    }

    byDate[date].totalLiters += liters;
    byDate[date].totalAmount += amount;
    byDate[date].sessions[slip.session] = slip;
    totalLiters += liters;
    totalAmount += amount;
    totalRateWeightedLiters += liters;
  });

  const dailyTotals = Object.values(byDate)
    .map((day) => ({
      ...day,
      totalLiters: roundMoney(day.totalLiters),
      totalAmount: roundMoney(day.totalAmount)
    }))
    .sort((first, second) => String(second.date).localeCompare(String(first.date)));
  const daysWithData = dailyTotals.length;
  const sessionCount = slips.length;

  return {
    dailyTotals,
    monthlyTotal: {
      totalLiters: roundMoney(totalLiters),
      totalAmount: roundMoney(totalAmount),
      averageRate: totalRateWeightedLiters > 0 ? roundMoney(totalAmount / totalRateWeightedLiters) : 0,
      daysWithData,
      sessionCount
    }
  };
}

export function summarizeExpenses(expenses = []) {
  const byCategory = accountingExpenseCategories.reduce((groups, category) => {
    groups[category] = 0;
    return groups;
  }, {});

  expenses.forEach((expense) => {
    const category = normalizeAccountingExpenseCategory(expense.category);
    byCategory[category] += Number(expense.amount || 0);
  });

  Object.keys(byCategory).forEach((category) => {
    byCategory[category] = roundMoney(byCategory[category]);
  });

  return {
    byCategory,
    monthlyTotal: roundMoney(Object.values(byCategory).reduce((sum, value) => sum + Number(value || 0), 0))
  };
}

export function summarizeSettlements(settlements = []) {
  return settlements.reduce(
    (summary, settlement) => ({
      totalLiters: roundMoney(summary.totalLiters + Number(settlement.total_liters || 0)),
      totalMilkIncome: roundMoney(summary.totalMilkIncome + Number(settlement.total_milk_income || 0)),
      cattleFeedDeduction: roundMoney(summary.cattleFeedDeduction + Number(settlement.cattle_feed_deduction || 0)),
      otherDeductions: roundMoney(summary.otherDeductions + Number(settlement.other_deductions || 0)),
      totalDeductions: roundMoney(
        summary.totalDeductions +
          Number(settlement.cattle_feed_deduction || 0) +
          Number(settlement.other_deductions || 0)
      ),
      netPayable: roundMoney(
        summary.netPayable +
          Number(settlement.total_milk_income || 0) -
          Number(settlement.cattle_feed_deduction || 0) -
          Number(settlement.other_deductions || 0)
      ),
      received: summary.received + (settlement.payment_received ? 1 : 0)
    }),
    {
      totalLiters: 0,
      totalMilkIncome: 0,
      cattleFeedDeduction: 0,
      otherDeductions: 0,
      totalDeductions: 0,
      netPayable: 0,
      received: 0
    }
  );
}

export function getDeductionsCountedInProfit(settlementSummary = {}) {
  return roundMoney(Number(settlementSummary.cattleFeedDeduction || 0) + Number(settlementSummary.otherDeductions || 0));
}

export function getSettlementAccountingDate(settlement = {}) {
  return settlement.period_end || settlement.settlement_date;
}

function isSlipCoveredBySettlement(slip, settlements = []) {
  return (settlements || []).some(
    (settlement) =>
      settlement?.period_start &&
      settlement?.period_end &&
      slip?.slip_date >= settlement.period_start &&
      slip?.slip_date <= settlement.period_end
  );
}

function summarizeMilkIncomeForMonth(slips = [], settlements = []) {
  const settlementIncome = summarizeSettlements(settlements);
  const uncoveredSlips = (slips || []).filter((slip) => !isSlipCoveredBySettlement(slip, settlements));
  const uncoveredSummary = summarizeDairySlips(uncoveredSlips).monthlyTotal;

  return {
    totalLiters: roundMoney(Number(settlementIncome.totalLiters || 0) + Number(uncoveredSummary.totalLiters || 0)),
    totalAmount: roundMoney(Number(settlementIncome.totalMilkIncome || 0) + Number(uncoveredSummary.totalAmount || 0)),
    settlementLiters: settlementIncome.totalLiters,
    settlementIncome: settlementIncome.totalMilkIncome,
    uncoveredSlipLiters: uncoveredSummary.totalLiters,
    uncoveredSlipAmount: uncoveredSummary.totalAmount
  };
}

export async function calculateSettlementMatch(supabase, farmId, settlement) {
  const { data: slips, error } = await supabase
    .from("dairy_slips")
    .select("*")
    .eq("farm_id", farmId)
    .gte("slip_date", settlement.period_start)
    .lte("slip_date", settlement.period_end)
    .order("slip_date", { ascending: true })
    .order("session", { ascending: true });

  if (error) {
    throw error;
  }

  const expectedLiters = roundMoney((slips || []).reduce((sum, slip) => sum + Number(slip.liters || 0), 0));
  const expectedAmount = roundMoney((slips || []).reduce((sum, slip) => sum + getSlipAmount(slip), 0));
  const actualLiters = Number(settlement.total_liters || 0);
  const actualAmount = Number(settlement.total_milk_income || 0);

  return {
    matchedSlips: slips || [],
    expectedLiters,
    expectedAmount,
    actualLiters: roundMoney(actualLiters),
    actualAmount: roundMoney(actualAmount),
    litersDiscrepancy: roundMoney(actualLiters - expectedLiters),
    discrepancy: roundMoney(actualAmount - expectedAmount),
    matchedSlipIds: (slips || []).map((slip) => slip.id)
  };
}

export async function matchSettlementToSlips(supabase, farmId, settlement) {
  const match = await calculateSettlementMatch(supabase, farmId, settlement);
  const { data, error } = await supabase
    .from("dairy_settlements")
    .update({
      expected_liters: match.expectedLiters,
      expected_amount: match.expectedAmount,
      liters_discrepancy: match.litersDiscrepancy,
      discrepancy: match.discrepancy,
      matched_slips: match.matchedSlipIds
    })
    .eq("id", settlement.id)
    .eq("farm_id", farmId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    settlement: data,
    reconciliation: match
  };
}

export async function refreshMonthlySummary(supabase, farmId, month, year) {
  const monthRange = getMonthRange(month, year);
  const monthYear = getMonthYearString(month, year);

  const [slipsResult, settlementsResult, expensesResult, financeExpensesResult, healthExpensesResult] =
    await Promise.all([
      supabase
        .from("dairy_slips")
        .select("*")
        .eq("farm_id", farmId)
        .gte("slip_date", monthRange.start)
        .lt("slip_date", monthRange.end),
      supabase
        .from("dairy_settlements")
        .select("*")
        .eq("farm_id", farmId)
        .gte("period_end", monthRange.start)
        .lt("period_end", monthRange.end),
      supabase
        .from("monthly_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("expense_date", monthRange.start)
        .lt("expense_date", monthRange.end),
      supabase
        .from("finance_records")
        .select("id, farm_id, cow_id, date, type, category, amount, accounting_period, description, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end),
      supabase
        .from("health_records")
        .select("id, farm_id, cow_id, date, type, description, doctor_name, cost, vaccine_name, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end)
    ]);

  const firstError = [
    slipsResult.error,
    settlementsResult.error,
    expensesResult.error,
    financeExpensesResult.error,
    healthExpensesResult.error
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  const settlementSummary = summarizeSettlements(settlementsResult.data || []);
  const milkIncomeSummary = summarizeMilkIncomeForMonth(slipsResult.data || [], settlementsResult.data || []);
  const allExpenses = combineAccountingExpenses({
    monthlyExpenses: expensesResult.data || [],
    financeRecords: financeExpensesResult.data || [],
    healthRecords: healthExpensesResult.data || []
  });
  const expenseSummary = summarizeExpenses(allExpenses);
  const payload = {
    farm_id: farmId,
    month_year: monthYear,
    total_milk_income: milkIncomeSummary.totalAmount,
    total_liters: milkIncomeSummary.totalLiters,
    total_feed_expenses: expenseSummary.byCategory["चारा"] || 0,
    total_straw_expenses: expenseSummary.byCategory["भूसा"] || 0,
    total_medicine_expenses: expenseSummary.byCategory["औषध"] || 0,
    total_labor_expenses: expenseSummary.byCategory["मजुरी"] || 0,
    total_transport_expenses: expenseSummary.byCategory["परिवहन"] || 0,
    total_other_expenses: expenseSummary.byCategory["इतर"] || 0,
    total_dairy_deductions: getDeductionsCountedInProfit(settlementSummary),
    last_updated: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("monthly_summary")
    .upsert(payload, { onConflict: "farm_id,month_year" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function refreshSummaryForDate(supabase, farmId, dateString) {
  const { month, year } = dateMonthParts(dateString);
  return refreshMonthlySummary(supabase, farmId, month, year);
}

export async function refreshSettlementSummaries(supabase, farmId, settlement = {}) {
  const accountingDate = getSettlementAccountingDate(settlement);
  const dates = Array.from(new Set([accountingDate, settlement.settlement_date].filter(Boolean)));
  let accountingSummary = null;

  for (const date of dates) {
    const summary = await refreshSummaryForDate(supabase, farmId, date);
    if (date === accountingDate) {
      accountingSummary = summary;
    }
  }

  return accountingSummary;
}

export async function getOrCreateMonthlySummary(supabase, farmId, month, year) {
  const monthYear = getMonthYearString(month, year);
  const { data, error } = await supabase
    .from("monthly_summary")
    .select("*")
    .eq("farm_id", farmId)
    .eq("month_year", monthYear)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || refreshMonthlySummary(supabase, farmId, month, year);
}

export async function generateMonthlyReport(supabase, farmId, month, year) {
  const monthRange = getMonthRange(month, year);
  const [slipsResult, settlementsResult, expensesResult, financeExpensesResult, healthExpensesResult, summary] =
    await Promise.all([
      supabase
        .from("dairy_slips")
        .select("*")
        .eq("farm_id", farmId)
        .gte("slip_date", monthRange.start)
        .lt("slip_date", monthRange.end)
        .order("slip_date", { ascending: false }),
      supabase
        .from("dairy_settlements")
        .select("*")
        .eq("farm_id", farmId)
        .gte("period_end", monthRange.start)
        .lt("period_end", monthRange.end)
        .order("period_end", { ascending: false }),
      supabase
        .from("monthly_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("expense_date", monthRange.start)
        .lt("expense_date", monthRange.end)
        .order("expense_date", { ascending: false }),
      supabase
        .from("finance_records")
        .select("id, farm_id, cow_id, date, type, category, amount, accounting_period, description, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("health_records")
        .select("id, farm_id, cow_id, date, type, description, doctor_name, cost, vaccine_name, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      refreshMonthlySummary(supabase, farmId, month, year)
    ]);

  const firstError = [
    slipsResult.error,
    settlementsResult.error,
    expensesResult.error,
    financeExpensesResult.error,
    healthExpensesResult.error
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  const slipSummary = summarizeDairySlips(slipsResult.data || []);
  const settlementSummary = summarizeSettlements(settlementsResult.data || []);
  const allExpenses = combineAccountingExpenses({
    monthlyExpenses: expensesResult.data || [],
    financeRecords: financeExpensesResult.data || [],
    healthRecords: healthExpensesResult.data || []
  });
  const expenseSummary = summarizeExpenses(allExpenses);

  return {
    month,
    year,
    label: getMonthLabel(month, year),
    range: monthRange,
    slips: slipsResult.data || [],
    settlements: settlementsResult.data || [],
    expenses: allExpenses,
    monthlyExpenses: (expensesResult.data || []).map(normalizeMonthlyExpenseRecord),
    financeExpenses: buildFinanceAccountingExpenses(financeExpensesResult.data || []),
    healthExpenses: buildHealthAccountingExpenses(healthExpensesResult.data || []),
    dailyTotals: slipSummary.dailyTotals,
    milk: slipSummary.monthlyTotal,
    settlementsSummary: settlementSummary,
    expensesSummary: expenseSummary,
    summary
  };
}

export async function buildProfitTrend(supabase, farmId, month, year) {
  const months = Array.from({ length: 6 }, (_, index) => addMonths(month, year, index - 5));
  const summaries = [];

  for (const item of months) {
    const summary = await refreshMonthlySummary(supabase, farmId, item.month, item.year);
    summaries.push({
      month: item.month,
      year: item.year,
      label: getMonthLabel(item.month, item.year),
      netProfit: Number(summary.net_profit || 0),
      income: Number(summary.total_milk_income || 0),
      expense: Number(summary.total_all_expenses || 0),
      deductions: Number(summary.total_dairy_deductions || 0)
    });
  }

  return summaries;
}
