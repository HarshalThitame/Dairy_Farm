import { NextResponse } from "next/server";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { ensureReminderForRecord } from "@/lib/reproductiveReminderServer";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const allowedHealthTypes = new Set(["लसीकरण", "आजारपण", "जंतनाशक", "तपासणी", "उपचार"]);

const healthFields = [
  "cow_id",
  "date",
  "type",
  "description",
  "doctor_name",
  "cost",
  "next_due_date",
  "vaccine_name",
  "notes"
];

function pickFields(body) {
  return healthFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function normalizeDigits(value) {
  const digitMap = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9"
  };

  return String(value ?? "").replace(/[०-९]/g, (digit) => digitMap[digit] || digit);
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getTodayISODate() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;
  const day = parts.find((part) => part.type === "day").value;

  return `${year}-${month}-${day}`;
}

function parseOptionalAmount(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(normalizeDigits(value).replace(/[₹,\s]/g, ""));
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeHealthPayload(body) {
  const payload = pickFields(body);

  if (payload.cost !== undefined) {
    payload.cost = parseOptionalAmount(payload.cost);
  }

  ["description", "doctor_name", "vaccine_name", "notes"].forEach((field) => {
    if (payload[field] !== undefined) {
      const text = String(payload[field] || "").trim();
      payload[field] = text || null;
    }
  });

  return payload;
}

function validateHealth(body) {
  if (!body.cow_id || !body.date || !body.type) {
    return "गाय, तारीख आणि प्रकार आवश्यक आहे.";
  }

  if (!isValidISODate(body.date)) {
    return "तारीख चुकीची आहे.";
  }

  if (body.date > getTodayISODate()) {
    return "भविष्यातील तारीख वापरता येणार नाही.";
  }

  if (!allowedHealthTypes.has(body.type)) {
    return "आरोग्य नोंदीचा प्रकार चुकीचा आहे.";
  }

  const cost = parseOptionalAmount(body.cost);

  if (cost === undefined || (cost !== null && cost < 0)) {
    return "खर्च शून्य किंवा त्यापेक्षा जास्त असावा.";
  }

  if (cost !== null && cost > 1000000) {
    return "खर्च असामान्य आहे. कृपया तपासा.";
  }

  if (body.next_due_date) {
    if (!isValidISODate(body.next_due_date)) {
      return "पुढील तारीख चुकीची आहे.";
    }

    if (body.next_due_date < body.date) {
      return "पुढील तारीख नोंदीच्या तारखेपूर्वी नसावी.";
    }
  }

  if (["लसीकरण", "जंतनाशक"].includes(body.type)) {
    const vaccineName = String(body.vaccine_name || "").trim();

    if (!vaccineName) {
      return body.type === "जंतनाशक" ? "जंतनाशकाचे नाव आवश्यक आहे." : "लसीचे नाव आवश्यक आहे.";
    }
  }

  return "";
}

async function getCowName(supabase, farmId, cowId) {
  const { data, error } = await supabase
    .from("cows")
    .select("name")
    .eq("id", cowId)
    .eq("farm_id", farmId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.name || "गाय";
}

function buildReminderType(type) {
  if (type === "जंतनाशक") {
    return "जंतनाशक";
  }

  if (type === "लसीकरण") {
    return "लसीकरण";
  }

  return "तपासणी";
}

function buildReminderMessage(record, cowName) {
  if (record.type === "जंतनाशक") {
    return `${cowName} ला ${record.vaccine_name || "जंतनाशक"} देण्याची वेळ झाली`;
  }

  if (record.type === "लसीकरण") {
    return `${cowName} ला ${record.vaccine_name || "लस"} देण्याची वेळ झाली`;
  }

  return `${cowName} ची पुढील तपासणी करा`;
}

async function ensureHealthFollowupReminder(supabase, farmId, record) {
  if (!record?.id || !record.next_due_date) {
    return null;
  }

  const cowName = await getCowName(supabase, farmId, record.cow_id);
  return ensureReminderForRecord(supabase, farmId, {
    cowId: record.cow_id,
    relatedRecordId: record.id,
    reminderDate: record.next_due_date,
    type: buildReminderType(record.type),
    message: buildReminderMessage(record, cowName)
  });
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const cowId = searchParams.get("cow_id");
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("health_records")
      .select("*, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (cowId) {
      if (!isUuid(cowId)) {
        return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
      }
      await verifyFarmAccess(request, cowId);
      query = query.eq("cow_id", cowId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    const validationError = validateHealth(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    if (!isUuid(body.cow_id)) {
      return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const payload = {
      ...normalizeHealthPayload(body),
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("health_records")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (Number(data.cost || 0) > 0) {
      await refreshSummaryForDate(supabase, farmId, data.date);
    }

    const followupReminder = await ensureHealthFollowupReminder(supabase, farmId, data);

    return NextResponse.json({ data, followupReminder }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
