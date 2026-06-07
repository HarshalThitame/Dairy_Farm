import { NextResponse } from "next/server";
import {
  farmErrorResponse,
  normalizeFarm,
  verifyFarmAccess,
  verifyFarmOwner
} from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";
import {
  getAhilyanagarTalukas,
  getAhilyanagarVillages,
  isAhilyanagarDistrict
} from "@/lib/maharashtraLocations";

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
      payload[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
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

  if (payload.district_name !== undefined && isAhilyanagarDistrict(payload.district_name)) {
    const talukas = getAhilyanagarTalukas();
    if (!payload.taluka_name || !talukas.includes(payload.taluka_name)) {
      return "अहिल्यानगर जिल्ह्यासाठी योग्य तालुका dropdown मधून निवडा.";
    }

    const villages = getAhilyanagarVillages(payload.taluka_name);
    if (!payload.village_name || !villages.includes(payload.village_name)) {
      return "निवडलेल्या तालुक्यासाठी योग्य गाव dropdown मधून निवडा.";
    }
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
    const auth = await verifyFarmOwner(request);
    const body = await readJsonBody(request);
    delete body.owner_mobile;
    delete body.ownerMobile;
    delete body.owner_email;
    delete body.ownerEmail;

    const payload = {
      ...pickFields(body),
      updated_at: new Date().toISOString()
    };

    if (Object.keys(payload).length <= 1) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    let validationPayload = payload;
    const touchesLocation = ["village_name", "taluka_name", "district_name"].some((field) => payload[field] !== undefined);

    if (touchesLocation) {
      const { data: currentFarm, error: currentFarmError } = await supabase
        .from("farms")
        .select("village_name, taluka_name, district_name")
        .eq("id", auth.farmId)
        .single();

      if (currentFarmError) {
        throw currentFarmError;
      }

      validationPayload = {
        ...payload,
        village_name: payload.village_name ?? currentFarm?.village_name ?? "",
        taluka_name: payload.taluka_name ?? currentFarm?.taluka_name ?? "",
        district_name: payload.district_name ?? currentFarm?.district_name ?? ""
      };
    }

    const validationError = validatePayload(validationPayload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("farms")
      .update(payload)
      .eq("id", auth.farmId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const profileSyncPayload = {};
    for (const field of ["village_name", "taluka_name", "district_name", "state_name"]) {
      if (payload[field] !== undefined) {
        profileSyncPayload[field] = payload[field];
      }
    }

    if (Object.keys(profileSyncPayload).length > 0) {
      try {
        await supabase
          .from("user_profiles")
          .upsert({
            user_id: auth.userId,
            farm_id: auth.farmId,
            ...profileSyncPayload,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" });
      } catch {
        // Farm update is authoritative. Profile sync is best-effort for older deployments.
      }
    }

    return NextResponse.json({ data: normalizeFarm(data) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
