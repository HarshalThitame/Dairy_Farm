import { NextResponse } from "next/server";
import { createCalvesForCalving } from "@/lib/calfServer";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  closeAiPregnancyLifecycleReminders,
  ensureNextBreedingReadinessReminder
} from "@/lib/reproductiveReminderServer";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

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

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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

async function closePregnancyLifecycleAfterCalving(supabase, farmId, calvingRecord) {
  if (calvingRecord.ai_record_id) {
    const { error: aiError } = await supabase
      .from("ai_records")
      .update({ pregnancy_result: "positive" })
      .eq("id", calvingRecord.ai_record_id)
      .eq("farm_id", farmId);

    if (aiError) {
      throw aiError;
    }

    return closeAiPregnancyLifecycleReminders(supabase, farmId, calvingRecord.ai_record_id);
  }

  const donePayload = {
    is_done: true,
    skipped: true,
    done_at: new Date().toISOString()
  };
  const fallbackPayload = {
    is_done: true,
    skipped: true
  };

  const runUpdate = (payload) =>
    supabase
      .from("reminders")
      .update(payload)
      .eq("farm_id", farmId)
      .eq("cow_id", calvingRecord.cow_id)
      .eq("type", "दूध बंद")
      .eq("is_done", false)
      .lte("reminder_date", calvingRecord.actual_date)
      .select();

  let result = await runUpdate(donePayload);

  if (result.error && String(result.error.message || "").includes("done_at")) {
    result = await runUpdate(fallbackPayload);
  }

  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const cowId = searchParams.get("cow_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("calving_records")
      .select("*, cows(id, name, breed, status)")
      .eq("farm_id", farmId)
      .order("actual_date", { ascending: false })
      .order("expected_date", { ascending: false });

    if (cowId) {
      if (!isUuid(cowId)) {
        return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
      }
      await verifyFarmAccess(request, cowId);
      query = query.eq("cow_id", cowId);
    }

    if (from) {
      if (!isValidISODate(from)) {
        return NextResponse.json({ error: "सुरुवात तारीख चुकीची आहे." }, { status: 400 });
      }
      query = query.gte("actual_date", from);
    }

    if (to) {
      if (!isValidISODate(to)) {
        return NextResponse.json({ error: "शेवट तारीख चुकीची आहे." }, { status: 400 });
      }
      query = query.lte("actual_date", to);
    }

    if (from && to && to < from) {
      return NextResponse.json({ error: "शेवट तारीख सुरुवात तारखेपेक्षा आधी नसावी." }, { status: 400 });
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

    if (!body.cow_id || !body.actual_date || !body.calf_gender) {
      return NextResponse.json({ error: "गाय, तारीख आणि वासराचे लिंग आवश्यक आहे." }, { status: 400 });
    }
    if (!isUuid(body.cow_id)) {
      return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    if (body.reminder_id && !isUuid(body.reminder_id)) {
      return NextResponse.json({ error: "आठवण क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    if (body.ai_record_id && !isUuid(body.ai_record_id)) {
      return NextResponse.json({ error: "रेतन नोंद क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    if (!isValidISODate(body.actual_date)) {
      return NextResponse.json({ error: "व्यायण तारीख चुकीची आहे." }, { status: 400 });
    }
    if (body.expected_date && !isValidISODate(body.expected_date)) {
      return NextResponse.json({ error: "अपेक्षित व्यायण तारीख चुकीची आहे." }, { status: 400 });
    }

    if (!allowedCalfGenders.has(body.calf_gender)) {
      return NextResponse.json({ error: "वासराचे लिंग नर किंवा मादी असावे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const requestedCalfCount = Number(body.calf_count || 1);
    if (!Number.isInteger(requestedCalfCount) || requestedCalfCount < 1 || requestedCalfCount > 2) {
      return NextResponse.json({ error: "वासरांची संख्या १ किंवा २ असावी." }, { status: 400 });
    }
    const calfCount = requestedCalfCount;
    const payload = {
      ...pickFields(body),
      calf_gender: body.calf_gender,
      calf_count: calfCount,
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();

    if (body.ai_record_id) {
      const { data: aiRecord, error: aiError } = await supabase
        .from("ai_records")
        .select("id, cow_id")
        .eq("id", body.ai_record_id)
        .eq("farm_id", farmId)
        .single();

      if (aiError || !aiRecord) {
        return NextResponse.json({ error: "रेतन नोंद सापडली नाही." }, { status: 404 });
      }

      if (aiRecord.cow_id !== body.cow_id) {
        return NextResponse.json({ error: "रेतन नोंद निवडलेल्या गायीशी जुळत नाही." }, { status: 400 });
      }
    }

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

    const completedReminders = await markCalvingRemindersDone(
      supabase,
      farmId,
      body.reminder_id,
      body.cow_id
    );
    const completedLifecycleReminders = await closePregnancyLifecycleAfterCalving(supabase, farmId, data);
    const followupReminder = await ensureNextBreedingReadinessReminder(supabase, farmId, data);

    return NextResponse.json({
      data: {
        ...data,
        calves,
        cow,
        completedReminder: completedReminders[0] || null,
        completedReminders,
        completedLifecycleReminders,
        followupReminder
      }
    }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
