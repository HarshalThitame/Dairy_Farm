import { NextResponse } from "next/server";
import { createCalvesForCalving } from "@/lib/calfServer";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { addDaysToISODate } from "@/lib/reminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const motherStatusAfterCalving = "व्याललेली";

const calvingFields = [
  "cow_id",
  "ai_record_id",
  "expected_date",
  "actual_date",
  "calf_count",
  "calf_gender",
  "calf_name",
  "calf_weight",
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

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const calfCount = Math.max(1, Math.min(2, Number(body.calf_count || 1)));
    const payload = {
      ...pickFields(body),
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

    const reminder = await ensureDryOffReminder(supabase, farmId, data, cow?.name);

    return NextResponse.json({ data: { ...data, calves, cow, reminder } }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
