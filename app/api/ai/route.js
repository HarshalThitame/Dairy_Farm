import { NextResponse } from "next/server";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { addDaysToISODate } from "@/lib/reminderUtils";
import {
  closeAiPregnancyLifecycleReminders,
  ensureMissedPregnancyReminder,
  ensureRepeatBreedingReminder
} from "@/lib/reproductiveReminderServer";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const aiFields = [
  "cow_id",
  "ai_date",
  "bull_code",
  "bull_breed",
  "doctor_name",
  "cost",
  "pregnancy_check_date",
  "pregnancy_result",
  "notes"
];

const defaultBullBreed = "जर्सी";
const allowedPregnancyResults = new Set(["positive", "negative", "pending"]);

function pickFields(body) {
  return aiFields.reduce((payload, field) => {
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

async function ensureDryOffReminder(supabase, farmId, aiRecord) {
  const reminderType = "दूध बंद";
  const reminderDate = addDaysToISODate(aiRecord.ai_date, 210);

  if (!reminderDate || aiRecord.pregnancy_result === "negative") {
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("reminders")
    .select()
    .eq("farm_id", farmId)
    .eq("related_record_id", aiRecord.id)
    .eq("type", reminderType)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data: cow, error: cowError } = await supabase
    .from("cows")
    .select("name")
    .eq("id", aiRecord.cow_id)
    .eq("farm_id", farmId)
    .single();

  if (cowError) {
    throw cowError;
  }

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      farm_id: farmId,
      cow_id: aiRecord.cow_id,
      reminder_date: reminderDate,
      type: reminderType,
      message: `${cow?.name || "गाय"} चे दूध काढणे बंद करण्याची वेळ जवळ आली आहे`,
      related_record_id: aiRecord.id,
      is_done: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const cowId = searchParams.get("cow_id");
    const summaryOnly = searchParams.get("summary") === "true";
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("ai_records")
      .select(summaryOnly ? "id, cow_id, ai_date, pregnancy_check_date, pregnancy_result" : "*, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .order("ai_date", { ascending: false })
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

    if (!body.cow_id || !body.ai_date) {
      return NextResponse.json({ error: "गाय आणि रेतन तारीख आवश्यक आहे." }, { status: 400 });
    }
    if (!isUuid(body.cow_id)) {
      return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    if (!isValidISODate(body.ai_date)) {
      return NextResponse.json({ error: "रेतन तारीख चुकीची आहे." }, { status: 400 });
    }
    if (body.pregnancy_check_date && !isValidISODate(body.pregnancy_check_date)) {
      return NextResponse.json({ error: "गर्भधारणा तपासणी तारीख चुकीची आहे." }, { status: 400 });
    }
    if (body.pregnancy_check_date && body.pregnancy_check_date < body.ai_date) {
      return NextResponse.json(
        { error: "गर्भधारणा तपासणी तारीख रेतन तारखेपेक्षा आधी नसावी." },
        { status: 400 }
      );
    }

    if (
      body.pregnancy_result !== undefined &&
      body.pregnancy_result !== "" &&
      !allowedPregnancyResults.has(body.pregnancy_result)
    ) {
      return NextResponse.json({ error: "गर्भधारणा निकाल चुकीचा आहे." }, { status: 400 });
    }

    if (
      body.cost !== undefined &&
      body.cost !== "" &&
      body.cost !== null &&
      (!Number.isFinite(Number(body.cost)) || Number(body.cost) < 0)
    ) {
      return NextResponse.json({ error: "रेतन खर्च शून्य किंवा त्यापेक्षा जास्त असावा." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const payload = {
      ...pickFields(body),
      bull_breed:
        body.bull_breed && String(body.bull_breed).trim()
          ? String(body.bull_breed).trim()
          : defaultBullBreed,
      cost: body.cost === "" || body.cost === null || body.cost === undefined ? null : Number(body.cost),
      pregnancy_result: body.pregnancy_result || "pending",
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_records")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (Number(data.cost || 0) > 0) {
      await refreshSummaryForDate(supabase, farmId, data.ai_date);
    }

    if (data.pregnancy_result === "negative") {
      await closeAiPregnancyLifecycleReminders(supabase, farmId, data.id);
      await ensureRepeatBreedingReminder(
        supabase,
        farmId,
        data,
        data.pregnancy_check_date || addDaysToISODate(data.ai_date, 61)
      );
    } else {
      await ensureDryOffReminder(supabase, farmId, data);
      await ensureMissedPregnancyReminder(supabase, farmId, data);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
