import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  normalizeFarm,
  normalizeUser,
  signFarmToken
} from "@/lib/farmGuard";
import { setFarmAuthCookie } from "@/lib/authCookies";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getRequestIp, getSafeAppearancePreferences, parseDevice } from "@/lib/userSettings";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCK_MINUTES = 15;
const MAX_WRONG_PIN_ATTEMPTS = 5;

function publicUserSelect() {
  return "id, farm_id, mobile, email, name, role, is_active, is_farm_owner, pin_hash, profile_photo_url, profile_photo_storage_path";
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

async function insertWithDeviceFallback(supabase, table, payload, select = "") {
  const query = supabase.from(table).insert(payload);
  const { data, error } = select ? await query.select(select).maybeSingle() : await query;

  if (!error) {
    return { data, error: null };
  }

  const missingDeviceColumn = error.code === "42703"
    || /device_brand|device_model|device_type|platform_version|browser_version|client_hints/i.test(error.message || "");

  if (!missingDeviceColumn) {
    return { data: null, error };
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
  const fallbackQuery = supabase.from(table).insert(legacyPayload);
  return select ? await fallbackQuery.select(select).maybeSingle() : await fallbackQuery;
}

async function logLoginAttempt(supabase, request, payload) {
  try {
    const device = parseDevice(request.headers.get("user-agent") || "", payload.deviceInfo || {}, request.headers);
    await insertWithDeviceFallback(supabase, "user_login_history", {
      user_id: payload.userId || null,
      farm_id: payload.farmId || null,
      mobile: payload.mobile || null,
      status: payload.status,
      failure_reason: payload.failureReason || null,
      ...deviceColumns({ ...device, userAgent: request.headers.get("user-agent") || "" }),
      ip_address: getRequestIp(request),
    });
  } catch {
    // Login should not fail because history logging failed.
  }
}

async function getRecentWrongPinAttempts(supabase, userId) {
  try {
    const since = new Date(Date.now() - LOCK_MINUTES * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("user_login_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "failed")
      .eq("failure_reason", "wrong_pin")
      .gte("created_at", since);

    if (error) {
      return 0;
    }

    return count || 0;
  } catch {
    return 0;
  }
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    const deviceInfo = body.deviceInfo && typeof body.deviceInfo === "object" ? body.deviceInfo : {};
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    const pin = String(body.pin || "").trim();
    const supabase = getSupabaseServerClient();

    if (!/^\d{10}$/.test(mobile) || !/^\d{4}$/.test(pin)) {
      await logLoginAttempt(supabase, request, {
        mobile,
        status: "failed",
        failureReason: "invalid_input",
        deviceInfo
      });
      return NextResponse.json({ error: "मोबाइल नंबर आणि PIN तपासा." }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(publicUserSelect())
      .eq("mobile", mobile)
      .single();

    if (error || !user) {
      await logLoginAttempt(supabase, request, {
        mobile,
        status: "failed",
        failureReason: "user_not_found",
        deviceInfo
      });
      return NextResponse.json({ error: "खाते सापडले नाही." }, { status: 401 });
    }

    if (!user.is_active) {
      await logLoginAttempt(supabase, request, {
        userId: user.id,
        farmId: user.farm_id,
        mobile,
        status: "failed",
        failureReason: "user_inactive",
        deviceInfo
      });
      return NextResponse.json(
        { error: "हे खाते बंद केले आहे. मालकाशी संपर्क करा." },
        { status: 403 }
      );
    }

    const recentWrongPinAttempts = await getRecentWrongPinAttempts(supabase, user.id);

    if (recentWrongPinAttempts >= MAX_WRONG_PIN_ATTEMPTS) {
      await logLoginAttempt(supabase, request, {
        userId: user.id,
        farmId: user.farm_id,
        mobile,
        status: "failed",
        failureReason: "pin_locked",
        deviceInfo
      });
      return NextResponse.json(
        { error: "५ चुकीचे PIN प्रयत्न झाले आहेत. १५ मिनिटांनी पुन्हा प्रयत्न करा." },
        { status: 429 }
      );
    }

    const valid = Boolean(user.pin_hash) && (await bcrypt.compare(pin, user.pin_hash));

    if (!valid) {
      await logLoginAttempt(supabase, request, {
        userId: user.id,
        farmId: user.farm_id,
        mobile,
        status: "failed",
        failureReason: "wrong_pin",
        deviceInfo
      });
      return NextResponse.json({ error: "चुकीचा PIN. पुन्हा प्रयत्न करा." }, { status: 401 });
    }

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("*")
      .eq("id", user.farm_id)
      .single();

    if (farmError || !farm) {
      await logLoginAttempt(supabase, request, {
        userId: user.id,
        farmId: user.farm_id,
        mobile,
        status: "failed",
        failureReason: "farm_not_found",
        deviceInfo
      });
      return NextResponse.json({ error: "डेअरी सापडली नाही." }, { status: 403 });
    }

    if (!farm.is_active) {
      await logLoginAttempt(supabase, request, {
        userId: user.id,
        farmId: user.farm_id,
        mobile,
        status: "failed",
        failureReason: "farm_suspended",
        deviceInfo
      });
      return NextResponse.json(
        {
          error: `तुमचे खाते स्थगित केले आहे. ${
            farm.suspended_reason || "कृपया सहाय्याशी संपर्क करा."
          }`
        },
        { status: 403 }
      );
    }

    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    const device = parseDevice(request.headers.get("user-agent") || "", deviceInfo, request.headers);
    let session = null;
    try {
      const { data: createdSession } = await insertWithDeviceFallback(
        supabase,
        "user_sessions",
        {
          user_id: user.id,
          farm_id: user.farm_id,
          ...deviceColumns({ ...device, userAgent: request.headers.get("user-agent") || "" }),
          ip_address: getRequestIp(request),
        },
        "id"
      );
      session = createdSession;
    } catch {
      session = null;
    }

    await logLoginAttempt(supabase, request, {
      userId: user.id,
      farmId: user.farm_id,
      mobile,
      status: "success",
      deviceInfo
    });

    const token = signFarmToken(user, farm, session?.id || null);
    const preferences = await getSafeAppearancePreferences(supabase, user.id, user.farm_id);

    const response = NextResponse.json({
      token,
      user: normalizeUser(user),
      farm: normalizeFarm(farm),
      preferences
    });

    return setFarmAuthCookie(response, token);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "लॉगिन करताना चूक झाली." },
      { status: 500 }
    );
  }
}
