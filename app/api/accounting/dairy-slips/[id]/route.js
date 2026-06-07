import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  DAIRY_SESSION_EVENING,
  DAIRY_SESSION_MORNING,
  refreshSummaryForDate
} from "@/lib/accountingUtils";
import { recomputeMilkRecordFromDairySlips } from "@/lib/milkDairySync";
import { getTodayISODate } from "@/lib/marathiUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const slipFields = [
  "slip_date",
  "slip_time",
  "session",
  "milk_type",
  "dairy_name",
  "dairy_member_number",
  "dairy_member_code",
  "liters",
  "fat_percentage",
  "snf_percentage",
  "clr_degree",
  "clr_score",
  "rate_per_liter",
  "notes",
  "slip_image_url"
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateSlipId(id) {
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

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(
    String(value)
      .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[,₹\s]/g, "")
      .replace(/[Oo]/g, "0")
  );
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeMilkType(value) {
  const text = String(value || "").trim().toLowerCase();

  if (text === "buffalo" || text.includes("म्हैस")) {
    return "buffalo";
  }

  return "cow";
}

function normalizeTime(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return text;
  const [, hour, minute, second = "00"] = match;
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
}

function pickSlipFields(body) {
  return slipFields.reduce((payload, field) => {
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

function validateSlip(payload) {
  if (payload.slip_date !== undefined) {
    if (!isValidISODate(payload.slip_date)) {
      return "तारीख चुकीची आहे.";
    }

    if (payload.slip_date > getTodayISODate()) {
      return "भविष्यातील तारीख वापरता येणार नाही.";
    }
  }

  if (payload.session && ![DAIRY_SESSION_MORNING, DAIRY_SESSION_EVENING].includes(payload.session)) {
    return "सत्र निवडा.";
  }

  if (payload.milk_type && !["cow", "buffalo"].includes(normalizeMilkType(payload.milk_type))) {
    return "दुधाचा प्रकार गाय किंवा म्हैस असावा.";
  }

  const liters = optionalNumber(payload.liters);
  if (payload.liters !== undefined && (liters === null || liters <= 0)) {
    return "दूधाचे लिटर शून्यापेक्षा जास्त असावे.";
  }

  if (payload.liters !== undefined && liters > 5000) {
    return "दूधाचे लिटर असामान्य आहे. कृपया तपासा.";
  }

  const rate = optionalNumber(payload.rate_per_liter);
  if (payload.rate_per_liter !== undefined && (rate === null || rate <= 0)) {
    return "दर शून्यापेक्षा जास्त असावा.";
  }

  if (payload.rate_per_liter !== undefined && rate > 200) {
    return "दुधाचा दर असामान्य आहे. कृपया तपासा.";
  }

  const fat = optionalNumber(payload.fat_percentage);
  if (payload.fat_percentage !== undefined && fat !== null && (fat < 0 || fat > 20)) {
    return "फॅट 0 ते 20 मध्ये असावे.";
  }

  const snf = optionalNumber(payload.snf_percentage);
  if (payload.snf_percentage !== undefined && snf !== null && (snf < 0 || snf > 20)) {
    return "SNF 0 ते 20 मध्ये असावे.";
  }

  const clr = optionalNumber(payload.clr_score ?? payload.clr_degree);
  if (clr !== null && (clr < 0 || clr > 100)) {
    return "CLR स्कोर 0 ते 100 मध्ये असावा.";
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
    if (!validateSlipId(params.id)) {
      return NextResponse.json({ error: "दूध नोंद ID चुकीचा आहे." }, { status: 400 });
    }

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
    if (!validateSlipId(params.id)) {
      return NextResponse.json({ error: "दूध नोंद ID चुकीचा आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request);
    const body = await readJsonBody(request);

    if (!body) {
      return NextResponse.json({ error: "माहिती योग्य format मध्ये पाठवा." }, { status: 400 });
    }

    const payload = pickSlipFields(body);
    const validationError = validateSlip(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    if (payload.liters !== undefined) {
      payload.liters = optionalNumber(payload.liters);
    }
    if (payload.rate_per_liter !== undefined) {
      payload.rate_per_liter = optionalNumber(payload.rate_per_liter);
    }
    if (payload.dairy_name !== undefined) {
      payload.dairy_name = cleanOptional(payload.dairy_name);
    }
    if (payload.dairy_member_number !== undefined) {
      payload.dairy_member_number = cleanOptional(payload.dairy_member_number);
    }
    if (payload.dairy_member_code !== undefined) {
      payload.dairy_member_code = cleanOptional(payload.dairy_member_code);
    }
    if (payload.slip_time !== undefined) {
      payload.slip_time = normalizeTime(payload.slip_time);
    }
    if (payload.milk_type !== undefined) {
      payload.milk_type = normalizeMilkType(payload.milk_type);
    }
    if (payload.notes !== undefined) {
      payload.notes = cleanOptional(payload.notes);
    }
    if (payload.slip_image_url !== undefined) {
      payload.slip_image_url = cleanOptional(payload.slip_image_url);
    }
    if (payload.clr_score !== undefined && payload.clr_degree === undefined) {
      payload.clr_degree = payload.clr_score;
    }
    if (payload.clr_degree !== undefined && payload.clr_score === undefined) {
      payload.clr_score = payload.clr_degree;
    }
    ["fat_percentage", "snf_percentage", "clr_degree", "clr_score"].forEach((field) => {
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
    if (!validateSlipId(params.id)) {
      return NextResponse.json({ error: "दूध नोंद ID चुकीचा आहे." }, { status: 400 });
    }

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
