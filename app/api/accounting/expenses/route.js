import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  combineAccountingExpenses,
  getMonthYearString,
  normalizeAccountingExpenseCategory,
  refreshSummaryForDate,
  summarizeExpenses
} from "@/lib/accountingUtils";
import { getMonthInput, getMonthRange } from "@/lib/reportUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const expenseFields = ["expense_date", "category", "amount", "description", "vendor_name"];

function cleanOptional(value) {
  const text = String(value || "").trim();
  return text || null;
}

function pickFields(body) {
  return expenseFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function validateExpense(body) {
  const amount = Number(body.amount);

  if (!body.expense_date) {
    return "तारीख आवश्यक आहे.";
  }

  if (!body.category) {
    return "खर्चाचा वर्ग निवडा.";
  }

  if (body.amount === "" || body.amount === undefined || !Number.isFinite(amount) || amount <= 0) {
    return "रक्कम शून्यापेक्षा जास्त असावी.";
  }

  return "";
}

function buildSettlementDeductionExpenses(settlements = []) {
  return (settlements || []).flatMap((settlement) => {
    const period = `${settlement.period_start} ते ${settlement.period_end}`;
    const base = {
      farm_id: settlement.farm_id,
      cow_id: null,
      expense_date: settlement.settlement_date,
      vendor_name: settlement.dairy_name || "डेअरी",
      source: "dairy_settlements",
      source_record_id: settlement.id,
      is_derived: true,
      editable: false
    };
    const rows = [];

    if (Number(settlement.cattle_feed_deduction || 0) > 0) {
      rows.push({
        ...base,
        id: `settlement-feed-${settlement.id}`,
        category: "चारा",
        display_category: "डेअरी खाद्य कपात",
        amount: Number(settlement.cattle_feed_deduction || 0),
        description: `सेटलमेंट खाद्य कपात | ${period}`
      });
    }

    if (Number(settlement.other_deductions || 0) > 0) {
      rows.push({
        ...base,
        id: `settlement-other-${settlement.id}`,
        category: "इतर",
        display_category: "डेअरी इतर कपात",
        amount: Number(settlement.other_deductions || 0),
        description: `सेटलमेंट इतर कपात | ${period}`
      });
    }

    return rows;
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

    const range = getMonthRange(monthInput.month, monthInput.year);
    const supabase = getSupabaseServerClient();
    const [monthlyExpenses, financeExpenses, healthExpenses, settlementDeductions] = await Promise.all([
      supabase
        .from("monthly_expenses")
        .select("*")
        .eq("farm_id", farmId)
        .gte("expense_date", range.start)
        .lt("expense_date", range.end)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("finance_records")
        .select("id, farm_id, cow_id, date, type, category, amount, accounting_period, description, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gte("date", range.start)
        .lt("date", range.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("health_records")
        .select("id, farm_id, cow_id, date, type, description, doctor_name, cost, vaccine_name, cows(id, name, breed)")
        .eq("farm_id", farmId)
        .gt("cost", 0)
        .gte("date", range.start)
        .lt("date", range.end)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("dairy_settlements")
        .select("id, farm_id, settlement_date, period_start, period_end, dairy_name, cattle_feed_deduction, other_deductions")
        .eq("farm_id", farmId)
        .gte("settlement_date", range.start)
        .lt("settlement_date", range.end)
        .order("settlement_date", { ascending: false })
        .order("created_at", { ascending: false })
    ]);

    const firstError = [monthlyExpenses.error, financeExpenses.error, healthExpenses.error, settlementDeductions.error].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    const expenses = combineAccountingExpenses({
      monthlyExpenses: monthlyExpenses.data || [],
      financeRecords: financeExpenses.data || [],
      healthRecords: healthExpenses.data || []
    }).concat(buildSettlementDeductionExpenses(settlementDeductions.data || []));
    const summary = summarizeExpenses(expenses);

    return NextResponse.json({
      data: {
        expenses,
        byCategory: summary.byCategory,
        monthlyTotal: summary.monthlyTotal
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validationError = validateExpense(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request);
    const payload = {
      ...pickFields(body),
      farm_id: farmId,
      month_year: getMonthYearString(body.expense_date),
      category: normalizeAccountingExpenseCategory(body.category),
      amount: Number(body.amount),
      description: cleanOptional(body.description),
      vendor_name: cleanOptional(body.vendor_name)
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("monthly_expenses")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const summary = await refreshSummaryForDate(supabase, farmId, data.expense_date);

    return NextResponse.json({ data: { success: true, expense: data, summary } }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
