import { NextResponse } from "next/server";
import { ACCOUNTING_PERIOD_MONTHLY } from "@/lib/accountingPeriods";
import { isKhadyaExpenseCategory, summarizeMilkIncomeForMonth } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  addMonths,
  calculateFinanceStats,
  displayFinanceCategory,
  expenseCategories,
  getMonthInput,
  getMonthLabel,
  getMonthRange,
  incomeCategories
} from "@/lib/reportUtils";

export const dynamic = "force-dynamic";

function categoriesToArray(categories, grouped) {
  const normalizedGrouped = Object.entries(grouped).reduce((values, [category, amount]) => {
    const displayCategory = displayFinanceCategory(category);
    values[displayCategory] = (values[displayCategory] || 0) + amount;
    return values;
  }, {});
  const seen = new Set(categories);
  const base = categories.map((category) => ({
    category,
    amount: Number((normalizedGrouped[category] || 0).toFixed(2))
  }));
  const extra = Object.entries(normalizedGrouped)
    .filter(([category]) => !seen.has(category))
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2))
    }));

  return [...base, ...extra].filter((item) => item.amount > 0);
}

function getMilkIncomeToAdd(financeRecords, milkIncomeAmount) {
  const milkIncome = Number(milkIncomeAmount || 0);
  const manualMilkIncome = financeRecords
    .filter(
      (record) =>
        record.type === "उत्पन्न" && displayFinanceCategory(record.category) === "दूध विक्री"
    )
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);

  return Number(Math.max(0, milkIncome - manualMilkIncome).toFixed(2));
}

function getYearRange(year) {
  return {
    start: `${year}-01-01`,
    end: `${Number(year) + 1}-01-01`
  };
}

function isAnnualCharaByDescription(record) {
  const description = String(record.description || "").trim();

  return (
    record.type === "खर्च" &&
    displayFinanceCategory(record.category) === "चारा" &&
    (description.startsWith("मुरघास") || description.startsWith("भुसा"))
  );
}

function getFinanceRecordDisplayCategory(record) {
  const displayCategory = displayFinanceCategory(record.category);
  const description = String(record.description || "").trim();

  if (displayCategory === "चारा" && description.startsWith("खाद्य")) {
    return "खाद्य";
  }

  return displayCategory;
}

function getFinanceAccountingPeriod(record) {
  if (record.accounting_period === "annual") {
    return "annual";
  }

  if (!record.accounting_period && isAnnualCharaByDescription(record)) {
    return "annual";
  }

  return ACCOUNTING_PERIOD_MONTHLY;
}

function normalizeFinanceRecord(record) {
  return {
    ...record,
    category: getFinanceRecordDisplayCategory(record),
    accounting_period: getFinanceAccountingPeriod(record)
  };
}

function isInfoOnlyKhadyaTransaction(record) {
  return record?.type === "खर्च" && record?.source !== "dairy_settlements" && isKhadyaExpenseCategory(record.category);
}

function getSettlementAccountingDate(settlement = {}) {
  return settlement.period_end || settlement.settlement_date;
}

function buildMilkIncomeTransaction(amount, monthRange, options = {}) {
  if (amount <= 0) {
    return null;
  }

  const litres = Number(options.litres || 0);

  return {
    id: `milk-income-${monthRange.start}`,
    farm_id: options.farmId || null,
    cow_id: null,
    date: monthRange.start,
    type: "उत्पन्न",
    category: "दूध विक्री",
    amount,
    accounting_period: ACCOUNTING_PERIOD_MONTHLY,
    description: `दूध/सेटलमेंट नोंदीवरून आपोआप मोजलेले उत्पन्न (${Number(litres.toFixed(2))} लिटर)`,
    cows: null,
    is_derived: true,
    source: "dairy_slips_settlements"
  };
}

function buildHealthExpenseDescription(record) {
  const details = [
    record.vaccine_name ? `औषध: ${record.vaccine_name}` : record.type || "आरोग्य नोंद",
    record.description ? String(record.description).replace(/\s+/g, " ").trim() : "",
    record.cows?.name ? `गाय: ${record.cows.name}` : "",
    record.doctor_name ? `पशुवैद्यक: ${record.doctor_name}` : ""
  ].filter(Boolean);

  return details.join(" | ");
}

function buildHealthExpenseTransactions(healthRecords) {
  return (healthRecords || [])
    .filter((record) => Number(record.cost || 0) > 0)
    .map((record) => ({
      id: `health-expense-${record.id}`,
      farm_id: record.farm_id,
      cow_id: record.cow_id,
      date: record.date,
      type: "खर्च",
      category: "औषध",
      amount: Number(record.cost || 0),
      accounting_period: ACCOUNTING_PERIOD_MONTHLY,
      description: buildHealthExpenseDescription(record),
      cows: record.cows || null,
      is_derived: true,
      source: "health_records",
      source_record_id: record.id
    }));
}

function buildAIExpenseTransactions(aiRecords) {
  return (aiRecords || [])
    .filter((record) => Number(record.cost || 0) > 0)
    .map((record) => ({
      id: `ai-expense-${record.id}`,
      farm_id: record.farm_id,
      cow_id: record.cow_id || null,
      date: record.ai_date,
      type: "खर्च",
      category: "रेतन खर्च",
      amount: Number(record.cost || 0),
      accounting_period: ACCOUNTING_PERIOD_MONTHLY,
      description: [
        "कृत्रिम रेतन",
        record.bull_breed ? `बैल जात: ${record.bull_breed}` : "",
        record.bull_code ? `बैल कोड: ${record.bull_code}` : "",
        record.doctor_name ? `डॉक्टर: ${record.doctor_name}` : "",
        record.cows?.name ? `गाय: ${record.cows.name}` : ""
      ].filter(Boolean).join(" | "),
      cows: record.cows || null,
      is_derived: true,
      source: "ai_records",
      source_record_id: record.id
    }));
}

function buildSettlementDeductionTransactions(settlements) {
  return (settlements || []).flatMap((settlement) => {
    const period = `${settlement.period_start} ते ${settlement.period_end}`;
    const accountingDate = getSettlementAccountingDate(settlement);
    const base = {
      farm_id: settlement.farm_id,
      cow_id: null,
      date: accountingDate,
      type: "खर्च",
      accounting_period: ACCOUNTING_PERIOD_MONTHLY,
      cows: null,
      is_derived: true,
      source: "dairy_settlements",
      source_record_id: settlement.id
    };
    const deductions = [];

    if (Number(settlement.cattle_feed_deduction || 0) > 0) {
      deductions.push({
        ...base,
        id: `settlement-feed-deduction-${settlement.id}`,
        category: "खाद्य",
        amount: Number(settlement.cattle_feed_deduction || 0),
        description: `डेअरी देयक खाद्य कपात | ${period}`
      });
    }

    if (Number(settlement.other_deductions || 0) > 0) {
      deductions.push({
        ...base,
        id: `settlement-other-deduction-${settlement.id}`,
        category: "इतर",
        amount: Number(settlement.other_deductions || 0),
        description: `डेअरी देयक इतर कपात | ${period}`
      });
    }

    return deductions;
  });
}

function summarizeSettlementDeductionTransactions(transactions) {
  const summary = (transactions || []).reduce(
    (totals, transaction) => {
      const amount = Number(transaction.amount || 0);
      const category = displayFinanceCategory(transaction.category);

      if (category === "खाद्य") {
        totals.cattleFeedDeduction += amount;
      } else {
        totals.otherDeductions += amount;
      }

      totals.totalDeductions += amount;
      return totals;
    },
    {
      cattleFeedDeduction: 0,
      otherDeductions: 0,
      totalDeductions: 0
    }
  );

  return {
    cattleFeedDeduction: Number(summary.cattleFeedDeduction.toFixed(2)),
    otherDeductions: Number(summary.otherDeductions.toFixed(2)),
    totalDeductions: Number(summary.totalDeductions.toFixed(2)),
    deductionsCountedInProfit: Number(summary.totalDeductions.toFixed(2))
  };
}

function buildAccountingExpenseTransactions(expenses) {
  return (expenses || [])
    .filter((record) => Number(record.amount || 0) > 0)
    .map((record) => ({
      id: `accounting-expense-${record.id}`,
      farm_id: record.farm_id,
      cow_id: null,
      date: record.expense_date,
      type: "खर्च",
      category: record.category || "इतर",
      amount: Number(record.amount || 0),
      accounting_period: ACCOUNTING_PERIOD_MONTHLY,
      description: [record.description, record.vendor_name ? `विक्रेता: ${record.vendor_name}` : ""]
        .filter(Boolean)
        .join(" | "),
      cows: null,
      is_derived: true,
      source: "monthly_expenses",
      source_record_id: record.id
    }));
}

function buildMonthlyTrend(
  financeRecords,
  dairySlips,
  healthRecords,
  aiRecords,
  accountingExpenses,
  settlements,
  selectedMonth,
  selectedYear
) {
  const months = Array.from({ length: 6 }, (_, index) =>
    addMonths(selectedMonth, selectedYear, index - 5)
  );

  return months.map(({ month, year }) => {
    const monthRange = getMonthRange(month, year);
    const monthlyFinance = (financeRecords || [])
      .filter((record) => record.date >= monthRange.start && record.date < monthRange.end)
      .map(normalizeFinanceRecord)
      .filter((record) => record.accounting_period !== "annual")
      .filter((record) => !isInfoOnlyKhadyaTransaction(record));
    const monthlyDairySlips = (dairySlips || []).filter(
      (record) => record.slip_date >= monthRange.start && record.slip_date < monthRange.end
    );
    const monthlyHealthExpenses = buildHealthExpenseTransactions(
      (healthRecords || []).filter(
        (record) => record.date >= monthRange.start && record.date < monthRange.end
      )
    );
    const monthlyAIExpenses = buildAIExpenseTransactions(
      (aiRecords || []).filter(
        (record) => record.ai_date >= monthRange.start && record.ai_date < monthRange.end
      )
    );
    const monthlyAccountingExpenses = buildAccountingExpenseTransactions(
      (accountingExpenses || []).filter(
        (record) => record.expense_date >= monthRange.start && record.expense_date < monthRange.end
      )
    ).filter((record) => !isInfoOnlyKhadyaTransaction(record));
    const monthlySettlementDeductions = buildSettlementDeductionTransactions(
      (settlements || []).filter(
        (record) => getSettlementAccountingDate(record) >= monthRange.start && getSettlementAccountingDate(record) < monthRange.end
      )
    );
    const monthlySettlements = (settlements || []).filter(
      (record) => getSettlementAccountingDate(record) >= monthRange.start && getSettlementAccountingDate(record) < monthRange.end
    );
    const milkSummary = summarizeMilkIncomeForMonth(monthlyDairySlips, monthlySettlements);
    const milkIncomeToAdd = getMilkIncomeToAdd(monthlyFinance, milkSummary.totalAmount);
    const milkIncomeTransaction = buildMilkIncomeTransaction(milkIncomeToAdd, monthRange, {
      farmId: monthlyDairySlips[0]?.farm_id || monthlyFinance[0]?.farm_id || null,
      litres: milkSummary.totalLiters
    });
    const transactions = [
      ...(milkIncomeTransaction ? [milkIncomeTransaction] : []),
      ...monthlyFinance,
      ...monthlyHealthExpenses,
      ...monthlyAIExpenses,
      ...monthlyAccountingExpenses
    ];
    const stats = calculateFinanceStats(transactions);
    const deductionSummary = summarizeSettlementDeductionTransactions(monthlySettlementDeductions);
    const netProfit =
      stats.totalIncome - stats.totalExpense - deductionSummary.deductionsCountedInProfit;

    return {
      month,
      year,
      label: getMonthLabel(month, year),
      income: Number(stats.totalIncome.toFixed(2)),
      expense: Number(stats.totalExpense.toFixed(2)),
      deductions: deductionSummary.totalDeductions,
      deductionsCountedInProfit: deductionSummary.deductionsCountedInProfit,
      profit: Number(netProfit.toFixed(2)),
      milkIncome: Number(milkSummary.totalAmount.toFixed(2)),
      milkLitres: Number(milkSummary.totalLiters.toFixed(2)),
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

    const monthRange = getMonthRange(monthInput.month, monthInput.year);
    const yearRange = getYearRange(monthInput.year);
    const oldestMonth = addMonths(monthInput.month, monthInput.year, -5);
    const oldestRange = getMonthRange(oldestMonth.month, oldestMonth.year);
    const supabase = getSupabaseServerClient();
    const [
      monthFinanceRecords,
      annualFinanceRecords,
      monthAccountingExpenses,
      monthSettlements,
      dairySlips,
      trendFinanceRecords,
      trendDairySlips,
      trendHealthRecords,
      monthAIRecords,
      trendAIRecords,
      trendAccountingExpenses,
      trendSettlements
    ] = await Promise.all([
      supabase
        .from("finance_records")
        .select("*, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("finance_records")
        .select("*, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gte("date", yearRange.start)
        .lt("date", yearRange.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("monthly_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("expense_date", monthRange.start)
        .lt("expense_date", monthRange.end)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("dairy_settlements")
        .select("id, farm_id, settlement_date, period_start, period_end, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, ai_raw_data")
        .eq("farm_id", farmId)
        .gte("period_end", monthRange.start)
        .lt("period_end", monthRange.end)
        .order("period_end", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("dairy_slips")
        .select("*")
        .eq("farm_id", farmId)
        .gte("slip_date", monthRange.start)
        .lt("slip_date", monthRange.end)
        .order("slip_date", { ascending: true }),
      supabase
        .from("finance_records")
        .select("id, farm_id, date, type, category, amount, accounting_period, description")
        .eq("farm_id", farmId)
        .gte("date", oldestRange.start)
        .lt("date", monthRange.end)
        .order("date", { ascending: true }),
      supabase
        .from("dairy_slips")
        .select("*")
        .eq("farm_id", farmId)
        .gte("slip_date", oldestRange.start)
        .lt("slip_date", monthRange.end)
        .order("slip_date", { ascending: true }),
      supabase
        .from("health_records")
        .select(
          "id, farm_id, cow_id, date, type, description, doctor_name, cost, vaccine_name, notes, cows(id, name, breed)"
        )
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("date", oldestRange.start)
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
      supabase
        .from("ai_records")
        .select("id, farm_id, cow_id, ai_date, bull_code, bull_breed, doctor_name, cost, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("ai_date", oldestRange.start)
        .lt("ai_date", monthRange.end)
        .order("ai_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("monthly_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("expense_date", oldestRange.start)
        .lt("expense_date", monthRange.end)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("dairy_settlements")
        .select("id, farm_id, settlement_date, period_start, period_end, total_liters, total_milk_income, cattle_feed_deduction, other_deductions, ai_raw_data")
        .eq("farm_id", farmId)
        .gte("period_end", oldestRange.start)
        .lt("period_end", monthRange.end)
        .order("period_end", { ascending: false })
        .order("created_at", { ascending: false })
    ]);

    if (monthFinanceRecords.error) {
      throw monthFinanceRecords.error;
    }

    if (annualFinanceRecords.error) {
      throw annualFinanceRecords.error;
    }

    if (monthAccountingExpenses.error) {
      throw monthAccountingExpenses.error;
    }

    if (monthSettlements.error) {
      throw monthSettlements.error;
    }

    if (dairySlips.error) {
      throw dairySlips.error;
    }

    if (trendFinanceRecords.error) {
      throw trendFinanceRecords.error;
    }

    if (trendDairySlips.error) {
      throw trendDairySlips.error;
    }

    if (trendHealthRecords.error) {
      throw trendHealthRecords.error;
    }

    if (monthAIRecords.error) {
      throw monthAIRecords.error;
    }

    if (trendAIRecords.error) {
      throw trendAIRecords.error;
    }

    if (trendAccountingExpenses.error) {
      throw trendAccountingExpenses.error;
    }

    if (trendSettlements.error) {
      throw trendSettlements.error;
    }

    const monthlyFinance = (monthFinanceRecords.data || [])
      .map(normalizeFinanceRecord)
      .filter((record) => record.accounting_period !== "annual");
    const countedMonthlyFinance = monthlyFinance.filter((record) => !isInfoOnlyKhadyaTransaction(record));
    const annualFinance = (annualFinanceRecords.data || [])
      .map(normalizeFinanceRecord)
      .filter((record) => record.type === "खर्च" && record.accounting_period === "annual");
    const milkSummary = summarizeMilkIncomeForMonth(dairySlips.data || [], monthSettlements.data || []);
    const milkIncomeToAdd = getMilkIncomeToAdd(countedMonthlyFinance, milkSummary.totalAmount);
    const milkIncomeTransaction = buildMilkIncomeTransaction(milkIncomeToAdd, monthRange, {
      farmId,
      litres: milkSummary.totalLiters
    });
    const monthlyHealthExpenses = buildHealthExpenseTransactions(
      (trendHealthRecords.data || []).filter(
        (record) => record.date >= monthRange.start && record.date < monthRange.end
      )
    );
    const monthlyAIExpenses = buildAIExpenseTransactions(monthAIRecords.data || []);
    const monthlyAccountingExpenses = buildAccountingExpenseTransactions(monthAccountingExpenses.data || []);
    const countedMonthlyAccountingExpenses = monthlyAccountingExpenses.filter(
      (record) => !isInfoOnlyKhadyaTransaction(record)
    );
    const monthlySettlementDeductions = buildSettlementDeductionTransactions(monthSettlements.data || []);
    const transactions = [
      ...(milkIncomeTransaction ? [milkIncomeTransaction] : []),
      ...countedMonthlyFinance,
      ...monthlyHealthExpenses,
      ...monthlyAIExpenses,
      ...countedMonthlyAccountingExpenses
    ];
    const stats = calculateFinanceStats(transactions);
    const annualStats = calculateFinanceStats(annualFinance);
    const deductionSummary = summarizeSettlementDeductionTransactions(monthlySettlementDeductions);
    const netProfit =
      stats.totalIncome - stats.totalExpense - deductionSummary.deductionsCountedInProfit;

    return NextResponse.json({
      data: {
        month: monthInput.month,
        year: monthInput.year,
        totalIncome: Number(stats.totalIncome.toFixed(2)),
        totalExpense: Number(stats.totalExpense.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        totalDeductions: deductionSummary.totalDeductions,
        deductionsCountedInProfit: deductionSummary.deductionsCountedInProfit,
        settlementDeductions: deductionSummary,
        milkIncome: Number(milkSummary.totalAmount.toFixed(2)),
        milkLitres: Number(milkSummary.totalLiters.toFixed(2)),
        derivedMilkIncome: milkIncomeToAdd,
        annualExpense: Number(annualStats.totalExpense.toFixed(2)),
        annualExpenseByCategory: categoriesToArray(expenseCategories, annualStats.byCategory.expense),
        annualTransactions: annualFinance,
        incomeByCategory: categoriesToArray(incomeCategories, stats.byCategory.income),
        expenseByCategory: categoriesToArray(expenseCategories, stats.byCategory.expense),
        deductionTransactions: monthlySettlementDeductions,
        infoOnlyKhadyaTransactions: [
          ...monthlyFinance.filter(isInfoOnlyKhadyaTransaction),
          ...monthlyAccountingExpenses.filter(isInfoOnlyKhadyaTransaction)
        ],
        monthlyTrend: buildMonthlyTrend(
          trendFinanceRecords.data || [],
          trendDairySlips.data || [],
          trendHealthRecords.data || [],
          trendAIRecords.data || [],
          trendAccountingExpenses.data || [],
          trendSettlements.data || [],
          monthInput.month,
          monthInput.year
        ),
        transactions
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
