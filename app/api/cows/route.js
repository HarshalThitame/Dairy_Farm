import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess, verifyFarmOwner } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";

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

const defaultBreed = "जर्सी";
const allowedCowStatuses = new Set(["गाभण", "रिकामी", "व्याललेली", "उपचार सुरू", "वाळलेली"]);

function pickFields(body) {
  return cowFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("cows")
      .select("*")
      .eq("farm_id", farmId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    const cowIds = (data || []).map((cow) => cow.id);
    let cowsWithLatestMilk = (data || []).map((cow) => ({
      ...cow,
      latest_milk_record: null,
      latest_ai_record: null,
      latest_calving_record: null,
      next_reminder: null
    }));

    if (cowIds.length > 0) {
      const [milkResult, aiResult, calvingResult, reminderResult] = await Promise.all([
        supabase
          .from("milk_records")
          .select("id, cow_id, date, morning_litres, evening_litres, total_litres")
          .eq("farm_id", farmId)
          .in("cow_id", cowIds)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("ai_records")
          .select("id, cow_id, ai_date, pregnancy_check_date, pregnancy_result")
          .eq("farm_id", farmId)
          .in("cow_id", cowIds)
          .order("ai_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("calving_records")
          .select("id, cow_id, expected_date, actual_date, calf_count, calf_gender")
          .eq("farm_id", farmId)
          .in("cow_id", cowIds)
          .order("actual_date", { ascending: false, nullsFirst: false })
          .order("expected_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("reminders")
          .select("id, cow_id, reminder_date, type, message")
          .eq("farm_id", farmId)
          .in("cow_id", cowIds)
          .eq("is_done", false)
          .order("reminder_date", { ascending: true })
          .order("created_at", { ascending: true })
      ]);

      if (milkResult.error) throw milkResult.error;
      if (aiResult.error) throw aiResult.error;
      if (calvingResult.error) throw calvingResult.error;
      if (reminderResult.error) throw reminderResult.error;

      const latestMilkByCow = new Map();
      (milkResult.data || []).forEach((record) => {
        if (!latestMilkByCow.has(record.cow_id)) {
          latestMilkByCow.set(record.cow_id, record);
        }
      });

      const latestAiByCow = new Map();
      (aiResult.data || []).forEach((record) => {
        if (!latestAiByCow.has(record.cow_id)) {
          latestAiByCow.set(record.cow_id, record);
        }
      });

      const latestCalvingByCow = new Map();
      (calvingResult.data || []).forEach((record) => {
        if (!latestCalvingByCow.has(record.cow_id)) {
          latestCalvingByCow.set(record.cow_id, record);
        }
      });

      const nextReminderByCow = new Map();
      (reminderResult.data || []).forEach((record) => {
        if (!nextReminderByCow.has(record.cow_id)) {
          nextReminderByCow.set(record.cow_id, record);
        }
      });

      cowsWithLatestMilk = (data || []).map((cow) => ({
        ...cow,
        latest_milk_record: latestMilkByCow.get(cow.id) || null,
        latest_ai_record: latestAiByCow.get(cow.id) || null,
        latest_calving_record: latestCalvingByCow.get(cow.id) || null,
        next_reminder: nextReminderByCow.get(cow.id) || null
      }));
    }

    return NextResponse.json({ data: cowsWithLatestMilk });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmOwner(request);
    const body = await readJsonBody(request);

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "गायीचे नाव आवश्यक आहे." }, { status: 400 });
    }

    const requestedStatus = String(body.status || "").trim();

    if (requestedStatus && !allowedCowStatuses.has(requestedStatus)) {
      return NextResponse.json({ error: "गायीची स्थिती चुकीची आहे." }, { status: 400 });
    }

    const payload = {
      ...pickFields(body),
      breed: body.breed && String(body.breed).trim() ? String(body.breed).trim() : defaultBreed,
      farm_id: farmId
    };

    if (payload.status !== undefined) {
      if (requestedStatus) {
        payload.status = requestedStatus;
      } else {
        delete payload.status;
      }
    }
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("cows")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const { count } = await supabase
      .from("cows")
      .select("id", { count: "exact", head: true })
      .eq("farm_id", farmId)
      .eq("is_active", true);
    await supabase
      .from("farms")
      .update({ total_cows: count || 0, updated_at: new Date().toISOString() })
      .eq("id", farmId);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
