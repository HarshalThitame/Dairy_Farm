import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { pickMilkFields } from "@/lib/milkRecordFields";
import { getTodayISODate } from "@/lib/reminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const selectMilkRecord = "*, cows(id, name, breed)";

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
      .select(selectMilkRecord)
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
    } else {
      query = query.is("cow_id", null);
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

    if (!body.date) {
      return NextResponse.json({ error: "तारीख आवश्यक आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request);
    const payload = {
      ...pickMilkFields(body),
      cow_id: null,
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data: existingRecord, error: existingError } = await supabase
      .from("milk_records")
      .select("id")
      .eq("farm_id", farmId)
      .eq("date", payload.date)
      .is("cow_id", null)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const query = existingRecord?.id
      ? supabase
          .from("milk_records")
          .update(payload)
          .eq("id", existingRecord.id)
          .eq("farm_id", farmId)
      : supabase.from("milk_records").insert(payload);

    const { data, error } = await query
      .select(selectMilkRecord)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data }, { status: existingRecord?.id ? 200 : 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
