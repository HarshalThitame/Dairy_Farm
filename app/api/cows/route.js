import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess, verifyFarmOwner } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

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
  "is_active"
];

const defaultBreed = "जर्सी";

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
      latest_milk_record: null
    }));

    if (cowIds.length > 0) {
      const { data: milkRecords, error: milkError } = await supabase
        .from("milk_records")
        .select("id, cow_id, date, morning_litres, evening_litres, total_litres")
        .eq("farm_id", farmId)
        .in("cow_id", cowIds)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (milkError) {
        throw milkError;
      }

      const latestMilkByCow = new Map();
      (milkRecords || []).forEach((record) => {
        if (!latestMilkByCow.has(record.cow_id)) {
          latestMilkByCow.set(record.cow_id, record);
        }
      });

      cowsWithLatestMilk = (data || []).map((cow) => ({
        ...cow,
        latest_milk_record: latestMilkByCow.get(cow.id) || null
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
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "गायीचे नाव आवश्यक आहे." }, { status: 400 });
    }

    const payload = {
      ...pickFields(body),
      breed: body.breed && String(body.breed).trim() ? String(body.breed).trim() : defaultBreed,
      farm_id: farmId
    };
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
