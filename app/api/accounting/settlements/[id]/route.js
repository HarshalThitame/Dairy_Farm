import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  calculateSettlementMatch,
  matchSettlementToSlips,
  refreshSettlementSummaries,
  refreshSummaryForDate
} from "@/lib/accountingUtils";
import { getSupabaseServerClient } from "@/lib/supabase";
import { recomputeMilkRecordFromDairySlips } from "@/lib/milkDairySync";

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

function pickFields(body) {
  return settlementFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function hasField(payload, field) {
  return Object.prototype.hasOwnProperty.call(payload, field);
}

function normalizePayload(payload) {
  ["dairy_name", "dairy_member_number", "discrepancy_notes", "settlement_notes", "settlement_image_url"].forEach(
    (field) => {
      if (payload[field] !== undefined) {
        payload[field] = cleanOptional(payload[field]);
      }
    }
  );

  ["cattle_feed_deduction", "other_deductions"].forEach((field) => {
    if (!hasField(payload, field)) {
      return;
    }

    if (payload[field] === "" || payload[field] === null) {
      payload[field] = 0;
    } else {
      payload[field] = parseNumber(payload[field]) ?? Number.NaN;
    }
  });

  ["total_milk_income", "payment_received_amount"].forEach((field) => {
    if (!hasField(payload, field)) {
      return;
    }

    payload[field] = payload[field] === "" || payload[field] === null ? null : parseNumber(payload[field]) ?? Number.NaN;
  });

  if (hasField(payload, "total_liters")) {
    payload.total_liters = payload.total_liters === "" || payload.total_liters === null ? null : parseNumber(payload.total_liters) ?? Number.NaN;
  }

  if (payload.payment_received === false) {
    payload.payment_received_date = null;
    payload.payment_received_amount = null;
  }

  payload.updated_at = new Date().toISOString();
  return payload;
}

function validateNumericPayload(payload) {
  const labels = {
    total_liters: "एकूण दूध",
    total_milk_income: "एकूण उत्पन्न",
    cattle_feed_deduction: "खाद्य कपात",
    other_deductions: "इतर कपात",
    payment_received_amount: "प्राप्त रक्कम"
  };

  for (const [field, label] of Object.entries(labels)) {
    if (!hasField(payload, field) || payload[field] === null) {
      continue;
    }

    if (!Number.isFinite(Number(payload[field])) || Number(payload[field]) < 0) {
      return `${label} शून्य किंवा त्यापेक्षा जास्त असावी.`;
    }
  }

  if (hasField(payload, "total_milk_income") && Number(payload.total_milk_income || 0) <= 0) {
    return "एकूण उत्पन्न शून्यापेक्षा जास्त असावे.";
  }

  return "";
}

async function fetchSettlement(supabase, farmId, id) {
  const { data, error } = await supabase
    .from("dairy_settlements")
    .select("*")
    .eq("id", id)
    .eq("farm_id", farmId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

function parseRawData(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  return typeof value === "object" ? value : {};
}

function isGeneratedFromSettlementSlip(slip = {}, settlement = {}) {
  const raw = parseRawData(slip.ai_raw_data);
  const isSettlementSlipSource = raw.source === "settlement_slip";
  const periodStartMatches = !raw.settlement_period_start || raw.settlement_period_start === settlement.period_start;
  const periodEndMatches = !raw.settlement_period_end || raw.settlement_period_end === settlement.period_end;
  const imageMatches =
    !settlement.settlement_image_url ||
    !slip.slip_image_url ||
    slip.slip_image_url === settlement.settlement_image_url;

  if (isSettlementSlipSource && periodStartMatches && periodEndMatches && imageMatches) {
    return true;
  }

  const notes = String(slip.notes || "");
  return (
    notes.includes("१५ दिवसांच्या सेटलमेंट स्लिपवरून") &&
    slip.ai_extracted === true &&
    imageMatches
  );
}

async function deleteSettlementGeneratedSlips(supabase, farmId, settlement = {}) {
  if (!settlement.period_start || !settlement.period_end) {
    return { deletedSlipCount: 0, affectedDates: [] };
  }

  const { data: slips, error: fetchError } = await supabase
    .from("dairy_slips")
    .select("id, slip_date, notes, ai_extracted, ai_raw_data, slip_image_url")
    .eq("farm_id", farmId)
    .gte("slip_date", settlement.period_start)
    .lte("slip_date", settlement.period_end);

  if (fetchError) {
    throw fetchError;
  }

  const generatedSlips = (slips || []).filter((slip) => isGeneratedFromSettlementSlip(slip, settlement));
  const generatedIds = generatedSlips.map((slip) => slip.id).filter(Boolean);
  const affectedDates = Array.from(new Set(generatedSlips.map((slip) => slip.slip_date).filter(Boolean)));

  if (!generatedIds.length) {
    return { deletedSlipCount: 0, affectedDates };
  }

  const { error: deleteError } = await supabase
    .from("dairy_slips")
    .delete()
    .eq("farm_id", farmId)
    .in("id", generatedIds);

  if (deleteError) {
    throw deleteError;
  }

  for (const date of affectedDates) {
    await recomputeMilkRecordFromDairySlips(supabase, farmId, date);
  }

  return {
    deletedSlipCount: generatedIds.length,
    affectedDates
  };
}

async function refreshSummariesForDates(supabase, farmId, dates = []) {
  const monthDates = Array.from(
    new Map(
      dates
        .filter(Boolean)
        .map((date) => [String(date).slice(0, 7), date])
    ).values()
  );
  const summaries = [];

  for (const date of monthDates) {
    summaries.push(await refreshSummaryForDate(supabase, farmId, date));
  }

  return summaries;
}

export async function GET(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const settlement = await fetchSettlement(supabase, farmId, params.id);

    if (!settlement) {
      return NextResponse.json({ error: "सेटलमेंट सापडले नाही." }, { status: 404 });
    }

    const reconciliation = await calculateSettlementMatch(supabase, farmId, settlement);

    return NextResponse.json({
      data: {
        settlement,
        matchedSlips: reconciliation.matchedSlips,
        reconciliation
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const body = await request.json();
    const payload = normalizePayload(pickFields(body));

    if (Object.keys(payload).length === 1 && payload.updated_at) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    if (payload.period_start && payload.period_end && payload.period_end < payload.period_start) {
      return NextResponse.json({ error: "पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा." }, { status: 400 });
    }

    const numericError = validateNumericPayload(payload);

    if (numericError) {
      return NextResponse.json({ error: numericError }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const oldSettlement = await fetchSettlement(supabase, farmId, params.id);

    if (!oldSettlement) {
      return NextResponse.json({ error: "सेटलमेंट सापडले नाही." }, { status: 404 });
    }

    const nextPeriodStart = payload.period_start || oldSettlement.period_start;
    const nextPeriodEnd = payload.period_end || oldSettlement.period_end;

    if (nextPeriodStart && nextPeriodEnd && nextPeriodEnd < nextPeriodStart) {
      return NextResponse.json({ error: "पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा." }, { status: 400 });
    }


    const { data: updated, error } = await supabase
      .from("dairy_settlements")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "या पीरियडचे दुसरे सेटलमेंट आधीच आहे." },
        { status: 409 }
      );
    }

    if (error || !updated) {
      return NextResponse.json({ error: "सेटलमेंट सापडले नाही." }, { status: 404 });
    }

    const matched = await matchSettlementToSlips(supabase, farmId, updated);
    await refreshSettlementSummaries(supabase, farmId, oldSettlement);
    const summary = await refreshSettlementSummaries(supabase, farmId, updated);

    return NextResponse.json({
      data: {
        success: true,
        settlement: matched.settlement,
        matchedSlips: matched.reconciliation.matchedSlips,
        reconciliation: matched.reconciliation,
        summary
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();
    const settlement = await fetchSettlement(supabase, farmId, params.id);

    if (!settlement) {
      return NextResponse.json({ error: "सेटलमेंट सापडले नाही." }, { status: 404 });
    }

    const payload = {
      payment_received: Boolean(body.payment_received ?? true),
      payment_received_date: body.payment_received_date || settlement.settlement_date,
      payment_received_amount:
        body.payment_received_amount === undefined || body.payment_received_amount === ""
          ? Number(settlement.total_milk_income || 0) -
            Number(settlement.cattle_feed_deduction || 0) -
            Number(settlement.other_deductions || 0)
          : parseNumber(body.payment_received_amount) ?? Number.NaN,
      updated_at: new Date().toISOString()
    };

    if (
      payload.payment_received &&
      (!Number.isFinite(Number(payload.payment_received_amount)) || Number(payload.payment_received_amount) < 0)
    ) {
      return NextResponse.json({ error: "प्राप्त रक्कम शून्य किंवा त्यापेक्षा जास्त असावी." }, { status: 400 });
    }

    if (!payload.payment_received) {
      payload.payment_received_date = null;
      payload.payment_received_amount = null;
    }

    const { data, error } = await supabase
      .from("dairy_settlements")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "पेमेंट स्थिती बदलली नाही." }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true, settlement: data } });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const existing = await fetchSettlement(supabase, farmId, params.id);

    if (!existing) {
      return NextResponse.json({ error: "सेटलमेंट सापडले नाही." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("dairy_settlements")
      .delete()
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "सेटलमेंट सापडले नाही." }, { status: 404 });
    }

    const generatedSlipCleanup = await deleteSettlementGeneratedSlips(supabase, farmId, existing);
    const refreshedSummaries = await refreshSummariesForDates(supabase, farmId, [
      data.period_end,
      data.settlement_date,
      ...generatedSlipCleanup.affectedDates
    ]);
    const summary = refreshedSummaries[0] || await refreshSettlementSummaries(supabase, farmId, data);

    return NextResponse.json({
      data: {
        success: true,
        settlement: data,
        summary,
        deletedGeneratedSlips: generatedSlipCleanup.deletedSlipCount,
        affectedDates: generatedSlipCleanup.affectedDates
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
