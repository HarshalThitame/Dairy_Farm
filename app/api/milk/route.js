import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getTodayISODate } from "@/lib/reminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const milkFields = [
  "cow_id",
  "date",
  "morning_litres",
  "evening_litres",
  "fat_percentage",
  "notes"
];

function pickFields(body) {
  return milkFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");
    const days = searchParams.get("days");
    const cowId = searchParams.get("cow_id");

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("milk_records")
      .select("*, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (date) {
      query = query.eq("date", date === "today" ? getTodayISODate() : date);
    }
    if (from) {
      query = query.gte("date", from);
    }
    if (to) {
      query = query.lte("date", to);
    }
    if (days && !from && !date) {
      const today = getTodayISODate();
      const startDate = new Date(`${today}T00:00:00`);
      startDate.setDate(startDate.getDate() - Number(days || 7));
      query = query.gte("date", startDate.toISOString().slice(0, 10)).lte("date", today);
    }
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

    if (!body.cow_id || !body.date) {
      return NextResponse.json({ error: "गाय आणि तारीख आवश्यक आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const payload = {
      ...pickFields(body),
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("milk_records")
      .insert(payload)
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
