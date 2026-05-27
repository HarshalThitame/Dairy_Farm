import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  DAIRY_SESSION_EVENING,
  DAIRY_SESSION_MORNING,
  refreshSummaryForDate,
  summarizeDairySlips
} from "@/lib/accountingUtils";
import { recomputeMilkRecordFromDairySlips } from "@/lib/milkDairySync";
import { getMonthInput, getMonthRange } from "@/lib/reportUtils";
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

function validateSlip(body) {
  const liters = Number(body.liters);
  const rate = Number(body.rate_per_liter);

  if (!body.slip_date) {
    return "तारीख आवश्यक आहे.";
  }

  if (![DAIRY_SESSION_MORNING, DAIRY_SESSION_EVENING].includes(body.session)) {
    return "सत्र निवडा.";
  }

  if (!Number.isFinite(liters) || liters <= 0) {
    return "दूधाचे लिटर शून्यापेक्षा जास्त असावे.";
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    return "दर शून्यापेक्षा जास्त असावा.";
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

function duplicateSlipResponse() {
  return NextResponse.json(
    { error: "या तारीख आणि सत्राची दूध नोंद आधीच आहे. कृपया संपादित करा." },
    { status: 409 }
  );
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
      .from("dairy_slips")
      .select("*")
      .eq("farm_id", farmId)
      .gte("slip_date", range.start)
      .lt("slip_date", range.end)
      .order("slip_date", { ascending: false })
      .order("session", { ascending: true });

    if (error) {
      throw error;
    }

    const summary = summarizeDairySlips(data || []);

    return NextResponse.json({
      data: {
        slips: data || [],
        dailyTotals: summary.dailyTotals,
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
    const validationError = validateSlip(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const farmInfo = await getFarmDairyInfo(supabase, farmId);
    const payload = {
      ...pickSlipFields(body),
      farm_id: farmId,
      dairy_name: cleanOptional(body.dairy_name) || farmInfo.dairy_name || null,
      dairy_member_number: cleanOptional(body.dairy_member_number) || farmInfo.dairy_member_number || null,
      liters: Number(body.liters),
      fat_percentage: optionalNumber(body.fat_percentage),
      snf_percentage: optionalNumber(body.snf_percentage),
      clr_degree: optionalNumber(body.clr_degree),
      rate_per_liter: Number(body.rate_per_liter),
      notes: cleanOptional(body.notes),
      slip_image_url: cleanOptional(body.slip_image_url)
    };

    const { data, error } = await supabase
      .from("dairy_slips")
      .insert(payload)
      .select()
      .single();

    if (error?.code === "23505") {
      return duplicateSlipResponse();
    }

    if (error) {
      throw error;
    }

    await recomputeMilkRecordFromDairySlips(supabase, farmId, data.slip_date);
    const summary = await refreshSummaryForDate(supabase, farmId, data.slip_date);

    return NextResponse.json({ data: { success: true, slip: data, summary } }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
