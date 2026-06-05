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
  "चारा": { emoji: "🌾", label: "खाद्य नोंदी", summaryField: "total_feed_expenses" },
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

export function isKhadyaExpenseCategory(category) {
  const displayCategory = displayFinanceCategory(category);
  const normalizedCategory = normalizeAccountingExpenseCategory(category);

  return displayCategory === "खाद्य" || displayCategory === "चारा" || normalizedCategory === "चारा";
}

export function isManualKhadyaInfoExpense(record = {}) {
  if (record?.source === "dairy_settlements") {
    return false;
  }

  return false;
}

export function markManualKhadyaInfoExpense(record = {}) {
  const infoOnly = false;

  return {
    ...record,
    info_only: infoOnly,
    counts_in_profit: !infoOnly
  };
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
    })
    .map(markManualKhadyaInfoExpense);
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

export function buildAIAccountingExpenses(aiRecords = []) {
  return (aiRecords || [])
    .filter((record) => normalizeAmount(record?.cost) > 0)
    .map((record) => ({
      id: `ai-${record.id}`,
      farm_id: record.farm_id,
      cow_id: record.cow_id || null,
      expense_date: record.ai_date,
      category: "इतर",
      display_category: "रेतन खर्च",
      amount: normalizeAmount(record.cost),
      description: [
        "कृत्रिम रेतन",
        record?.bull_breed ? `बैल जात: ${record.bull_breed}` : "",
        record?.bull_code ? `बैल कोड: ${record.bull_code}` : "",
        record?.doctor_name ? `डॉक्टर: ${record.doctor_name}` : "",
        record?.cows?.name ? `गाय: ${record.cows.name}` : ""
      ].filter(Boolean).join(" | "),
      vendor_name: record.doctor_name || null,
      source: "ai_records",
      source_record_id: record.id,
      is_derived: true,
      editable: false
    }));
}

export function summarizeFinanceIncome(financeRecords = [], milkIncomeAmount = 0) {
  const monthlyIncomeRecords = (financeRecords || [])
    .filter((record) => record?.type === "उत्पन्न")
    .filter((record) => getFinanceAccountingPeriod(record) !== ACCOUNTING_PERIOD_ANNUAL);
  const manualMilkIncome = monthlyIncomeRecords
    .filter((record) => displayFinanceCategory(record?.category) === "दूध विक्री")
    .reduce((sum, record) => sum + normalizeAmount(record?.amount), 0);
  const otherIncome = monthlyIncomeRecords
    .filter((record) => displayFinanceCategory(record?.category) !== "दूध विक्री")
    .reduce((sum, record) => sum + normalizeAmount(record?.amount), 0);
  const milkIncome = normalizeAmount(milkIncomeAmount);
  const countedMilkIncome = Math.max(milkIncome, manualMilkIncome);

  return {
    milkIncome,
    manualMilkIncome: roundMoney(manualMilkIncome),
    countedMilkIncome: roundMoney(countedMilkIncome),
    otherIncome: roundMoney(otherIncome),
    totalIncome: roundMoney(countedMilkIncome + otherIncome),
    incomeAdjustment: roundMoney(Math.max(0, manualMilkIncome - milkIncome))
  };
}

function getSummaryExpenseTotal(summary = {}) {
  if (summary.total_all_expenses !== undefined && summary.total_all_expenses !== null) {
    return normalizeAmount(summary.total_all_expenses);
  }

  return roundMoney(
    Number(summary.total_feed_expenses || 0) +
      Number(summary.total_straw_expenses || 0) +
      Number(summary.total_medicine_expenses || 0) +
      Number(summary.total_labor_expenses || 0) +
      Number(summary.total_transport_expenses || 0) +
      Number(summary.total_other_expenses || 0)
  );
}

export function applyFinanceIncomeToSummary(summary = {}, financeRecords = [], milkIncomeAmount = null) {
  if (!summary) {
    return summary;
  }

  const milkIncome = milkIncomeAmount === null || milkIncomeAmount === undefined
    ? summary.total_milk_income
    : milkIncomeAmount;
  const incomeSummary = summarizeFinanceIncome(financeRecords, milkIncome);
  const totalExpense = getSummaryExpenseTotal(summary);
  const totalDeductions = normalizeAmount(summary.total_dairy_deductions);

  return {
    ...summary,
    total_milk_income: incomeSummary.milkIncome,
    total_other_income: incomeSummary.otherIncome,
    total_all_income: incomeSummary.totalIncome,
    manual_milk_income: incomeSummary.manualMilkIncome,
    counted_milk_income: incomeSummary.countedMilkIncome,
    income_adjustment: incomeSummary.incomeAdjustment,
    net_profit: roundMoney(incomeSummary.totalIncome - totalExpense - totalDeductions)
  };
}

export function normalizeMonthlyExpenseRecord(record) {
  const category = normalizeAccountingExpenseCategory(record.category);

  return markManualKhadyaInfoExpense({
    ...record,
    category,
    display_category: record.display_category || expenseCategoryMeta[category]?.label || record.category,
    amount: normalizeAmount(record.amount),
    source: record.source || "monthly_expenses",
    source_record_id: record.source_record_id || record.id,
    editable: record.editable !== false
  });
}

export function combineAccountingExpenses({
  monthlyExpenses = [],
  financeRecords = [],
  healthRecords = [],
  aiRecords = []
} = {}) {
  return [
    ...(monthlyExpenses || []).map(normalizeMonthlyExpenseRecord),
    ...buildFinanceAccountingExpenses(financeRecords),
    ...buildHealthAccountingExpenses(healthRecords),
    ...buildAIAccountingExpenses(aiRecords)
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

function parseAccountingNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = String(value)
    .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[,₹\s]/g, "")
    .replace(/[Oo]/g, "0");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function parseRawJson(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function normalizeSessionName(value) {
  const text = String(value || "").trim().toLowerCase();

  if (text === DAIRY_SESSION_EVENING || text.includes("संध्या") || text.includes("evening")) {
    return DAIRY_SESSION_EVENING;
  }

  return DAIRY_SESSION_MORNING;
}

function addDaysISO(dateString, days) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);

  if (!year || !month || !day) {
    return "";
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inclusiveDateRange(start, end) {
  if (!start || !end || end < start) {
    return [];
  }

  const dates = [];
  let cursor = start;

  while (cursor && cursor <= end && dates.length < 40) {
    dates.push(cursor);
    cursor = addDaysISO(cursor, 1);
  }

  return dates;
}

export function getSettlementRawData(settlement = {}) {
  return parseRawJson(settlement.ai_raw_data || settlement.raw_ai_json || settlement.raw_data);
}

export function getSettlementPrintedSessionTotals(settlement = {}) {
  const raw = getSettlementRawData(settlement);
  const sessionTotals = raw.session_totals || {};
  const morning = parseAccountingNumber(
    settlement.morning_total_liters ??
      settlement.morning_total_litres ??
      settlement.session_totals?.morning_liters ??
      settlement.session_totals?.morning_total_liters ??
      settlement.session_totals?.morning?.liters ??
      settlement.session_totals?.morning?.total_liters ??
      raw.morning_total_liters ??
      raw.sakal_total_liters ??
      raw.sakalche_total_dudh ??
      raw.morning_liters_total ??
      sessionTotals.morning_liters ??
      sessionTotals.morning_total_liters ??
      sessionTotals.sakal_liters ??
      sessionTotals.sakal_total_liters ??
      sessionTotals.morning?.liters ??
      sessionTotals.morning?.total_liters ??
      sessionTotals["सकाळ"]?.liters ??
      sessionTotals["सकाळ"]?.total_liters
  );
  const evening = parseAccountingNumber(
    settlement.evening_total_liters ??
      settlement.evening_total_litres ??
      settlement.session_totals?.evening_liters ??
      settlement.session_totals?.evening_total_liters ??
      settlement.session_totals?.evening?.liters ??
      settlement.session_totals?.evening?.total_liters ??
      raw.evening_total_liters ??
      raw.sandhyakal_total_liters ??
      raw.sandhyakalche_total_dudh ??
      raw.evening_liters_total ??
      sessionTotals.evening_liters ??
      sessionTotals.evening_total_liters ??
      sessionTotals.sandhyakal_liters ??
      sessionTotals.sandhyakal_total_liters ??
      sessionTotals.evening?.liters ??
      sessionTotals.evening?.total_liters ??
      sessionTotals["संध्याकाळ"]?.liters ??
      sessionTotals["संध्याकाळ"]?.total_liters
  );

  if (morning === null || evening === null) {
    return {
      morningLiters: morning,
      eveningLiters: evening,
      totalLiters: null,
      hasPrintedSessionTotals: false
    };
  }

  return {
    morningLiters: roundMoney(morning),
    eveningLiters: roundMoney(evening),
    totalLiters: roundMoney(morning + evening),
    hasPrintedSessionTotals: true
  };
}

export function getSettlementAccountingLiters(settlement = {}) {
  const printed = getSettlementPrintedSessionTotals(settlement);

  if (printed.hasPrintedSessionTotals) {
    return printed.totalLiters;
  }

  return roundMoney(settlement.total_liters || 0);
}

function getSettlementSessionRows(settlement = {}) {
  const raw = getSettlementRawData(settlement);
  const rows = [];

  if (Array.isArray(raw.session_entries)) {
    rows.push(...raw.session_entries);
  }

  if (Array.isArray(raw.daily_entries)) {
    raw.daily_entries.forEach((entry) => {
      if (entry?.morning) {
        rows.push({ ...entry.morning, date: entry.date, session: DAIRY_SESSION_MORNING });
      }
      if (entry?.evening) {
        rows.push({ ...entry.evening, date: entry.date, session: DAIRY_SESSION_EVENING });
      }
      if (!entry?.morning && !entry?.evening && entry?.session) {
        rows.push(entry);
      }
    });
  }

  return rows
    .map((row) => ({
      date: row?.date || row?.slip_date || "",
      session: normalizeSessionName(row?.session),
      liters: parseAccountingNumber(row?.liters ?? row?.litre)
    }))
    .filter((row) => row.date && row.session);
}

export function analyzeSettlementSessionCoverage(settlement = {}) {
  const rows = getSettlementSessionRows(settlement);
  const expectedDates = inclusiveDateRange(settlement.period_start, settlement.period_end);
  const printed = getSettlementPrintedSessionTotals(settlement);
  const rowMap = new Map(rows.map((row) => [`${row.date}|${row.session}`, row]));

  function missingForSession(session) {
    return expectedDates
      .map((date) => {
        const row = rowMap.get(`${date}|${session}`);

        if (row && row.liters !== null && row.liters > 0) {
          return null;
        }

        return {
          date,
          session,
          reason: row
            ? "AI/OCR ला या session चे लिटर स्पष्ट वाचता आले नाही."
            : "AI/OCR ला या session ची row सापडली नाही.",
          finalSource: printed.hasPrintedSessionTotals
            ? "Final दूध slip वरच्या छापील सकाळ/संध्याकाळ total वरून घेतले आहे."
            : "Final दूध settlement summary वरून तपासा."
        };
      })
      .filter(Boolean);
  }

  return {
    settlementId: settlement.id,
    periodStart: settlement.period_start,
    periodEnd: settlement.period_end,
    expectedDays: expectedDates.length,
    morningRows: rows.filter((row) => row.session === DAIRY_SESSION_MORNING && row.liters !== null && row.liters > 0).length,
    eveningRows: rows.filter((row) => row.session === DAIRY_SESSION_EVENING && row.liters !== null && row.liters > 0).length,
    printedMorningLiters: printed.morningLiters,
    printedEveningLiters: printed.eveningLiters,
    printedTotalLiters: printed.totalLiters,
    hasPrintedSessionTotals: printed.hasPrintedSessionTotals,
    missingMorning: missingForSession(DAIRY_SESSION_MORNING),
    missingEvening: missingForSession(DAIRY_SESSION_EVENING)
  };
}

export function summarizeDairySlips(slips = []) {
  const byDate = {};
  let totalLiters = 0;
  let totalAmount = 0;
  let totalRateWeightedLiters = 0;
  let morningLiters = 0;
  let eveningLiters = 0;
  let morningAmount = 0;
  let eveningAmount = 0;
  let morningCount = 0;
  let eveningCount = 0;

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

    if (slip.session === DAIRY_SESSION_MORNING) {
      morningLiters += liters;
      morningAmount += amount;
      morningCount += 1;
    }

    if (slip.session === DAIRY_SESSION_EVENING) {
      eveningLiters += liters;
      eveningAmount += amount;
      eveningCount += 1;
    }
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
      morningLiters: roundMoney(morningLiters),
      eveningLiters: roundMoney(eveningLiters),
      totalAmount: roundMoney(totalAmount),
      morningAmount: roundMoney(morningAmount),
      eveningAmount: roundMoney(eveningAmount),
      averageRate: totalRateWeightedLiters > 0 ? roundMoney(totalAmount / totalRateWeightedLiters) : 0,
      daysWithData,
      sessionCount,
      morningCount,
      eveningCount
    }
  };
}

export function summarizeMilkSessionsForMonth(slips = [], settlements = []) {
  const settlementSummary = summarizeSettlements(settlements);
  const uncoveredSlips = (slips || []).filter((slip) => !isSlipCoveredBySettlement(slip, settlements));
  const uncoveredSummary = summarizeDairySlips(uncoveredSlips).monthlyTotal;

  return {
    dailyTotals: summarizeDairySlips(uncoveredSlips).dailyTotals,
    monthlyTotal: {
      totalLiters: roundMoney(Number(settlementSummary.totalLiters || 0) + Number(uncoveredSummary.totalLiters || 0)),
      morningLiters: roundMoney(Number(settlementSummary.morningLiters || 0) + Number(uncoveredSummary.morningLiters || 0)),
      eveningLiters: roundMoney(Number(settlementSummary.eveningLiters || 0) + Number(uncoveredSummary.eveningLiters || 0)),
      totalAmount: roundMoney(Number(settlementSummary.totalMilkIncome || 0) + Number(uncoveredSummary.totalAmount || 0)),
      morningAmount: uncoveredSummary.morningAmount,
      eveningAmount: uncoveredSummary.eveningAmount,
      averageRate:
        Number(settlementSummary.totalLiters || 0) + Number(uncoveredSummary.totalLiters || 0) > 0
          ? roundMoney((Number(settlementSummary.totalMilkIncome || 0) + Number(uncoveredSummary.totalAmount || 0)) /
              (Number(settlementSummary.totalLiters || 0) + Number(uncoveredSummary.totalLiters || 0)))
          : 0,
      daysWithData: uncoveredSummary.daysWithData + Number(settlementSummary.daysWithData || 0),
      sessionCount:
        uncoveredSummary.sessionCount +
        Number(settlementSummary.morningCount || 0) +
        Number(settlementSummary.eveningCount || 0),
      morningCount: uncoveredSummary.morningCount + Number(settlementSummary.morningCount || 0),
      eveningCount: uncoveredSummary.eveningCount + Number(settlementSummary.eveningCount || 0),
      source: (settlements || []).length ? "settlement_printed_totals" : "dairy_slips"
    }
  };
}

export function summarizeExpenses(expenses = [], options = {}) {
  const { includeInfoOnly = false } = options;
  const byCategory = accountingExpenseCategories.reduce((groups, category) => {
    groups[category] = 0;
    return groups;
  }, {});

  expenses.forEach((expense) => {
    if (!includeInfoOnly && (expense.info_only === true || isManualKhadyaInfoExpense(expense))) {
      return;
    }

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
    (summary, settlement) => {
      const printed = getSettlementPrintedSessionTotals(settlement);
      const totalLiters = printed.hasPrintedSessionTotals ? printed.totalLiters : Number(settlement.total_liters || 0);
      const morningLiters = printed.hasPrintedSessionTotals ? printed.morningLiters : 0;
      const eveningLiters = printed.hasPrintedSessionTotals ? printed.eveningLiters : 0;
      const coverage = analyzeSettlementSessionCoverage(settlement);

      return {
        totalLiters: roundMoney(summary.totalLiters + Number(totalLiters || 0)),
        morningLiters: roundMoney(summary.morningLiters + Number(morningLiters || 0)),
        eveningLiters: roundMoney(summary.eveningLiters + Number(eveningLiters || 0)),
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
        morningCount: summary.morningCount + (coverage.hasPrintedSessionTotals ? coverage.expectedDays : 0),
        eveningCount: summary.eveningCount + (coverage.hasPrintedSessionTotals ? coverage.expectedDays : 0),
        daysWithData: summary.daysWithData + (coverage.expectedDays || 0),
        received: summary.received + (settlement.payment_received ? 1 : 0)
      };
    },
    {
      totalLiters: 0,
      morningLiters: 0,
      eveningLiters: 0,
      totalMilkIncome: 0,
      cattleFeedDeduction: 0,
      otherDeductions: 0,
      totalDeductions: 0,
      netPayable: 0,
      morningCount: 0,
      eveningCount: 0,
      daysWithData: 0,
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

export function summarizeMilkIncomeForMonth(slips = [], settlements = []) {
  const sessionSummary = summarizeMilkSessionsForMonth(slips, settlements).monthlyTotal;
  const settlementIncome = summarizeSettlements(settlements);
  const uncoveredSummary = summarizeDairySlips((slips || []).filter((slip) => !isSlipCoveredBySettlement(slip, settlements))).monthlyTotal;

  return {
    totalLiters: sessionSummary.totalLiters,
    totalAmount: sessionSummary.totalAmount,
    settlementLiters: settlementIncome.totalLiters,
    settlementIncome: settlementIncome.totalMilkIncome,
    uncoveredSlipLiters: uncoveredSummary.totalLiters,
    uncoveredSlipAmount: uncoveredSummary.totalAmount,
    morningLiters: sessionSummary.morningLiters,
    eveningLiters: sessionSummary.eveningLiters
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
  const actualLiters = getSettlementAccountingLiters(settlement);
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

  const [slipsResult, settlementsResult, expensesResult, financeExpensesResult, healthExpensesResult, aiExpensesResult] =
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
        .lt("date", monthRange.end),
      supabase
        .from("ai_records")
        .select("id, farm_id, cow_id, ai_date, bull_code, bull_breed, doctor_name, cost, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("ai_date", monthRange.start)
        .lt("ai_date", monthRange.end)
    ]);

  const firstError = [
    slipsResult.error,
    settlementsResult.error,
    expensesResult.error,
    financeExpensesResult.error,
    healthExpensesResult.error,
    aiExpensesResult.error
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  const settlementSummary = summarizeSettlements(settlementsResult.data || []);
  const milkIncomeSummary = summarizeMilkIncomeForMonth(slipsResult.data || [], settlementsResult.data || []);
  const allExpenses = combineAccountingExpenses({
    monthlyExpenses: expensesResult.data || [],
    financeRecords: financeExpensesResult.data || [],
    healthRecords: healthExpensesResult.data || [],
    aiRecords: aiExpensesResult.data || []
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

  return applyFinanceIncomeToSummary(data, financeExpensesResult.data || [], milkIncomeSummary.totalAmount);
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
  const monthRange = getMonthRange(month, year);
  const [summaryResult, financeIncomeResult] = await Promise.all([
    supabase
      .from("monthly_summary")
      .select("*")
      .eq("farm_id", farmId)
      .eq("month_year", monthYear)
      .maybeSingle(),
    supabase
      .from("finance_records")
      .select("id, farm_id, date, type, category, amount, accounting_period")
      .eq("farm_id", farmId)
      .gte("date", monthRange.start)
      .lt("date", monthRange.end)
  ]);

  if (summaryResult.error) {
    throw summaryResult.error;
  }

  if (financeIncomeResult.error) {
    throw financeIncomeResult.error;
  }

  return summaryResult.data
    ? applyFinanceIncomeToSummary(summaryResult.data, financeIncomeResult.data || [])
    : refreshMonthlySummary(supabase, farmId, month, year);
}

export async function generateMonthlyReport(supabase, farmId, month, year) {
  const monthRange = getMonthRange(month, year);
  const [slipsResult, settlementsResult, expensesResult, financeExpensesResult, healthExpensesResult, aiExpensesResult, summary] =
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
      supabase
        .from("ai_records")
        .select("id, farm_id, cow_id, ai_date, bull_code, bull_breed, doctor_name, cost, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("ai_date", monthRange.start)
        .lt("ai_date", monthRange.end)
        .order("ai_date", { ascending: false })
        .order("created_at", { ascending: false }),
      refreshMonthlySummary(supabase, farmId, month, year)
    ]);

  const firstError = [
    slipsResult.error,
    settlementsResult.error,
    expensesResult.error,
    financeExpensesResult.error,
    healthExpensesResult.error,
    aiExpensesResult.error
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  const milkSessionSummary = summarizeMilkSessionsForMonth(slipsResult.data || [], settlementsResult.data || []);
  const settlementSummary = summarizeSettlements(settlementsResult.data || []);
  const allExpenses = combineAccountingExpenses({
    monthlyExpenses: expensesResult.data || [],
    financeRecords: financeExpensesResult.data || [],
    healthRecords: healthExpensesResult.data || [],
    aiRecords: aiExpensesResult.data || []
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
    aiExpenses: buildAIAccountingExpenses(aiExpensesResult.data || []),
    dailyTotals: milkSessionSummary.dailyTotals,
    milk: milkSessionSummary.monthlyTotal,
    settlementsSummary: settlementSummary,
    expensesSummary: expenseSummary,
    summary
  };
}

export async function buildProfitTrend(supabase, farmId, month, year, summaryOverrides = {}) {
  const months = Array.from({ length: 6 }, (_, index) => addMonths(month, year, index - 5));
  const summaries = [];

  for (const item of months) {
    const key = getMonthYearString(item.month, item.year);
    const summary = summaryOverrides[key] || await refreshMonthlySummary(supabase, farmId, item.month, item.year);
    summaries.push({
      month: item.month,
      year: item.year,
      label: getMonthLabel(item.month, item.year),
      netProfit: Number(summary.net_profit || 0),
      income: Number(summary.total_all_income ?? summary.total_milk_income ?? 0),
      expense: Number(summary.total_all_expenses || 0),
      deductions: Number(summary.total_dairy_deductions || 0)
    });
  }

  return summaries;
}
