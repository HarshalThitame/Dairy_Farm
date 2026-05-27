import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  DAIRY_SESSION_EVENING,
  DAIRY_SESSION_MORNING,
  refreshSummaryForDate
} from "@/lib/accountingUtils";
import { recomputeMilkRecordFromDairySlips } from "@/lib/milkDairySync";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const slipFields = [
  "slip_date",
  "session",
  "dairy_name",
  "dairy_member_number",
  "liters",
  "fat_percentage",
  "snf_percentage",
  "clr_degree",
  "rate_per_liter",
  "notes",
  "slip_image_url"
];

function cleanOptional(value) {
  const text = String(value || "").trim();
  return text || null;
}

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function pickSlipFields(body) {
  return slipFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function validateSlip(payload) {
  if (payload.session && ![DAIRY_SESSION_MORNING, DAIRY_SESSION_EVENING].includes(payload.session)) {
    return "सत्र निवडा.";
  }

  if (payload.liters !== undefined && (!Number.isFinite(Number(payload.liters)) || Number(payload.liters) <= 0)) {
    return "दूधाचे लिटर शून्यापेक्षा जास्त असावे.";
  }

  if (
    payload.rate_per_liter !== undefined &&
    (!Number.isFinite(Number(payload.rate_per_liter)) || Number(payload.rate_per_liter) <= 0)
  ) {
    return "दर शून्यापेक्षा जास्त असावा.";
  }

  return "";
}

async function fetchSlip(supabase, farmId, id) {
  const { data, error } = await supabase
    .from("dairy_slips")
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
    const slip = await fetchSlip(supabase, farmId, params.id);

    if (!slip) {
      return NextResponse.json({ error: "दूध नोंद सापडली नाही." }, { status: 404 });
    }

    return NextResponse.json({ data: slip });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const body = await request.json();
    const payload = pickSlipFields(body);
    const validationError = validateSlip(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    if (payload.liters !== undefined) {
      payload.liters = Number(payload.liters);
    }
    if (payload.rate_per_liter !== undefined) {
      payload.rate_per_liter = Number(payload.rate_per_liter);
    }
    if (payload.dairy_name !== undefined) {
      payload.dairy_name = cleanOptional(payload.dairy_name);
    }
    if (payload.dairy_member_number !== undefined) {
      payload.dairy_member_number = cleanOptional(payload.dairy_member_number);
    }
    if (payload.notes !== undefined) {
      payload.notes = cleanOptional(payload.notes);
    }
    if (payload.slip_image_url !== undefined) {
      payload.slip_image_url = cleanOptional(payload.slip_image_url);
    }
    ["fat_percentage", "snf_percentage", "clr_degree"].forEach((field) => {
      if (payload[field] !== undefined) {
        payload[field] = optionalNumber(payload[field]);
      }
    });
    payload.updated_at = new Date().toISOString();

    const supabase = getSupabaseServerClient();
    const oldSlip = await fetchSlip(supabase, farmId, params.id);

    if (!oldSlip) {
      return NextResponse.json({ error: "दूध नोंद सापडली नाही." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("dairy_slips")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "या तारीख आणि सत्राची दुसरी दूध नोंद आधीच आहे." },
        { status: 409 }
      );
    }

    if (error || !data) {
      return NextResponse.json({ error: "दूध नोंद सापडली नाही." }, { status: 404 });
    }

    await recomputeMilkRecordFromDairySlips(supabase, farmId, oldSlip.slip_date);
    await refreshSummaryForDate(supabase, farmId, oldSlip.slip_date);
    await recomputeMilkRecordFromDairySlips(supabase, farmId, data.slip_date);
    const summary = await refreshSummaryForDate(supabase, farmId, data.slip_date);

    return NextResponse.json({ data: { success: true, slip: data, summary } });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("dairy_slips")
      .delete()
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "दूध नोंद सापडली नाही." }, { status: 404 });
    }

    await recomputeMilkRecordFromDairySlips(supabase, farmId, data.slip_date);
    const summary = await refreshSummaryForDate(supabase, farmId, data.slip_date);

    return NextResponse.json({ data: { success: true, slip: data, summary } });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
