import { NextResponse } from "next/server";
import {
  farmErrorResponse,
  normalizeFarm,
  verifyFarmAccess,
  verifyFarmOwner
} from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const farmFields = [
  "farm_name",
  "owner_name",
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

function validatePayload(payload) {
  if (payload.farm_name !== undefined && String(payload.farm_name).trim().length < 2) {
    return "डेअरीचे नाव किमान २ अक्षरे असावे.";
  }

  if (payload.owner_name !== undefined && String(payload.owner_name).trim().length < 2) {
    return "मालकाचे नाव किमान २ अक्षरे असावे.";
  }

  if (payload.total_cows !== undefined && Number(payload.total_cows) < 0) {
    return "गायींची संख्या शून्य किंवा त्यापेक्षा जास्त असावी.";
  }

  if (payload.milk_rate_default !== undefined && Number(payload.milk_rate_default) <= 0) {
    return "दुधाचा दर शून्यापेक्षा जास्त असावा.";
  }

  if (payload.low_milk_alert_litres !== undefined && Number(payload.low_milk_alert_litres) < 0) {
    return "कमी दूध सूचना शून्य किंवा त्यापेक्षा जास्त असावी.";
  }

  return "";
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
    const body = await readJsonBody(request);
    delete body.owner_mobile;
    delete body.ownerMobile;
    delete body.owner_email;
    delete body.ownerEmail;

    const payload = {
      ...pickFields(body),
      updated_at: new Date().toISOString()
    };

    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

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
