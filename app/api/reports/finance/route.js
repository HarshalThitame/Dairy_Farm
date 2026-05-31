import { NextResponse } from "next/server";
import { ACCOUNTING_PERIOD_MONTHLY } from "@/lib/accountingPeriods";
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
  getRecordMilkAmount,
  getRecordMilkTotal,
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

function getMilkIncomeToAdd(financeRecords, milkRecords) {
  const milkIncome = milkRecords.reduce((sum, record) => sum + getRecordMilkAmount(record), 0);
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

function getSettlementAccountingDate(settlement = {}) {
  return settlement.period_end || settlement.settlement_date;
}

function buildMilkIncomeTransaction(milkRecords, amount, monthRange) {
  if (amount <= 0) {
    return null;
  }

  const litres = milkRecords.reduce((sum, record) => sum + getRecordMilkTotal(record), 0);

  return {
    id: `milk-income-${monthRange.start}`,
    farm_id: milkRecords[0]?.farm_id || null,
    cow_id: null,
    date: monthRange.start,
    type: "उत्पन्न",
    category: "दूध विक्री",
    amount,
    accounting_period: ACCOUNTING_PERIOD_MONTHLY,
    description: `दूध नोंदीवरून आपोआप मोजलेले उत्पन्न (${Number(litres.toFixed(2))} लिटर)`,
    cows: null,
    is_derived: true,
    source: "milk_records"
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
  milkRecords,
  healthRecords,
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
      .filter((record) => record.accounting_period !== "annual");
    const monthlyMilk = (milkRecords || []).filter(
      (record) => record.date >= monthRange.start && record.date < monthRange.end
    );
    const monthlyHealthExpenses = buildHealthExpenseTransactions(
      (healthRecords || []).filter(
        (record) => record.date >= monthRange.start && record.date < monthRange.end
      )
    );
    const monthlyAccountingExpenses = buildAccountingExpenseTransactions(
      (accountingExpenses || []).filter(
        (record) => record.expense_date >= monthRange.start && record.expense_date < monthRange.end
      )
    );
    const monthlySettlementDeductions = buildSettlementDeductionTransactions(
      (settlements || []).filter(
        (record) => getSettlementAccountingDate(record) >= monthRange.start && getSettlementAccountingDate(record) < monthRange.end
      )
    );
    const milkIncomeToAdd = getMilkIncomeToAdd(monthlyFinance, monthlyMilk);
    const milkIncomeTransaction = buildMilkIncomeTransaction(monthlyMilk, milkIncomeToAdd, monthRange);
    const transactions = [
      ...(milkIncomeTransaction ? [milkIncomeTransaction] : []),
      ...monthlyFinance,
      ...monthlyHealthExpenses,
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
      milkIncome: Number(
        monthlyMilk.reduce((sum, record) => sum + getRecordMilkAmount(record), 0).toFixed(2)
      ),
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
      milkRecords,
      trendFinanceRecords,
      trendMilkRecords,
      trendHealthRecords,
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
        .select("id, farm_id, settlement_date, period_start, period_end, cattle_feed_deduction, other_deductions")
        .eq("farm_id", farmId)
        .gte("period_end", monthRange.start)
        .lt("period_end", monthRange.end)
        .order("period_end", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("milk_records")
        .select(
          "id, farm_id, date, morning_litres, evening_litres, total_litres, price_per_litre, morning_price_per_litre, evening_price_per_litre, total_amount"
        )
        .eq("farm_id", farmId)
        .is("cow_id", null)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end)
        .order("date", { ascending: true }),
      supabase
        .from("finance_records")
        .select("id, farm_id, date, type, category, amount, accounting_period, description")
        .eq("farm_id", farmId)
        .gte("date", oldestRange.start)
        .lt("date", monthRange.end)
        .order("date", { ascending: true }),
      supabase
        .from("milk_records")
        .select(
          "id, farm_id, date, morning_litres, evening_litres, total_litres, price_per_litre, morning_price_per_litre, evening_price_per_litre, total_amount"
        )
        .eq("farm_id", farmId)
        .is("cow_id", null)
        .gte("date", oldestRange.start)
        .lt("date", monthRange.end)
        .order("date", { ascending: true }),
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
        .from("monthly_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("expense_date", oldestRange.start)
        .lt("expense_date", monthRange.end)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("dairy_settlements")
        .select("id, farm_id, settlement_date, period_start, period_end, cattle_feed_deduction, other_deductions")
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

    if (milkRecords.error) {
      throw milkRecords.error;
    }

    if (trendFinanceRecords.error) {
      throw trendFinanceRecords.error;
    }

    if (trendMilkRecords.error) {
      throw trendMilkRecords.error;
    }

    if (trendHealthRecords.error) {
      throw trendHealthRecords.error;
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
    const annualFinance = (annualFinanceRecords.data || [])
      .map(normalizeFinanceRecord)
      .filter((record) => record.type === "खर्च" && record.accounting_period === "annual");
    const milkIncomeToAdd = getMilkIncomeToAdd(monthlyFinance, milkRecords.data || []);
    const milkIncomeTransaction = buildMilkIncomeTransaction(
      milkRecords.data || [],
      milkIncomeToAdd,
      monthRange
    );
    const monthlyHealthExpenses = buildHealthExpenseTransactions(
      (trendHealthRecords.data || []).filter(
        (record) => record.date >= monthRange.start && record.date < monthRange.end
      )
    );
    const monthlyAccountingExpenses = buildAccountingExpenseTransactions(monthAccountingExpenses.data || []);
    const monthlySettlementDeductions = buildSettlementDeductionTransactions(monthSettlements.data || []);
    const transactions = [
      ...(milkIncomeTransaction ? [milkIncomeTransaction] : []),
      ...monthlyFinance,
      ...monthlyHealthExpenses,
      ...monthlyAccountingExpenses
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
        milkIncome: Number(
          (milkRecords.data || [])
            .reduce((sum, record) => sum + getRecordMilkAmount(record), 0)
            .toFixed(2)
        ),
        derivedMilkIncome: milkIncomeToAdd,
        annualExpense: Number(annualStats.totalExpense.toFixed(2)),
        annualExpenseByCategory: categoriesToArray(expenseCategories, annualStats.byCategory.expense),
        annualTransactions: annualFinance,
        incomeByCategory: categoriesToArray(incomeCategories, stats.byCategory.income),
        expenseByCategory: categoriesToArray(expenseCategories, stats.byCategory.expense),
        deductionTransactions: monthlySettlementDeductions,
        monthlyTrend: buildMonthlyTrend(
          trendFinanceRecords.data || [],
          trendMilkRecords.data || [],
          trendHealthRecords.data || [],
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
