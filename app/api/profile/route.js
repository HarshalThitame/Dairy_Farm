import { NextResponse } from "next/server";
import {
  farmErrorResponse,
  normalizeFarm,
  normalizeUser,
  verifyFarmAccess
} from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  getOrCreateAppearancePreferences,
  getOrCreateNotificationPreferences,
  logUserSettingsAction,
  normalizeAppearancePreferences,
  normalizeNotificationPreferences
} from "@/lib/userSettings";
import { readJsonBody } from "@/lib/apiSafety";
import {
  getAhilyanagarTalukas,
  getAhilyanagarVillages,
  isAhilyanagarDistrict
} from "@/lib/maharashtraLocations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FARM_PROFILE_FIELDS = [
  "id",
  "farm_name",
  "owner_name",
  "owner_mobile",
  "owner_email",
  "mobile_verified",
  "village_name",
  "taluka_name",
  "district_name",
  "state_name",
  "farm_address",
  "dairy_name",
  "dairy_member_number",
  "vet_name",
  "vet_mobile",
  "subscription_status",
  "trial_ends_at",
  "subscription_started_at",
  "subscription_ends_at",
  "total_cows",
  "milk_rate_default",
  "morning_session_time",
  "evening_session_time",
  "show_marathi_numbers",
  "low_milk_alert_litres",
  "is_active",
  "admin_notes",
  "suspended_reason",
  "suspended_at",
  "last_activity_at",
  "created_at",
  "updated_at"
].join(", ");

const USER_PROFILE_FIELDS = [
  "id",
  "user_id",
  "farm_id",
  "village_name",
  "taluka_name",
  "district_name",
  "state_name",
  "profile_photo_url",
  "profile_photo_storage_path",
  "created_at",
  "updated_at"
].join(", ");

function cleanText(value, max = 120) {
  return String(value || "").trim().slice(0, max);
}

async function countRows(supabase, table, farmId, userId = null) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (farmId) query = query.eq("farm_id", farmId);
  if (userId) query = query.eq("user_id", userId);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

async function getProfileStats(supabase, farmId, userId) {
  const [milkResult, settlementResult, slipsCount, aiCount, cowCount, milkRecordsCount] = await Promise.all([
    supabase.from("milk_records").select("total_litres, total_amount").eq("farm_id", farmId),
    supabase.from("dairy_settlements").select("total_liters, total_milk_income").eq("farm_id", farmId),
    countRows(supabase, "slip_uploads", farmId),
    countRows(supabase, "ai_assistant_logs", farmId, userId),
    countRows(supabase, "cows", farmId),
    countRows(supabase, "milk_records", farmId)
  ]);

  const milkRows = milkResult.error ? [] : milkResult.data || [];
  const settlementRows = settlementResult.error ? [] : settlementResult.data || [];
  const totalMilkFromSettlements = settlementRows.reduce((sum, row) => sum + Number(row.total_liters || 0), 0);
  const totalMilkFromRecords = milkRows.reduce((sum, row) => sum + Number(row.total_litres || 0), 0);
  const totalIncomeFromSettlements = settlementRows.reduce((sum, row) => sum + Number(row.total_milk_income || 0), 0);
  const totalIncomeFromRecords = milkRows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);

  const { data: user } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();
  const createdAt = user?.created_at ? new Date(user.created_at).getTime() : Date.now();
  const daysActive = Math.max(1, Math.ceil((Date.now() - createdAt) / (24 * 60 * 60 * 1000)));

  return {
    totalMilk: totalMilkFromSettlements || totalMilkFromRecords,
    totalIncome: totalIncomeFromSettlements || totalIncomeFromRecords,
    totalSlipsUploaded: slipsCount,
    aiQuestionsAsked: aiCount,
    daysActive,
    cowCount,
    milkRecordsCount
  };
}

async function getOrCreateProfile(supabase, userId, farmId, farm) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(USER_PROFILE_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (data) {
    return data;
  }

  const { data: created, error: createError } = await supabase
    .from("user_profiles")
    .insert({
      user_id: userId,
      farm_id: farmId,
      village_name: farm?.village_name || "",
      taluka_name: farm?.taluka_name || "",
      district_name: farm?.district_name || "",
      state_name: farm?.state_name || "महाराष्ट्र"
    })
    .select(USER_PROFILE_FIELDS)
    .single();

  if (createError) {
    throw createError;
  }
  return created;
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const [{ data: user, error: userError }, { data: farm, error: farmError }] = await Promise.all([
      supabase
        .from("users")
        .select("id, farm_id, mobile, email, name, role, is_active, is_farm_owner, created_at, last_login, profile_photo_url, profile_photo_storage_path")
        .eq("id", auth.userId)
        .single(),
      supabase.from("farms").select(FARM_PROFILE_FIELDS).eq("id", auth.farmId).single()
    ]);

    if (userError) throw userError;
    if (farmError) throw farmError;

    const [profile, stats, notificationPrefs, appearancePrefs] = await Promise.all([
      getOrCreateProfile(supabase, auth.userId, auth.farmId, farm),
      getProfileStats(supabase, auth.farmId, auth.userId),
      getOrCreateNotificationPreferences(supabase, auth.userId, auth.farmId),
      getOrCreateAppearancePreferences(supabase, auth.userId, auth.farmId)
    ]);

    return NextResponse.json({
      user: normalizeUser(user),
      rawUser: user,
      profile,
      farm: normalizeFarm(farm),
      stats,
      notificationPreferences: normalizeNotificationPreferences(notificationPrefs),
      appearancePreferences: normalizeAppearancePreferences(appearancePrefs)
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await readJsonBody(request);
    const supabase = getSupabaseServerClient();
    const canManageFarm = Boolean(auth.user?.isFarmOwner || auth.user?.role === "admin");

    const name = cleanText(body.name, 100);
    if (name.length < 2) {
      return NextResponse.json({ error: "नाव किमान २ अक्षरे असावे." }, { status: 400 });
    }

    const farmName = cleanText(body.farm_name || body.farmName, 140);
    if (canManageFarm && farmName.length < 2) {
      return NextResponse.json({ error: "डेअरीचे नाव किमान २ अक्षरे असावे." }, { status: 400 });
    }

    const profilePayload = {
      village_name: cleanText(body.village_name || body.villageName, 100),
      taluka_name: cleanText(body.taluka_name || body.talukaName, 100),
      district_name: cleanText(body.district_name || body.districtName, 100),
      state_name: cleanText(body.state_name || body.stateName || "महाराष्ट्र", 100),
      updated_at: new Date().toISOString()
    };

    if (isAhilyanagarDistrict(profilePayload.district_name)) {
      const talukas = getAhilyanagarTalukas();
      if (!profilePayload.taluka_name || !talukas.includes(profilePayload.taluka_name)) {
        return NextResponse.json(
          { error: "अहिल्यानगर जिल्ह्यासाठी योग्य तालुका dropdown मधून निवडा." },
          { status: 400 }
        );
      }

      const villages = getAhilyanagarVillages(profilePayload.taluka_name);
      if (!profilePayload.village_name || !villages.includes(profilePayload.village_name)) {
        return NextResponse.json(
          { error: "निवडलेल्या तालुक्यासाठी योग्य गाव dropdown मधून निवडा." },
          { status: 400 }
        );
      }
    }

    const { error: userError } = await supabase
      .from("users")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", auth.userId);
    if (userError) throw userError;

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: auth.userId,
        farm_id: auth.farmId,
        ...profilePayload
      }, { onConflict: "user_id" });
    if (profileError) throw profileError;

    if (canManageFarm) {
      const farmPayload = {
        farm_name: farmName,
        village_name: profilePayload.village_name,
        taluka_name: profilePayload.taluka_name,
        district_name: profilePayload.district_name,
        state_name: profilePayload.state_name,
        updated_at: new Date().toISOString()
      };

      if (auth.user?.isFarmOwner) {
        farmPayload.owner_name = name;
      }

      const { error: farmUpdateError } = await supabase
        .from("farms")
        .update(farmPayload)
        .eq("id", auth.farmId);
      if (farmUpdateError) throw farmUpdateError;
    }

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "profile_updated", {
      fields: canManageFarm ? ["name", "farm_name", ...Object.keys(profilePayload)] : ["name", ...Object.keys(profilePayload)]
    });

    return GET(request);
  } catch (error) {
    return farmErrorResponse(error);
  }
}
