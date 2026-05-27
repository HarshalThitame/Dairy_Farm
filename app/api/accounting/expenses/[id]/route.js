import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  getMonthYearString,
  normalizeAccountingExpenseCategory,
  refreshSummaryForDate
} from "@/lib/accountingUtils";
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

async function fetchExpense(supabase, farmId, id) {
  const { data, error } = await supabase
    .from("monthly_expenses")
    .select("*")
    .eq("id", id)
    .eq("farm_id", farmId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function GET(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const expense = await fetchExpense(supabase, farmId, params.id);

    if (!expense) {
      return NextResponse.json({ error: "खर्च नोंद सापडली नाही." }, { status: 404 });
    }

    return NextResponse.json({ data: expense });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const body = await request.json();
    const payload = pickFields(body);

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    if (
      payload.amount !== undefined &&
      (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) <= 0)
    ) {
      return NextResponse.json({ error: "रक्कम शून्यापेक्षा जास्त असावी." }, { status: 400 });
    }

    if (payload.amount !== undefined) {
      payload.amount = Number(payload.amount);
    }

    if (payload.expense_date) {
      payload.month_year = getMonthYearString(payload.expense_date);
    }

    if (payload.category !== undefined) {
      payload.category = normalizeAccountingExpenseCategory(payload.category);
    }
    if (payload.description !== undefined) {
      payload.description = cleanOptional(payload.description);
    }
    if (payload.vendor_name !== undefined) {
      payload.vendor_name = cleanOptional(payload.vendor_name);
    }
    payload.updated_at = new Date().toISOString();

    const supabase = getSupabaseServerClient();
    const oldExpense = await fetchExpense(supabase, farmId, params.id);

    if (!oldExpense) {
      return NextResponse.json({ error: "खर्च नोंद सापडली नाही." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("monthly_expenses")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "खर्च नोंद सापडली नाही." }, { status: 404 });
    }

    await refreshSummaryForDate(supabase, farmId, oldExpense.expense_date);
    const summary = await refreshSummaryForDate(supabase, farmId, data.expense_date);

    return NextResponse.json({ data: { success: true, expense: data, summary } });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("monthly_expenses")
      .delete()
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "खर्च नोंद सापडली नाही." }, { status: 404 });
    }

    const summary = await refreshSummaryForDate(supabase, farmId, data.expense_date);

    return NextResponse.json({ data: { success: true, expense: data, summary } });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
