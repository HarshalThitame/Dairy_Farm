import { NextResponse } from "next/server";
import { createCalvesForCalving } from "@/lib/calfServer";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { addDaysToISODate } from "@/lib/reminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const motherStatusAfterCalving = "व्याललेली";
const calvingReminderType = "व्यायण";
const allowedCalfGenders = new Set(["नर", "मादी"]);

const calvingFields = [
  "cow_id",
  "ai_record_id",
  "expected_date",
  "actual_date",
  "calf_count",
  "calf_gender",
  "calf_name",
  "calving_notes"
];

function pickFields(body) {
  return calvingFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

async function ensureDryOffReminder(supabase, farmId, calvingRecord, cowName) {
  const reminderDate = addDaysToISODate(calvingRecord.actual_date, 60);
  const reminderType = "दूध बंद";

  const { data: existing, error: existingError } = await supabase
    .from("reminders")
    .select()
    .eq("farm_id", farmId)
    .eq("related_record_id", calvingRecord.id)
    .eq("type", reminderType)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      farm_id: farmId,
      cow_id: calvingRecord.cow_id,
      reminder_date: reminderDate,
      type: reminderType,
      message: `${cowName || "गाय"} चे दूध बंद करण्याची वेळ आली आहे`,
      related_record_id: calvingRecord.id,
      is_done: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function markCalvingRemindersDone(supabase, farmId, reminderId, cowId) {
  const donePayload = {
    is_done: true,
    skipped: false,
    done_at: new Date().toISOString()
  };
  const fallbackPayload = {
    is_done: true,
    skipped: false
  };

  const runUpdate = (payload) => {
    let query = supabase
      .from("reminders")
      .update(payload)
      .eq("farm_id", farmId)
      .eq("cow_id", cowId)
      .eq("type", calvingReminderType)
      .eq("is_done", false);

    if (reminderId) {
      query = query.eq("id", reminderId);
    }

    return query.select();
  };

  let result = await runUpdate(donePayload);

  if (result.error && String(result.error.message || "").includes("done_at")) {
    result = await runUpdate(fallbackPayload);
  }

  if (result.error) {
    return [];
  }

  return result.data || [];
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const cowId = searchParams.get("cow_id");
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("calving_records")
      .select("*, cows(id, name, breed, status)")
      .eq("farm_id", farmId)
      .order("actual_date", { ascending: false })
      .order("expected_date", { ascending: false });

    if (cowId) {
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
    const body = await request.json();

    if (!body.cow_id || !body.actual_date || !body.calf_gender) {
      return NextResponse.json({ error: "गाय, तारीख आणि वासराचे लिंग आवश्यक आहे." }, { status: 400 });
    }

    if (!allowedCalfGenders.has(body.calf_gender)) {
      return NextResponse.json({ error: "वासराचे लिंग नर किंवा मादी असावे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const calfCount = Math.max(1, Math.min(2, Number(body.calf_count || 1)));
    const payload = {
      ...pickFields(body),
      calf_gender: body.calf_gender,
      calf_count: calfCount,
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("calving_records")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const calves = await createCalvesForCalving(supabase, farmId, data, {
      ...body,
      calf_count: calfCount
    });

    const { data: cow, error: cowError } = await supabase
      .from("cows")
      .update({ status: motherStatusAfterCalving })
      .eq("id", body.cow_id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (cowError) {
      throw cowError;
    }

    const [reminder, completedReminders] = await Promise.all([
      ensureDryOffReminder(supabase, farmId, data, cow?.name),
      markCalvingRemindersDone(supabase, farmId, body.reminder_id, body.cow_id)
    ]);

    return NextResponse.json({
      data: {
        ...data,
        calves,
        cow,
        reminder,
        completedReminder: completedReminders[0] || null,
        completedReminders
      }
    }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
