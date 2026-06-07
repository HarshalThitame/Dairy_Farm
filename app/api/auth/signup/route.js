import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  normalizeFarm,
  normalizeUser,
  signFarmToken
} from "@/lib/farmGuard";
import { setFarmAuthCookie } from "@/lib/authCookies";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";
import { DEFAULT_APPEARANCE, getRequestIp, normalizeAppearancePreferences, parseDevice } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const weakPins = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "4321"
]);

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeMobile(mobile) {
  return String(mobile || "").replace(/\D/g, "");
}

function normalizeTotalCows(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function normalizeLanguage(value) {
  return value === "en" ? "en" : "mr";
}

function deviceColumns(device) {
  return {
    device_name: device.deviceName,
    browser: device.browser,
    os: device.os,
    device_brand: device.deviceBrand,
    device_model: device.deviceModel,
    device_type: device.deviceType,
    platform_version: device.platformVersion,
    browser_version: device.browserVersion,
    client_hints: device.clientHints || {},
    user_agent: device.userAgent || ""
  };
}

async function insertSessionWithFallback(supabase, payload) {
  const { data, error } = await supabase
    .from("user_sessions")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (!error) return data;

  const missingDeviceColumn = error.code === "42703"
    || /device_brand|device_model|device_type|platform_version|browser_version|client_hints/i.test(error.message || "");

  if (!missingDeviceColumn) {
    return null;
  }

  const {
    device_brand,
    device_model,
    device_type,
    platform_version,
    browser_version,
    client_hints,
    ...legacyPayload
  } = payload;
  const { data: fallbackData } = await supabase
    .from("user_sessions")
    .insert(legacyPayload)
    .select("id")
    .maybeSingle();
  return fallbackData || null;
}

function validateSignup(body) {
  const mobile = normalizeMobile(body.mobile);
  const pin = String(body.pin || "").trim();
  const farmName = cleanText(body.farmName);
  const ownerName = cleanText(body.ownerName);
  const districtName = cleanText(body.districtName);

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return { error: "१० अंकी योग्य मोबाइल नंबर लिहा." };
  }

  if (!/^\d{4}$/.test(pin)) {
    return { error: "४ अंकी PIN लिहा." };
  }

  if (weakPins.has(pin)) {
    return { error: "हा PIN खूप सोपा आहे. कठीण PIN निवडा." };
  }

  if (farmName.length < 2) {
    return { error: "डेअरीचे नाव लिहा." };
  }

  if (ownerName.length < 2) {
    return { error: "मालकाचे नाव लिहा." };
  }

  if (districtName.length < 2) {
    return { error: "जिल्ह्याचे नाव निवडा." };
  }

  return {
    mobile,
    pin,
    farmName,
    ownerName,
    villageName: cleanText(body.villageName),
    talukaName: cleanText(body.talukaName),
    districtName,
    totalCows: normalizeTotalCows(body.totalCows),
    language: normalizeLanguage(body.language)
  };
}

async function createProfileWithLanguage(supabase, payload) {
  const { error } = await supabase
    .from("user_profiles")
    .insert(payload);

  if (!error) return;

  const missingLanguageColumn = error.code === "42703" || /language/i.test(error.message || "");
  if (!missingLanguageColumn) {
    throw error;
  }

  const { language, ...legacyPayload } = payload;
  const { error: fallbackError } = await supabase
    .from("user_profiles")
    .insert(legacyPayload);

  if (fallbackError) {
    throw fallbackError;
  }
}

export async function POST(request) {
  let createdFarmId = null;

  try {
    const body = await readJsonBody(request);
    const deviceInfo = body.deviceInfo && typeof body.deviceInfo === "object" ? body.deviceInfo : {};
    const validated = validateSignup(body);

    if (validated.error) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const [{ data: existingFarm }, { data: existingUser }] = await Promise.all([
      supabase
        .from("farms")
        .select("id")
        .eq("owner_mobile", validated.mobile)
        .maybeSingle(),
      supabase
        .from("users")
        .select("id")
        .eq("mobile", validated.mobile)
        .maybeSingle()
    ]);

    if (existingFarm || existingUser) {
      return NextResponse.json(
        { error: "मोबाइल नंबर आधीच नोंदणीकृत आहे." },
        { status: 409 }
      );
    }

    const pinHash = await bcrypt.hash(validated.pin, Number(process.env.BCRYPT_ROUNDS || 10));
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .insert({
        farm_name: validated.farmName,
        owner_name: validated.ownerName,
        owner_mobile: validated.mobile,
        village_name: validated.villageName || null,
        taluka_name: validated.talukaName || null,
        district_name: validated.districtName,
        state_name: "महाराष्ट्र",
        total_cows: validated.totalCows,
        subscription_status: "trial",
        trial_ends_at: trialEndDate.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (farmError) {
      throw farmError;
    }

    createdFarmId = farm.id;

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        farm_id: farm.id,
        mobile: validated.mobile,
        pin_hash: pinHash,
        name: validated.ownerName,
        role: "admin",
        is_farm_owner: true,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      await supabase.from("farms").delete().eq("id", createdFarmId);
      throw userError;
    }

    const preferences = normalizeAppearancePreferences({
      ...DEFAULT_APPEARANCE,
      language: validated.language
    });

    try {
      await Promise.all([
        supabase
          .from("appearance_preferences")
          .upsert({
            user_id: user.id,
            farm_id: farm.id,
            ...preferences,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id" }),
        createProfileWithLanguage(supabase, {
          user_id: user.id,
          farm_id: farm.id,
          village_name: validated.villageName || null,
          taluka_name: validated.talukaName || null,
          district_name: validated.districtName,
          state_name: "महाराष्ट्र",
          language: validated.language
        })
      ]);
    } catch (preferenceError) {
      await supabase.from("users").delete().eq("id", user.id);
      await supabase.from("farms").delete().eq("id", createdFarmId);
      throw preferenceError;
    }

    let session = null;
    try {
      const device = parseDevice(request.headers.get("user-agent") || "", deviceInfo, request.headers);
      session = await insertSessionWithFallback(supabase, {
        user_id: user.id,
        farm_id: farm.id,
        ...deviceColumns({ ...device, userAgent: request.headers.get("user-agent") || "" }),
        ip_address: getRequestIp(request)
      });
    } catch {
      session = null;
    }

    const token = signFarmToken(user, farm, session?.id || null);

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: normalizeUser(user),
        farm: normalizeFarm(farm),
        preferences,
        message: "नोंदणी यशस्वी! स्वागत आहे."
      },
      { status: 201 }
    );

    return setFarmAuthCookie(response, token);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "नोंदणी करताना त्रुटी झाली." },
      { status: 500 }
    );
  }
}
