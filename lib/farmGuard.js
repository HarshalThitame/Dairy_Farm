import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

const JWT_SECRET = process.env.JWT_SECRET || "goshala-local-dev-secret-change-before-production";

function isSuperAdminEmail(email) {
  const configured = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && configured.includes(String(email).toLowerCase()));
}

export function signFarmToken(user, farm, sessionId = null) {
  return jwt.sign(
    {
      userId: user.id,
      farmId: user.farm_id,
      sessionId,
      mobile: user.mobile || null,
      email: user.email || null,
      name: user.name,
      role: user.role,
      isFarmOwner: Boolean(user.is_farm_owner),
      isSuperAdmin: isSuperAdminEmail(user.email),
      farmName: farm?.farm_name || ""
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function getAuthToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return request.cookies?.get("goshala_token")?.value || "";
}

export function authError(message = "लॉगिन आवश्यक आहे.", status = 401) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function farmErrorResponse(error) {
  return NextResponse.json(
    { error: error.message || "माहिती मिळवताना चूक झाली." },
    { status: error.status || 500 }
  );
}

export async function verifyFarmAccess(request, requiredCowId = null) {
  const token = getAuthToken(request);

  if (!token) {
    throw authError("लॉगिन आवश्यक आहे.", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    throw authError("लॉगिन कालबाह्य झाले आहे.", 401);
  }

  if (!decoded.farmId || !decoded.userId) {
    throw authError("डेअरी जोडलेली नाही.", 403);
  }

  const supabase = getSupabaseServerClient();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, farm_id, mobile, email, name, role, is_active, is_farm_owner, profile_photo_url, profile_photo_storage_path")
    .eq("id", decoded.userId)
    .eq("farm_id", decoded.farmId)
    .single();

  if (userError || !user) {
    throw authError("खाते सापडले नाही.", 401);
  }

  if (!user.is_active) {
    throw authError("हे खाते बंद केले आहे. मालकाशी संपर्क करा.", 403);
  }

  const { data: farm, error: farmError } = await supabase
    .from("farms")
    .select("id, is_active, suspended_reason")
    .eq("id", decoded.farmId)
    .single();

  if (farmError || !farm) {
    throw authError("डेअरी सापडली नाही.", 403);
  }

  if (!farm.is_active) {
    throw authError(
      `तुमचे खाते स्थगित केले आहे. ${farm.suspended_reason || "कृपया सहाय्याशी संपर्क करा."}`,
      403
    );
  }

  if (decoded.sessionId) {
    const { data: session, error: sessionError } = await supabase
      .from("user_sessions")
      .select("id, is_active, logout_at")
      .eq("id", decoded.sessionId)
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (sessionError) {
      throw sessionError;
    }

    if (session && (!session.is_active || session.logout_at)) {
      throw authError("हे session बंद झाले आहे. पुन्हा लॉगिन करा.", 401);
    }

    if (session) {
      await supabase
        .from("user_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", session.id);
    }
  }

  if (requiredCowId) {
    const { data: cow, error: cowError } = await supabase
      .from("cows")
      .select("id")
      .eq("id", requiredCowId)
      .eq("farm_id", decoded.farmId)
      .single();

    if (cowError || !cow) {
      throw authError("ही गाय तुमच्या डेअरीतील नाही.", 403);
    }
  }

  return {
    userId: user.id,
    farmId: user.farm_id,
    user: {
      id: user.id,
      farmId: user.farm_id,
      mobile: user.mobile,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePhotoUrl: user.profile_photo_url,
      profilePhotoStoragePath: user.profile_photo_storage_path,
      isFarmOwner: Boolean(user.is_farm_owner),
      isSuperAdmin: isSuperAdminEmail(user.email)
    },
    decoded
  };
}

export async function verifyFarmOwner(request) {
  const auth = await verifyFarmAccess(request);

  if (!auth.user.isFarmOwner && auth.user.role !== "admin") {
    throw authError("हे पान फक्त मालकासाठी आहे.", 403);
  }

  return auth;
}

export function normalizeFarm(farm) {
  if (!farm) {
    return null;
  }

  return {
    id: farm.id,
    farmName: farm.farm_name,
    ownerName: farm.owner_name,
    ownerMobile: farm.owner_mobile,
    ownerEmail: farm.owner_email,
    mobileVerified: Boolean(farm.mobile_verified),
    villageName: farm.village_name,
    talukaName: farm.taluka_name,
    districtName: farm.district_name,
    stateName: farm.state_name,
    farmAddress: farm.farm_address,
    dairyName: farm.dairy_name,
    dairyMemberNumber: farm.dairy_member_number,
    vetName: farm.vet_name,
    vetMobile: farm.vet_mobile,
    subscriptionStatus: farm.subscription_status,
    trialEndsAt: farm.trial_ends_at,
    subscriptionStartedAt: farm.subscription_started_at,
    subscriptionEndsAt: farm.subscription_ends_at,
    totalCows: farm.total_cows,
    milkRateDefault: farm.milk_rate_default,
    morningSessionTime: farm.morning_session_time,
    eveningSessionTime: farm.evening_session_time,
    showMarathiNumbers: farm.show_marathi_numbers,
    lowMilkAlertLitres: farm.low_milk_alert_litres,
    isActive: farm.is_active,
    adminNotes: farm.admin_notes,
    suspendedReason: farm.suspended_reason,
    suspendedAt: farm.suspended_at,
    lastActivityAt: farm.last_activity_at,
    createdAt: farm.created_at,
    updatedAt: farm.updated_at
  };
}

export function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    mobile: user.mobile,
    email: user.email,
    name: user.name,
    role: user.role,
    farmId: user.farm_id,
    photoUrl: user.profile_photo_url,
    profilePhotoUrl: user.profile_photo_url,
    profilePhotoStoragePath: user.profile_photo_storage_path,
    isFarmOwner: Boolean(user.is_farm_owner),
    isSuperAdmin: isSuperAdminEmail(user.email)
  };
}
