import { NextResponse } from "next/server";
import {
  farmErrorResponse,
  normalizeFarm,
  verifyFarmAccess,
  verifyFarmOwner
} from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const farmFields = [
  "farm_name",
  "owner_name",
  "owner_mobile",
  "owner_email",
  "village_name",
  "taluka_name",
  "district_name",
  "state_name",
  "farm_address",
  "dairy_name",
  "dairy_member_number",
  "vet_name",
  "vet_mobile",
  "total_cows",
  "milk_rate_default",
  "morning_session_time",
  "evening_session_time",
  "show_marathi_numbers",
  "low_milk_alert_litres"
];

function pickFields(body) {
  return farmFields.reduce((payload, field) => {
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
      .from("farms")
      .select("*")
      .eq("id", farmId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: normalizeFarm(data) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PUT(request) {
  try {
    const { farmId } = await verifyFarmOwner(request);
    const body = await request.json();
    const payload = {
      ...pickFields(body),
      updated_at: new Date().toISOString()
    };

    if (Object.keys(payload).length <= 1) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("farms")
      .update(payload)
      .eq("id", farmId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: normalizeFarm(data) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
