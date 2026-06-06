import { NextResponse } from "next/server";
import { enrichActiveCalfMilkReminders } from "@/lib/calfReminderDisplay";
import { removePostCalvingDryOffReminders } from "@/lib/cowDryOffReminderDisplay";
import { farmErrorResponse, verifyFarmAccess, verifyFarmOwner } from "@/lib/farmGuard";
import { removeResolvedReproductiveReminders } from "@/lib/reproductiveReminderDisplay";
import { getReminderDisplayMessage, getTodayISODate } from "@/lib/reminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const cowFields = [
  "name",
  "breed",
  "date_of_birth",
  "tag_number",
  "color",
  "status",
  "purchased_on",
  "notes",
  "photo_url",
  "photo_storage_path",
  "is_active"
];

const allowedCowStatuses = new Set(["गाभण", "रिकामी", "व्याललेली", "उपचार सुरू", "वाळलेली"]);

function pickFields(body) {
  return cowFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function firstError(results) {
  return results.find((result) => result.error)?.error;
}

async function updateFarmCowCount(supabase, farmId) {
  const { count } = await supabase
    .from("cows")
    .select("id", { count: "exact", head: true })
    .eq("farm_id", farmId)
    .eq("is_active", true);

  await supabase
    .from("farms")
    .update({ total_cows: count || 0, updated_at: new Date().toISOString() })
    .eq("id", farmId);
}

export async function GET(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data: cow, error: cowError } = await supabase
      .from("cows")
      .select("*")
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .single();

    if (cowError || !cow) {
      return NextResponse.json({ error: "गाय सापडली नाही." }, { status: 404 });
    }

    const [
      aiRecords,
      calvingRecords,
      healthRecords,
      financeRecords,
      calves,
      reminders
    ] = await Promise.all([
      supabase
        .from("ai_records")
        .select("*")
        .eq("farm_id", farmId)
        .eq("cow_id", params.id)
        .order("ai_date", { ascending: false }),
      supabase
        .from("calving_records")
        .select("*")
        .eq("farm_id", farmId)
        .eq("cow_id", params.id)
        .order("expected_date", { ascending: false }),
      supabase
        .from("health_records")
        .select("*")
        .eq("farm_id", farmId)
        .eq("cow_id", params.id)
        .order("date", { ascending: false }),
      supabase
        .from("finance_records")
        .select("*")
        .eq("farm_id", farmId)
        .eq("cow_id", params.id)
        .order("date", { ascending: false }),
      supabase
        .from("calves")
        .select("*")
        .eq("farm_id", farmId)
        .eq("mother_cow_id", params.id)
        .order("birth_date", { ascending: false }),
      supabase
        .from("reminders")
        .select("*")
        .eq("farm_id", farmId)
        .eq("cow_id", params.id)
        .order("reminder_date", { ascending: true })
    ]);

    const relatedError = firstError([
      aiRecords,
      calvingRecords,
      healthRecords,
      financeRecords,
      calves,
      reminders
    ]);

    if (relatedError) {
      throw relatedError;
    }

    const today = getTodayISODate();
    const reproductiveReminders = await removeResolvedReproductiveReminders(
      supabase,
      farmId,
      reminders.data || [],
      { today }
    );
    const dryOffFilteredReminders = await removePostCalvingDryOffReminders(
      supabase,
      farmId,
      reproductiveReminders
    );
    const visibleReminders = await enrichActiveCalfMilkReminders(
      supabase,
      farmId,
      dryOffFilteredReminders,
      { today }
    );
    const displayReminders = visibleReminders.map((reminder) => ({
      ...reminder,
      message: getReminderDisplayMessage(reminder, today)
    }));

    return NextResponse.json({
      data: {
        cow,
        records: {
          ai_records: aiRecords.data || [],
          calving_records: calvingRecords.data || [],
          milk_records: [],
          health_records: healthRecords.data || [],
          finance_records: financeRecords.data || [],
          calves: calves.data || [],
          reminders: displayReminders
        }
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    const { farmId } = await verifyFarmOwner(request);
    const body = await readJsonBody(request);
    const payload = pickFields(body);

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    if (payload.status !== undefined) {
      const requestedStatus = String(payload.status || "").trim();

      if (requestedStatus && !allowedCowStatuses.has(requestedStatus)) {
        return NextResponse.json({ error: "गायीची स्थिती चुकीची आहे." }, { status: 400 });
      }

      if (requestedStatus) {
        payload.status = requestedStatus;
      } else {
        delete payload.status;
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("cows")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "गाय सापडली नाही." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    const { farmId } = await verifyFarmOwner(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("cows")
      .update({ is_active: false })
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "गाय सापडली नाही." }, { status: 404 });
    }

    await updateFarmCowCount(supabase, farmId);
    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
