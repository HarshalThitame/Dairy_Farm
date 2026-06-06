import { NextResponse } from "next/server";
import { enrichActiveCalfMilkReminders } from "@/lib/calfReminderDisplay";
import { removePostCalvingDryOffReminders } from "@/lib/cowDryOffReminderDisplay";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  addDaysToISODate,
  getReminderDisplayMessage,
  getTodayISODate,
  MISSED_PREGNANCY_REMINDER_TYPE,
  NEXT_BREEDING_READY_REMINDER_TYPE,
  PREGNANCY_CHECK_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE
} from "@/lib/reminderUtils";
import {
  closeAiPregnancyLifecycleReminders,
  ensureRepeatBreedingReminder
} from "@/lib/reproductiveReminderServer";
import { removeResolvedReproductiveReminders } from "@/lib/reproductiveReminderDisplay";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const allowedReminderTypes = new Set([
  PREGNANCY_CHECK_REMINDER_TYPE,
  MISSED_PREGNANCY_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE,
  NEXT_BREEDING_READY_REMINDER_TYPE,
  "व्यायण",
  "लसीकरण",
  "जंतनाशक",
  "तपासणी",
  "दूध बंद",
  "शिंग काढणे",
  "वासरी दूध कमी",
  "वासरी दूध बंद"
]);
const allowedPatchActions = new Set([
  "done",
  "skip",
  "snooze",
  "pregnancy-positive",
  "pregnancy-negative"
]);

function monthRange(month, year) {
  const currentDate = new Date();
  const selectedMonth = Number(month || currentDate.getMonth() + 1);
  const selectedYear = Number(year || currentDate.getFullYear());

  if (
    !Number.isInteger(selectedMonth) ||
    selectedMonth < 1 ||
    selectedMonth > 12 ||
    !Number.isInteger(selectedYear)
  ) {
    return null;
  }

  const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
  const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;

  return {
    start: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`
  };
}

async function applyCommonFilters(request, query, searchParams) {
  const cowId = searchParams.get("cow_id");
  const type = searchParams.get("type");

  if (cowId) {
    if (!isUuid(cowId)) {
      const error = new Error("गाय क्रमांक चुकीचा आहे.");
      error.status = 400;
      throw error;
    }
    await verifyFarmAccess(request, cowId);
    query = query.eq("cow_id", cowId);
  }

  if (type && type !== "सर्व") {
    query = query.eq("type", type);
  }

  return query;
}

function sortReminderRows(reminders) {
  return [...(reminders || [])].sort((first, second) => {
    const dateCompare = String(first.reminder_date || "").localeCompare(String(second.reminder_date || ""));

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(first.created_at || first.id || "").localeCompare(String(second.created_at || second.id || ""));
  });
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function enrichReminderRows(supabase, farmId, reminders, today = getTodayISODate()) {
  const reproductiveRows = await removeResolvedReproductiveReminders(supabase, farmId, reminders || [], { today });
  const validRows = await removePostCalvingDryOffReminders(supabase, farmId, reproductiveRows);
  const enrichedRows = await enrichActiveCalfMilkReminders(supabase, farmId, validRows, { today });

  return (enrichedRows || []).map((reminder) => ({
    ...reminder,
    message: getReminderDisplayMessage(reminder, today)
  }));
}

async function updatePregnancyResultFromReminder(supabase, farmId, reminderId, pregnancyResult) {
  const { data: reminder, error: reminderError } = await supabase
    .from("reminders")
    .select("id, cow_id, related_record_id, reminder_date, type")
    .eq("id", reminderId)
    .eq("farm_id", farmId)
    .single();

  if (reminderError || !reminder) {
    return { data: null, error: new Error("आठवण सापडली नाही.") };
  }

  if (
    ![PREGNANCY_CHECK_REMINDER_TYPE, MISSED_PREGNANCY_REMINDER_TYPE].includes(reminder.type) ||
    !reminder.related_record_id
  ) {
    return { data: null, error: new Error("ही गर्भधारणा तपासणीची आठवण नाही.") };
  }

  const { data: aiRecord, error: aiError } = await supabase
    .from("ai_records")
    .update({ pregnancy_result: pregnancyResult })
    .eq("id", reminder.related_record_id)
    .eq("farm_id", farmId)
    .select()
    .single();

  if (aiError || !aiRecord) {
    return { data: null, error: aiError || new Error("रेतन नोंद सापडली नाही.") };
  }

  const reminderUpdate = await updateReminder(
    supabase,
    farmId,
    reminder.id,
    { is_done: true, skipped: false, done_at: new Date().toISOString() },
    { is_done: true }
  );

  if (reminderUpdate.error) {
    return { data: null, error: reminderUpdate.error };
  }

  if (pregnancyResult === "negative") {
    await closeAiPregnancyLifecycleReminders(supabase, farmId, aiRecord.id);
    const cowUpdate = await supabase
      .from("cows")
      .update({ status: "रिकामी" })
      .eq("id", aiRecord.cow_id)
      .eq("farm_id", farmId);
    if (cowUpdate.error) {
      return { data: null, error: cowUpdate.error };
    }
    await ensureRepeatBreedingReminder(supabase, farmId, aiRecord, getTodayISODate());
  } else {
    await closeAiPregnancyLifecycleReminders(
      supabase,
      farmId,
      aiRecord.id,
      [PREGNANCY_CHECK_REMINDER_TYPE, MISSED_PREGNANCY_REMINDER_TYPE]
    );
    const cowUpdate = await supabase
      .from("cows")
      .update({ status: "गाभण" })
      .eq("id", aiRecord.cow_id)
      .eq("farm_id", farmId);
    if (cowUpdate.error) {
      return { data: null, error: cowUpdate.error };
    }
  }

  const { data, error } = await supabase
    .from("reminders")
    .select("*, cows(id, name, breed, date_of_birth, status, color)")
    .eq("id", reminder.id)
    .eq("farm_id", farmId)
    .single();

  return { data, error };
}

async function runDoneQuery(request, supabase, farmId, searchParams, useDoneAt = true) {
  const range = monthRange(searchParams.get("month"), searchParams.get("year"));

  if (!range) {
    return { data: null, error: new Error("महिना किंवा वर्ष चुकीचे आहे.") };
  }

  let primaryQuery = supabase
    .from("reminders")
    .select("*, cows(id, name, breed, date_of_birth, status, color)")
    .eq("farm_id", farmId)
    .eq("is_done", true)
    .order(useDoneAt ? "done_at" : "reminder_date", { ascending: false })
    .order("created_at", { ascending: false });

  primaryQuery = useDoneAt
    ? primaryQuery.gte("done_at", range.start).lt("done_at", range.end)
    : primaryQuery.gte("reminder_date", range.start).lt("reminder_date", range.end);

  primaryQuery = await applyCommonFilters(request, primaryQuery, searchParams);
  const primaryResult = await primaryQuery;

  if (primaryResult.error || !useDoneAt) {
    return primaryResult;
  }

  let legacyQuery = supabase
    .from("reminders")
    .select("*, cows(id, name, breed, date_of_birth, status, color)")
    .eq("farm_id", farmId)
    .eq("is_done", true)
    .is("done_at", null)
    .gte("reminder_date", range.start)
    .lt("reminder_date", range.end)
    .order("reminder_date", { ascending: false })
    .order("created_at", { ascending: false });

  legacyQuery = await applyCommonFilters(request, legacyQuery, searchParams);
  const legacyResult = await legacyQuery;

  if (legacyResult.error) {
    return primaryResult;
  }

  const byId = new Map();
  [...(primaryResult.data || []), ...(legacyResult.data || [])].forEach((row) => {
    byId.set(row.id, row);
  });

  return {
    data: [...byId.values()].sort((first, second) =>
      String(second.done_at || second.reminder_date || "").localeCompare(
        String(first.done_at || first.reminder_date || "")
      )
    ),
    error: null
  };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const filter = searchParams.get("filter");
    const includeDone = searchParams.get("include_done") === "true";
    const today = getTodayISODate();
    const tomorrow = addDaysToISODate(today, 1);
    const weekEnd = addDaysToISODate(today, 7);
    const supabase = getSupabaseServerClient();

    if (id) {
      if (!isUuid(id)) {
        return NextResponse.json({ error: "आठवण क्रमांक चुकीचा आहे." }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("reminders")
        .select("*, cows(id, name, breed, date_of_birth, status, color)")
        .eq("id", id)
        .eq("farm_id", farmId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "आठवण सापडली नाही." }, { status: 404 });
      }

      const enriched = await enrichReminderRows(supabase, farmId, [data], today);

      // Detail pages must still open for a real reminder even when list-level
      // lifecycle filtering would hide it. Actions such as snooze/pregnancy
      // result operate on the raw reminder id.
      return NextResponse.json({
        data: enriched[0] || {
          ...data,
          message: getReminderDisplayMessage(data, today)
        }
      });
    }

    if (filter === "done") {
      let result = await runDoneQuery(request, supabase, farmId, searchParams, true);

      if (result.error && String(result.error.message || "").includes("done_at")) {
        result = await runDoneQuery(request, supabase, farmId, searchParams, false);
      }

      if (result.error) {
        throw result.error;
      }

      const enrichedDoneRows = await enrichReminderRows(supabase, farmId, result.data || [], today);
      return NextResponse.json({ data: enrichedDoneRows });
    }

    let query = supabase
      .from("reminders")
      .select("*, cows(id, name, breed, date_of_birth, status, color)")
      .eq("farm_id", farmId)
      .order("reminder_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (filter === "today") {
      query = query.eq("reminder_date", today).eq("is_done", false);
    } else if (filter === "tomorrow") {
      query = query.eq("reminder_date", tomorrow).eq("is_done", false);
    } else if (filter === "week") {
      query = query.gte("reminder_date", today).lte("reminder_date", weekEnd).eq("is_done", false);
    } else if (filter === "overdue") {
      query = query.lt("reminder_date", today).eq("is_done", false);
    } else {
      const from = searchParams.get("from") || today;
      const to = searchParams.get("to") || weekEnd;
      query = query.gte("reminder_date", from).lte("reminder_date", to);

      if (!includeDone) {
        query = query.eq("is_done", false);
      }
    }

    query = await applyCommonFilters(request, query, searchParams);
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const enrichedRows = await enrichReminderRows(supabase, farmId, data || [], today);
    return NextResponse.json({ data: sortReminderRows(enrichedRows) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

async function updateReminder(supabase, farmId, id, payload, fallbackPayload) {
  const runUpdate = (updatePayload) =>
    supabase
      .from("reminders")
      .update(updatePayload)
      .eq("id", id)
      .eq("farm_id", farmId)
      .select()
      .maybeSingle();

  let result = await runUpdate(payload);

  if (result.error && fallbackPayload) {
    result = await runUpdate(fallbackPayload);
  }

  if (!result.error && !result.data) {
    return { data: null, error: new Error("आठवण सापडली नाही.") };
  }

  return result;
}

export async function PATCH(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const body = await readJsonBody(request);

    if (!isUuid(body.id)) {
      return NextResponse.json({ error: "आठवणीचा आयडी आवश्यक आहे." }, { status: 400 });
    }

    const action = body.action || "done";
    if (!allowedPatchActions.has(action)) {
      return NextResponse.json({ error: "आठवणीची action चुकीची आहे." }, { status: 400 });
    }
    const supabase = getSupabaseServerClient();

    if (action === "snooze") {
      const days = Number(body.days || 1);
      if (!Number.isInteger(days) || days < 1 || days > 30) {
        return NextResponse.json({ error: "आठवण १ ते ३० दिवसांपर्यंतच पुढे ढकलता येते." }, { status: 400 });
      }
      const { data: reminder, error: reminderError } = await supabase
        .from("reminders")
        .select("id, reminder_date, is_done")
        .eq("id", body.id)
        .eq("farm_id", farmId)
        .maybeSingle();

      if (reminderError) {
        throw reminderError;
      }

      if (!reminder) {
        return NextResponse.json({ error: "आठवण सापडली नाही." }, { status: 404 });
      }

      const { data, error } = await supabase
        .from("reminders")
        .update({
          reminder_date: addDaysToISODate(reminder.reminder_date, days),
          is_done: false,
          skipped: false,
          done_at: null
        })
        .eq("id", body.id)
        .eq("farm_id", farmId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ data });
    }

    if (action === "skip") {
      const { data, error } = await updateReminder(
        supabase,
        farmId,
        body.id,
        { is_done: true, skipped: true, done_at: new Date().toISOString() },
        { is_done: true }
      );

      if (error) {
        throw error;
      }

      return NextResponse.json({ data });
    }

    if (action === "pregnancy-positive" || action === "pregnancy-negative") {
      const result = await updatePregnancyResultFromReminder(
        supabase,
        farmId,
        body.id,
        action === "pregnancy-positive" ? "positive" : "negative"
      );

      if (result.error) {
        throw result.error;
      }

      return NextResponse.json({ data: result.data });
    }

    const { data, error } = await updateReminder(
      supabase,
      farmId,
      body.id,
      { is_done: true, skipped: false, done_at: new Date().toISOString() },
      { is_done: true }
    );

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

    if (!body.reminder_date || !body.type || !body.message) {
      return NextResponse.json({ error: "तारीख, प्रकार आणि संदेश आवश्यक आहे." }, { status: 400 });
    }

    if (!isValidISODate(body.reminder_date)) {
      return NextResponse.json({ error: "आठवणीची तारीख चुकीची आहे." }, { status: 400 });
    }

    if (!allowedReminderTypes.has(body.type)) {
      return NextResponse.json({ error: "आठवणीचा प्रकार चुकीचा आहे." }, { status: 400 });
    }
    if (body.cow_id && !isUuid(body.cow_id)) {
      return NextResponse.json({ error: "गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    if (body.related_record_id && !isUuid(body.related_record_id)) {
      return NextResponse.json({ error: "संबंधित नोंद क्रमांक चुकीचा आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id || null);
    const supabase = getSupabaseServerClient();

    if (body.related_record_id) {
      const { data: existing, error: existingError } = await supabase
        .from("reminders")
        .select()
        .eq("farm_id", farmId)
        .eq("related_record_id", body.related_record_id)
        .eq("type", body.type)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing) {
        return NextResponse.json({ data: existing }, { status: 200 });
      }
    }

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        farm_id: farmId,
        cow_id: body.cow_id || null,
        reminder_date: body.reminder_date,
        type: body.type,
        message: body.message,
        is_done: false,
        related_record_id: body.related_record_id || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
