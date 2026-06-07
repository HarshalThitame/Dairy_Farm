import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  getMonthYearString,
  normalizeAccountingExpenseCategory,
  refreshSummaryForDate
} from "@/lib/accountingUtils";
import { getTodayISODate } from "@/lib/marathiUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const expenseFields = ["expense_date", "category", "amount", "description", "vendor_name"];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateExpenseId(id) {
  return UUID_PATTERN.test(String(id ?? "").trim());
}

async function readJsonBody(request) {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

function cleanOptional(value) {
  const text = String(value || "").trim();
  return text || null;
}

function parseAmount(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const amount = Number(
    String(value)
      .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[,₹\s]/g, "")
      .replace(/[Oo]/g, "0")
  );

  return Number.isFinite(amount) ? amount : null;
}

function pickFields(body) {
  return expenseFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
    if (!validateExpenseId(params.id)) {
      return NextResponse.json({ error: "खर्च नोंद ID चुकीचा आहे." }, { status: 400 });
    }

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
    if (!validateExpenseId(params.id)) {
      return NextResponse.json({ error: "खर्च नोंद ID चुकीचा आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request);
    const body = await readJsonBody(request);

    if (!body) {
      return NextResponse.json({ error: "माहिती योग्य format मध्ये पाठवा." }, { status: 400 });
    }

    const payload = pickFields(body);

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    if (
      payload.amount !== undefined &&
      (parseAmount(payload.amount) === null || parseAmount(payload.amount) <= 0)
    ) {
      return NextResponse.json({ error: "रक्कम शून्यापेक्षा जास्त असावी." }, { status: 400 });
    }

    if (payload.amount !== undefined && parseAmount(payload.amount) > 10000000) {
      return NextResponse.json({ error: "रक्कम असामान्य आहे. कृपया तपासा." }, { status: 400 });
    }

    if (payload.expense_date !== undefined) {
      if (!isValidISODate(payload.expense_date)) {
        return NextResponse.json({ error: "तारीख चुकीची आहे." }, { status: 400 });
      }

      if (payload.expense_date > getTodayISODate()) {
        return NextResponse.json({ error: "भविष्यातील तारीख वापरता येणार नाही." }, { status: 400 });
      }
    }

    if (payload.amount !== undefined) {
      payload.amount = parseAmount(payload.amount);
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
    if (!validateExpenseId(params.id)) {
      return NextResponse.json({ error: "खर्च नोंद ID चुकीचा आहे." }, { status: 400 });
    }

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
