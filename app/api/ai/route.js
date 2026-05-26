import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const aiFields = [
  "cow_id",
  "ai_date",
  "bull_code",
  "bull_breed",
  "doctor_name",
  "cost",
  "pregnancy_check_date",
  "pregnancy_result",
  "notes"
];

const defaultBullBreed = "जर्सी";

function pickFields(body) {
  return aiFields.reduce((payload, field) => {
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
    const cowId = searchParams.get("cow_id");
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("ai_records")
      .select("*, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .order("ai_date", { ascending: false })
      .order("created_at", { ascending: false });

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

    if (!body.cow_id || !body.ai_date) {
      return NextResponse.json({ error: "गाय आणि रेतन तारीख आवश्यक आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const payload = {
      ...pickFields(body),
      bull_breed:
        body.bull_breed && String(body.bull_breed).trim()
          ? String(body.bull_breed).trim()
          : defaultBullBreed,
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_records")
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
