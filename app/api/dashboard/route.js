import { NextResponse } from "next/server";
import { ACCOUNTING_PERIOD_MONTHLY } from "@/lib/accountingPeriods";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { addDaysToISODate, getTodayISODate } from "@/lib/reminderUtils";
import {
  displayFinanceCategory,
  getMonthInput,
  getMonthRange,
  getRecordMilkAmount,
  getRecordMilkTotal
} from "@/lib/reportUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const reminderFields = "id, cow_id, type, message, reminder_date, is_done, cows(id, name, breed, status)";

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function sum(records, field) {
  return (records || []).reduce((total, record) => total + Number(record[field] || 0), 0);
}

function isAnnualCharaByDescription(record) {
  const description = String(record.description || "").trim();

  return (
    record.type === "खर्च" &&
    displayFinanceCategory(record.category) === "चारा" &&
    (description.startsWith("मुरघास") || description.startsWith("भुसा"))
  );
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

function buildFinanceSummary({ financeRecords, milkRecords, healthRecords, monthlyExpenses, settlements }) {
  const monthlyFinance = (financeRecords || []).filter(
    (record) => getFinanceAccountingPeriod(record) !== "annual"
  );
  const milkIncome = (milkRecords || []).reduce((total, record) => total + getRecordMilkAmount(record), 0);
  const manualMilkIncome = monthlyFinance
    .filter(
      (record) =>
        record.type === "उत्पन्न" && displayFinanceCategory(record.category) === "दूध विक्री"
    )
    .reduce((total, record) => total + Number(record.amount || 0), 0);
  const derivedMilkIncome = Math.max(0, milkIncome - manualMilkIncome);
  const manualIncome = monthlyFinance
    .filter((record) => record.type === "उत्पन्न")
    .reduce((total, record) => total + Number(record.amount || 0), 0);
  const manualExpense = monthlyFinance
    .filter((record) => record.type === "खर्च")
    .reduce((total, record) => total + Number(record.amount || 0), 0);
  const healthExpense = sum(healthRecords, "cost");
  const accountingExpense = sum(monthlyExpenses, "amount");
  const otherDeductions = sum(settlements, "other_deductions");
  const feedDeductions = sum(settlements, "cattle_feed_deduction");

  const totalIncome = roundMoney(manualIncome + derivedMilkIncome);
  const totalExpense = roundMoney(manualExpense + healthExpense + accountingExpense);

  return {
    totalIncome,
    totalExpense,
    netProfit: roundMoney(totalIncome - totalExpense - feedDeductions - otherDeductions),
    milkIncome: roundMoney(milkIncome),
    totalDeductions: roundMoney(feedDeductions + otherDeductions),
    deductionsCountedInProfit: roundMoney(feedDeductions + otherDeductions)
  };
}

function buildCalvesSummary(calves) {
  const active = (calves || []).filter((calf) => calf.status === "active" && calf.is_raised);

  return {
    total: (calves || []).length,
    active: active.length,
    milkFeeding: active.filter((calf) => calf.milk_feeding_status === "दूध पाजायचे सुरू आहे").length,
    historical: (calves || []).filter((calf) => calf.status === "historical").length,
    sold: (calves || []).filter((calf) => calf.status === "sold").length,
    dead: (calves || []).filter((calf) => calf.status === "dead").length,
    converted: (calves || []).filter((calf) => calf.status === "converted_to_cow").length
  };
}

function assertQuery(result) {
  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthInput = getMonthInput(searchParams);

    if (!monthInput) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const today = getTodayISODate();
    const weekEnd = addDaysToISODate(today, 7);
    const monthRange = getMonthRange(monthInput.month, monthInput.year);
    const supabase = getSupabaseServerClient();
    const [
      cowsResult,
      todayMilkResult,
      todayRemindersResult,
      overdueRemindersResult,
      upcomingRemindersResult,
      calvesResult,
      monthMilkResult,
      financeResult,
      healthResult,
      monthlyExpensesResult,
      settlementsResult
    ] = await Promise.all([
      supabase
        .from("cows")
        .select("id, status", { count: "exact" })
        .eq("farm_id", farmId)
        .eq("is_active", true),
      supabase
        .from("milk_records")
        .select("id, date, morning_litres, evening_litres, total_litres")
        .eq("farm_id", farmId)
        .is("cow_id", null)
        .eq("date", today),
      supabase
        .from("reminders")
        .select(reminderFields, { count: "exact" })
        .eq("farm_id", farmId)
        .eq("reminder_date", today)
        .eq("is_done", false)
        .order("created_at", { ascending: true })
        .limit(5),
      supabase
        .from("reminders")
        .select(reminderFields, { count: "exact" })
        .eq("farm_id", farmId)
        .lt("reminder_date", today)
        .eq("is_done", false)
        .order("reminder_date", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(5),
      supabase
        .from("reminders")
        .select(reminderFields, { count: "exact" })
        .eq("farm_id", farmId)
        .gt("reminder_date", today)
        .lte("reminder_date", weekEnd)
        .eq("is_done", false)
        .order("reminder_date", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(5),
      supabase
        .from("calves")
        .select("id, status, is_raised, milk_feeding_status")
        .eq("farm_id", farmId),
      supabase
        .from("milk_records")
        .select(
          "id, date, morning_litres, evening_litres, total_litres, price_per_litre, morning_price_per_litre, evening_price_per_litre, total_amount"
        )
        .eq("farm_id", farmId)
        .is("cow_id", null)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end),
      supabase
        .from("finance_records")
        .select("id, date, type, category, amount, accounting_period, description")
        .eq("farm_id", farmId)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end),
      supabase
        .from("health_records")
        .select("id, date, cost")
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("date", monthRange.start)
        .lt("date", monthRange.end),
      supabase
        .from("monthly_expenses")
        .select("id, expense_date, amount")
        .eq("farm_id", farmId)
        .gte("expense_date", monthRange.start)
        .lt("expense_date", monthRange.end),
      supabase
        .from("dairy_settlements")
        .select("id, settlement_date, period_end, cattle_feed_deduction, other_deductions")
        .eq("farm_id", farmId)
        .gte("period_end", monthRange.start)
        .lt("period_end", monthRange.end)
    ]);

    const cows = assertQuery(cowsResult);
    const todayMilkRecords = assertQuery(todayMilkResult);
    const todayReminders = assertQuery(todayRemindersResult);
    const overdueReminders = assertQuery(overdueRemindersResult);
    const upcomingReminders = assertQuery(upcomingRemindersResult);
    const calves = assertQuery(calvesResult);
    const monthMilkRecords = assertQuery(monthMilkResult);
    const financeRecords = assertQuery(financeResult);
    const healthRecords = assertQuery(healthResult);
    const monthlyExpenses = assertQuery(monthlyExpensesResult);
    const settlements = assertQuery(settlementsResult);
    const todayMilkTotal = todayMilkRecords.reduce(
      (total, record) => total + getRecordMilkTotal(record),
      0
    );
    const monthlyLitres = monthMilkRecords.reduce(
      (total, record) => total + getRecordMilkTotal(record),
      0
    );
    const monthlyFinanceReport = buildFinanceSummary({
      financeRecords,
      milkRecords: monthMilkRecords,
      healthRecords,
      monthlyExpenses,
      settlements
    });

    return NextResponse.json({
      data: {
        cowsSummary: {
          total: cowsResult.count ?? cows.length,
          pregnant: cows.filter((cow) => cow.status === "गाभण").length
        },
        todayMilk: {
          records: todayMilkRecords,
          totalLitres: roundMoney(todayMilkTotal)
        },
        reminders: {
          today: todayReminders,
          overdue: overdueReminders,
          upcoming: upcomingReminders,
          todayCount: todayRemindersResult.count ?? todayReminders.length,
          overdueCount: overdueRemindersResult.count ?? overdueReminders.length,
          upcomingCount: upcomingRemindersResult.count ?? upcomingReminders.length
        },
        calvesSummary: buildCalvesSummary(calves),
        monthlyMilkReport: {
          month: monthInput.month,
          year: monthInput.year,
          totalLitres: roundMoney(monthlyLitres)
        },
        monthlyFinanceReport,
        generatedAt: new Date().toISOString(),
        nextRefreshAfter: addDaysToISODate(today, 1)
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
