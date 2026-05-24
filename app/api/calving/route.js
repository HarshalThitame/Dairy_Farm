import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const calvingFields = [
  "cow_id",
  "ai_record_id",
  "expected_date",
  "actual_date",
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
    const payload = {
      ...pickFields(body),
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

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
