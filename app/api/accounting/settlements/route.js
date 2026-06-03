import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  calculateSettlementMatch,
  matchSettlementToSlips,
  refreshSettlementSummaries,
  summarizeSettlements
} from "@/lib/accountingUtils";
import { getMonthInput, getMonthRange } from "@/lib/reportUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const settlementFields = [
  "settlement_date",
  "period_start",
  "period_end",
  "dairy_name",
  "dairy_member_number",
  "total_liters",
  "total_milk_income",
  "cattle_feed_deduction",
  "other_deductions",
  "payment_received",
  "payment_received_date",
  "payment_received_amount",
  "discrepancy_notes",
  "settlement_notes",
  "settlement_image_url"
];

async function readJsonBody(request) {
  const body = await request.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? body : null;
}

function cleanOptional(value) {
  const text = String(value || "").trim();
  return text || null;
}

function parseNumber(value) {
  const normalized = String(value ?? "")
    .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[,₹\s]/g, "")
    .replace(/[Oo]/g, "0");
  const number = Number(normalized || 0);
  return Number.isFinite(number) ? number : null;
}

function money(value) {
  return parseNumber(value) ?? 0;
}

function isFiniteNumber(value) {
  return parseNumber(value) !== null;
}

function pickFields(body) {
  return settlementFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function validateSettlement(body) {
  if (!body.settlement_date || !body.period_start || !body.period_end) {
    return "सेटलमेंट तारीख आणि पीरियड आवश्यक आहे.";
  }

  if (body.period_end < body.period_start) {
    return "पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा.";
  }

  if (
    body.total_milk_income === "" ||
    body.total_milk_income === undefined ||
    !isFiniteNumber(body.total_milk_income) ||
    money(body.total_milk_income) <= 0
  ) {
    return "एकूण उत्पन्न शून्यापेक्षा जास्त असावे.";
  }

  if (
    body.total_liters !== "" &&
    body.total_liters !== undefined &&
    (!isFiniteNumber(body.total_liters) || money(body.total_liters) < 0)
  ) {
    return "एकूण दूध शून्य किंवा त्यापेक्षा जास्त असावे.";
  }

  if (
    (body.cattle_feed_deduction !== undefined &&
      body.cattle_feed_deduction !== "" &&
      (!isFiniteNumber(body.cattle_feed_deduction) || money(body.cattle_feed_deduction) < 0)) ||
    (body.other_deductions !== undefined &&
      body.other_deductions !== "" &&
      (!isFiniteNumber(body.other_deductions) || money(body.other_deductions) < 0))
  ) {
    return "कपात शून्य किंवा त्यापेक्षा जास्त असावी.";
  }

  if (
    body.payment_received &&
    body.payment_received_amount !== "" &&
    body.payment_received_amount !== undefined &&
    (!isFiniteNumber(body.payment_received_amount) || money(body.payment_received_amount) < 0)
  ) {
    return "प्राप्त रक्कम शून्य किंवा त्यापेक्षा जास्त असावी.";
  }

  return "";
}

async function getFarmDairyInfo(supabase, farmId) {
  const { data } = await supabase
    .from("farms")
    .select("dairy_name, dairy_member_number")
    .eq("id", farmId)
    .maybeSingle();

  return data || {};
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
    const { data, error } = await supabase
      .from("dairy_settlements")
      .select("*")
      .eq("farm_id", farmId)
      .gte("period_end", range.start)
      .lt("period_end", range.end)
      .order("period_end", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const reconciliation = await Promise.all(
      (data || []).map(async (settlement) => ({
        settlement_id: settlement.id,
        ...(await calculateSettlementMatch(supabase, farmId, settlement))
      }))
    );

    return NextResponse.json({
      data: {
        settlements: data || [],
        summary: summarizeSettlements(data || []),
        reconciliation
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);

    if (!body) {
      return NextResponse.json({ error: "माहिती योग्य format मध्ये पाठवा." }, { status: 400 });
    }

    const validationError = validateSettlement(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const farmInfo = await getFarmDairyInfo(supabase, farmId);
    const payload = {
      ...pickFields(body),
      farm_id: farmId,
      dairy_name: cleanOptional(body.dairy_name) || farmInfo.dairy_name || null,
      dairy_member_number: cleanOptional(body.dairy_member_number) || farmInfo.dairy_member_number || null,
      total_liters:
        body.total_liters === "" || body.total_liters === undefined || body.total_liters === null
          ? null
          : money(body.total_liters),
      total_milk_income: money(body.total_milk_income),
      cattle_feed_deduction: money(body.cattle_feed_deduction),
      other_deductions: money(body.other_deductions),
      payment_received: Boolean(body.payment_received),
      payment_received_date: body.payment_received ? body.payment_received_date || body.settlement_date : null,
      payment_received_amount:
        body.payment_received && body.payment_received_amount !== "" && body.payment_received_amount !== undefined
          ? money(body.payment_received_amount)
          : null,
      discrepancy_notes: cleanOptional(body.discrepancy_notes),
      settlement_notes: cleanOptional(body.settlement_notes),
      settlement_image_url: cleanOptional(body.settlement_image_url)
    };

    const { data: inserted, error } = await supabase
      .from("dairy_settlements")
      .insert(payload)
      .select()
      .single();

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "या पीरियडचे सेटलमेंट आधीच आहे. कृपया संपादित करा." },
        { status: 409 }
      );
    }

    if (error) {
      throw error;
    }

    const matched = await matchSettlementToSlips(supabase, farmId, inserted);
    const summary = await refreshSettlementSummaries(supabase, farmId, inserted);

    return NextResponse.json(
      {
        data: {
          success: true,
          settlement: matched.settlement,
          discrepancy: matched.reconciliation.discrepancy,
          matchedSlips: matched.reconciliation.matchedSlips,
          reconciliation: matched.reconciliation,
          summary
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return farmErrorResponse(error);
  }
}
