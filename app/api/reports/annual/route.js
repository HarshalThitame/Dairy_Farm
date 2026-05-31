import { NextResponse } from "next/server";
import { ACCOUNTING_PERIOD_MONTHLY } from "@/lib/accountingPeriods";
import { displayFeedSectionName } from "@/lib/feedExpenseSections";
import { farmErrorResponse, normalizeFarm, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  displayFinanceCategory,
  getMonthLabel,
  getRecordMilkAmount,
  getRecordMilkTotal,
  reportMonths
} from "@/lib/reportUtils";

export const dynamic = "force-dynamic";

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getYearInput(searchParams) {
  const currentYear = new Date().getFullYear();
  const year = Number(searchParams.get("year") || currentYear);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }

  return year;
}

function getYearRange(year) {
  return {
    start: `${year}-01-01`,
    end: `${Number(year) + 1}-01-01`
  };
}

function getMonthKeyFromDate(date) {
  return String(date || "").slice(0, 7);
}

function getSettlementAccountingDate(settlement = {}) {
  return settlement.period_end || settlement.settlement_date;
}

function getMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildEmptyMonths(year) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return {
      month,
      year,
      key: getMonthKey(year, month),
      label: getMonthLabel(month, year),
      milkLitres: 0,
      morningLitres: 0,
      eveningLitres: 0,
      milkIncome: 0,
      totalIncome: 0,
      monthlyExpense: 0,
      annualExpense: 0,
      dairyFeedDeduction: 0,
      otherDeductions: 0,
      netProfit: 0,
      milkDays: 0
    };
  });
}

function addToGroup(groups, category, amount) {
  const displayCategory = displayFinanceCategory(category);
  groups[displayCategory] = roundMoney((groups[displayCategory] || 0) + Number(amount || 0));
}

function groupsToArray(groups) {
  return Object.entries(groups)
    .map(([category, amount]) => ({ category, amount: roundMoney(amount) }))
    .filter((item) => item.amount > 0)
    .sort((first, second) => second.amount - first.amount);
}

function isAnnualCharaByDescription(record) {
  const description = String(record.description || "").trim();

  return (
    record.type === "खर्च" &&
    displayFinanceCategory(record.category) === "चारा" &&
    (description.startsWith("मुरघास") || description.startsWith("भुसा"))
  );
}

function getFinanceDisplayCategory(record) {
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
    category: getFinanceDisplayCategory(record),
    accounting_period: getFinanceAccountingPeriod(record)
  };
}

function buildMilkSummary(records, monthRows) {
  const daysByMonth = new Map();
  let totalMilkLitres = 0;
  let morningLitres = 0;
  let eveningLitres = 0;
  let milkIncome = 0;
  let milkDays = 0;

  records.forEach((record) => {
    const key = getMonthKeyFromDate(record.date);
    const month = monthRows.find((item) => item.key === key);
    const total = getRecordMilkTotal(record);
    const amount = getRecordMilkAmount(record);
    const morning = Number(record.morning_litres || 0);
    const evening = Number(record.evening_litres || 0);

    if (!month) {
      return;
    }

    month.milkLitres += total;
    month.morningLitres += morning;
    month.eveningLitres += evening;
    month.milkIncome += amount;
    totalMilkLitres += total;
    morningLitres += morning;
    eveningLitres += evening;
    milkIncome += amount;

    if (total > 0) {
      daysByMonth.set(key, (daysByMonth.get(key) || 0) + 1);
      milkDays += 1;
    }
  });

  monthRows.forEach((month) => {
    month.milkDays = daysByMonth.get(month.key) || 0;
  });

  return {
    totalMilkLitres: roundMoney(totalMilkLitres),
    morningLitres: roundMoney(morningLitres),
    eveningLitres: roundMoney(eveningLitres),
    milkIncome: roundMoney(milkIncome),
    averageMilkPerDay: milkDays > 0 ? roundMoney(totalMilkLitres / milkDays) : 0,
    milkDays
  };
}

function buildHealthExpenseTransactions(records) {
  return (records || [])
    .filter((record) => Number(record.cost || 0) > 0)
    .map((record) => ({
      id: `health-${record.id}`,
      date: record.date,
      type: "खर्च",
      category: "औषध",
      amount: Number(record.cost || 0)
    }));
}

function buildAIExpenseTransactions(records) {
  return (records || [])
    .filter((record) => Number(record.cost || 0) > 0)
    .map((record) => ({
      id: `ai-${record.id}`,
      date: record.ai_date,
      type: "खर्च",
      category: "रेतन खर्च",
      amount: Number(record.cost || 0)
    }));
}

function buildMonthlyExpenseTransactions(records) {
  return (records || [])
    .filter((record) => Number(record.amount || 0) > 0)
    .map((record) => ({
      id: `monthly-${record.id}`,
      date: record.expense_date,
      type: "खर्च",
      category: record.category || "इतर",
      amount: Number(record.amount || 0)
    }));
}

function buildFinanceSummary(records, monthlyExpenses, healthRecords, aiRecords, settlements, monthRows, milkSummary) {
  const incomeByCategory = {};
  const monthlyExpenseByCategory = {};
  const annualExpenseByCategory = {};
  let totalIncome = 0;
  let monthlyExpense = 0;
  let annualExpense = 0;
  let manualMilkIncome = 0;
  let dairyFeedDeduction = 0;
  let otherDeductions = 0;

  records.map(normalizeFinanceRecord).forEach((record) => {
    const amount = Number(record.amount || 0);
    const key = getMonthKeyFromDate(record.date);
    const month = monthRows.find((item) => item.key === key);

    if (record.type === "उत्पन्न") {
      const category = displayFinanceCategory(record.category);
      totalIncome += amount;
      addToGroup(incomeByCategory, category, amount);

      if (category === "दूध विक्री") {
        manualMilkIncome += amount;
      }

      if (month) {
        month.totalIncome += amount;
      }

      return;
    }

    if (record.type !== "खर्च") {
      return;
    }

    if (record.accounting_period === "annual") {
      annualExpense += amount;
      addToGroup(annualExpenseByCategory, record.category, amount);

      if (month) {
        month.annualExpense += amount;
      }
    } else {
      monthlyExpense += amount;
      addToGroup(monthlyExpenseByCategory, record.category, amount);

      if (month) {
        month.monthlyExpense += amount;
      }
    }
  });

  const autoMilkIncomeToAdd = Math.max(0, milkSummary.milkIncome - manualMilkIncome);
  totalIncome += autoMilkIncomeToAdd;
  addToGroup(incomeByCategory, "दूध विक्री", autoMilkIncomeToAdd);

  monthRows.forEach((month) => {
    const manualMonthMilk = records
      .map(normalizeFinanceRecord)
      .filter(
        (record) =>
          record.type === "उत्पन्न" &&
          displayFinanceCategory(record.category) === "दूध विक्री" &&
          getMonthKeyFromDate(record.date) === month.key
      )
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);
    month.totalIncome += Math.max(0, month.milkIncome - manualMonthMilk);
  });

  [
    ...buildMonthlyExpenseTransactions(monthlyExpenses),
    ...buildHealthExpenseTransactions(healthRecords),
    ...buildAIExpenseTransactions(aiRecords)
  ].forEach((record) => {
      const amount = Number(record.amount || 0);
      const key = getMonthKeyFromDate(record.date);
      const month = monthRows.find((item) => item.key === key);

      monthlyExpense += amount;
      addToGroup(monthlyExpenseByCategory, record.category, amount);

      if (month) {
        month.monthlyExpense += amount;
      }
    });

  (settlements || []).forEach((settlement) => {
    const key = getMonthKeyFromDate(getSettlementAccountingDate(settlement));
    const month = monthRows.find((item) => item.key === key);
    const feedDeduction = Number(settlement.cattle_feed_deduction || 0);
    const otherDeduction = Number(settlement.other_deductions || 0);

    dairyFeedDeduction += feedDeduction;
    otherDeductions += otherDeduction;

    if (month) {
      month.dairyFeedDeduction += feedDeduction;
      month.otherDeductions += otherDeduction;
    }
  });

  monthRows.forEach((month) => {
    month.milkLitres = roundMoney(month.milkLitres);
    month.morningLitres = roundMoney(month.morningLitres);
    month.eveningLitres = roundMoney(month.eveningLitres);
    month.milkIncome = roundMoney(month.milkIncome);
    month.totalIncome = roundMoney(month.totalIncome);
    month.monthlyExpense = roundMoney(month.monthlyExpense);
    month.annualExpense = roundMoney(month.annualExpense);
    month.dairyFeedDeduction = roundMoney(month.dairyFeedDeduction);
    month.otherDeductions = roundMoney(month.otherDeductions);
    month.netProfit = roundMoney(
      month.totalIncome - month.monthlyExpense - month.annualExpense - month.dairyFeedDeduction - month.otherDeductions
    );
  });

  return {
    totalIncome: roundMoney(totalIncome),
    monthlyExpense: roundMoney(monthlyExpense),
    annualExpense: roundMoney(annualExpense),
    dairyFeedDeduction: roundMoney(dairyFeedDeduction),
    otherDeductions: roundMoney(otherDeductions),
    netProfit: roundMoney(totalIncome - monthlyExpense - annualExpense - dairyFeedDeduction - otherDeductions),
    incomeByCategory: groupsToArray(incomeByCategory),
    monthlyExpenseByCategory: groupsToArray(monthlyExpenseByCategory),
    annualExpenseByCategory: groupsToArray(annualExpenseByCategory)
  };
}

function buildFeedSummary(records) {
  const bySection = {};
  let monthlyTotal = 0;
  let annualTotal = 0;

  (records || []).forEach((record) => {
    const section = displayFeedSectionName(record.section);
    const amount = Number(record.total_cost || 0);
    const period = record.accounting_period || (record.section === "मुरघास" || record.section === "भुसा" ? "annual" : "monthly");

    bySection[section] = roundMoney((bySection[section] || 0) + amount);

    if (period === "annual") {
      annualTotal += amount;
    } else {
      monthlyTotal += amount;
    }
  });

  return {
    monthlyTotal: roundMoney(monthlyTotal),
    annualTotal: roundMoney(annualTotal),
    total: roundMoney(monthlyTotal + annualTotal),
    bySection: groupsToArray(bySection)
  };
}

function countByStatus(cows) {
  return (cows || []).reduce((groups, cow) => {
    const status = cow.status || "स्थिती नाही";
    groups[status] = (groups[status] || 0) + 1;
    return groups;
  }, {});
}

function buildTopMonths(monthRows) {
  const milkMonths = [...monthRows].sort((first, second) => second.milkLitres - first.milkLitres);
  const profitMonths = [...monthRows].sort((first, second) => second.netProfit - first.netProfit);

  return {
    bestMilkMonth: milkMonths[0] || null,
    lowestMilkMonth: milkMonths.filter((month) => month.milkLitres > 0).at(-1) || null,
    bestProfitMonth: profitMonths[0] || null,
    lowestProfitMonth: profitMonths.at(-1) || null
  };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const year = getYearInput(searchParams);

    if (!year) {
      return NextResponse.json({ error: "वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const range = getYearRange(year);
    const supabase = getSupabaseServerClient();
    const [
      farmResult,
      milkResult,
      financeResult,
      monthlyExpenseResult,
      healthResult,
      settlementResult,
      feedResult,
      cowsResult,
      aiResult,
      calvingResult
    ] = await Promise.all([
      supabase.from("farms").select("*").eq("id", farmId).single(),
      supabase
        .from("milk_records")
        .select("*")
        .eq("farm_id", farmId)
        .is("cow_id", null)
        .gte("date", range.start)
        .lt("date", range.end)
        .order("date", { ascending: true }),
      supabase
        .from("finance_records")
        .select("*")
        .eq("farm_id", farmId)
        .gte("date", range.start)
        .lt("date", range.end)
        .order("date", { ascending: true }),
      supabase
        .from("monthly_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("expense_date", range.start)
        .lt("expense_date", range.end),
      supabase
        .from("health_records")
        .select("id, farm_id, cow_id, date, type, cost, vaccine_name, description")
        .eq("farm_id", farmId)
        .gte("date", range.start)
        .lt("date", range.end),
      supabase
        .from("dairy_settlements")
        .select("id, farm_id, settlement_date, period_start, period_end, cattle_feed_deduction, other_deductions")
        .eq("farm_id", farmId)
        .gte("period_end", range.start)
        .lt("period_end", range.end),
      supabase
        .from("feed_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("date", range.start)
        .lt("date", range.end),
      supabase
        .from("cows")
        .select("id, name, breed, status, date_of_birth, color, is_active")
        .eq("farm_id", farmId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("ai_records")
        .select("id, cow_id, ai_date, cost, pregnancy_result")
        .eq("farm_id", farmId)
        .gte("ai_date", range.start)
        .lt("ai_date", range.end),
      supabase
        .from("calving_records")
        .select("id, cow_id, actual_date, calf_count, calf_gender")
        .eq("farm_id", farmId)
        .gte("actual_date", range.start)
        .lt("actual_date", range.end)
    ]);

    const firstError = [
      farmResult.error,
      milkResult.error,
      financeResult.error,
      monthlyExpenseResult.error,
      healthResult.error,
      settlementResult.error,
      feedResult.error,
      cowsResult.error,
      aiResult.error,
      calvingResult.error
    ].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    const monthRows = buildEmptyMonths(year);
    const milkSummary = buildMilkSummary(milkResult.data || [], monthRows);
    const financeSummary = buildFinanceSummary(
      financeResult.data || [],
      monthlyExpenseResult.data || [],
      healthResult.data || [],
      aiResult.data || [],
      settlementResult.data || [],
      monthRows,
      milkSummary
    );
    const feedSummary = buildFeedSummary(feedResult.data || []);
    const healthCost = roundMoney((healthResult.data || []).reduce((sum, item) => sum + Number(item.cost || 0), 0));
    const aiCost = roundMoney((aiResult.data || []).reduce((sum, item) => sum + Number(item.cost || 0), 0));
    const calfCount = (calvingResult.data || []).reduce((sum, item) => sum + Number(item.calf_count || 0), 0);

    return NextResponse.json({
      data: {
        year,
        range,
        generatedAt: new Date().toISOString(),
        farm: normalizeFarm(farmResult.data),
        summary: {
          ...milkSummary,
          ...financeSummary,
          totalExpenseForYear: roundMoney(financeSummary.monthlyExpense + financeSummary.annualExpense),
          activeCowCount: (cowsResult.data || []).length,
          aiCount: (aiResult.data || []).length,
          calvingCount: (calvingResult.data || []).length,
          calfCount,
          healthRecordCount: (healthResult.data || []).length,
          healthCost,
          aiCost,
          feedTotal: feedSummary.total
        },
        monthRows,
        feedSummary,
        cowSummary: {
          activeCowCount: (cowsResult.data || []).length,
          byStatus: groupsToArray(countByStatus(cowsResult.data || [])).map((item) => ({
            status: item.category,
            count: item.amount
          }))
        },
        reproductionSummary: {
          aiCount: (aiResult.data || []).length,
          pregnantCount: (aiResult.data || []).filter((item) => item.pregnancy_result === "गाभण").length,
          calvingCount: (calvingResult.data || []).length,
          calfCount
        },
        healthSummary: {
          recordsCount: (healthResult.data || []).length,
          cost: healthCost,
          vaccinationCount: (healthResult.data || []).filter((item) => item.type === "लसीकरण").length,
          medicineCount: (healthResult.data || []).filter((item) => item.type !== "लसीकरण").length
        },
        topMonths: buildTopMonths(monthRows),
        monthNames: reportMonths
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
