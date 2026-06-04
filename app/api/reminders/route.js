import { NextResponse } from "next/server";
import { enrichActiveCalfMilkReminders } from "@/lib/calfReminderDisplay";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { addDaysToISODate, getTodayISODate } from "@/lib/reminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const allowedReminderTypes = new Set([
  "माज तपासणी",
  "गर्भधारणा तपासणी",
  "व्यायण",
  "लसीकरण",
  "जंतनाशक",
  "तपासणी",
  "दूध बंद",
  "वासरी दूध कमी",
  "वासरी दूध बंद"
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

async function enrichReminderRows(supabase, farmId, reminders, today = getTodayISODate()) {
  return enrichActiveCalfMilkReminders(supabase, farmId, reminders || [], { today });
}

async function runDoneQuery(request, supabase, farmId, searchParams, useDoneAt = true) {
  const range = monthRange(searchParams.get("month"), searchParams.get("year"));

  if (!range) {
    return { data: null, error: new Error("महिना किंवा वर्ष चुकीचे आहे.") };
  }

  let query = supabase
    .from("reminders")
    .select("*, cows(id, name, breed, date_of_birth, status, color)")
    .eq("farm_id", farmId)
    .eq("is_done", true)
    .order(useDoneAt ? "done_at" : "reminder_date", { ascending: false })
    .order("created_at", { ascending: false });

  query = useDoneAt
    ? query.gte("done_at", range.start).lt("done_at", range.end)
    : query.gte("reminder_date", range.start).lt("reminder_date", range.end);

  query = await applyCommonFilters(request, query, searchParams);
  const { data, error } = await query;
  return { data, error };
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

      if (!enriched.length) {
        return NextResponse.json({ error: "आठवण सापडली नाही." }, { status: 404 });
      }

      return NextResponse.json({ data: enriched[0] });
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
  let result = await supabase
    .from("reminders")
    .update(payload)
    .eq("id", id)
    .eq("farm_id", farmId)
    .select()
    .single();

  if (result.error && fallbackPayload) {
    result = await supabase
      .from("reminders")
      .update(fallbackPayload)
      .eq("id", id)
      .eq("farm_id", farmId)
      .select()
      .single();
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
    const supabase = getSupabaseServerClient();

    if (action === "snooze") {
      const days = Number(body.days || 1);
      const { data: reminder, error: reminderError } = await supabase
        .from("reminders")
        .select("id, reminder_date")
        .eq("id", body.id)
        .eq("farm_id", farmId)
        .single();

      if (reminderError || !reminder) {
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
