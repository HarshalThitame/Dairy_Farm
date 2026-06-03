import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  logAdminAction,
  maskMobile,
  superAdminErrorResponse,
  verifySuperAdmin
} from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isoDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

async function countRows(supabase, table, build = (query) => query) {
  const query = build(supabase.from(table).select("id", { count: "exact", head: true }));
  const { count, error } = await query;
  if (error) {
    throw error;
  }
  return count || 0;
}

async function getDashboardStats(supabase) {
  const today = new Date().toISOString().slice(0, 10);
  const last30 = isoDaysAgo(30);
  const next3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalFarms,
    activeSubscriptions,
    trialFarms,
    totalUsers,
    totalMilkRecords,
    newSignupsToday,
    allFarmsResult,
    farmsResult,
    recentResult,
    expiringResult,
    inactiveResult,
    suspendedResult
  ] = await Promise.all([
    countRows(supabase, "farms"),
    countRows(supabase, "farms", (query) => query.eq("is_active", true).eq("subscription_status", "active")),
    countRows(supabase, "farms", (query) => query.eq("is_active", true).eq("subscription_status", "trial")),
    countRows(supabase, "users"),
    countRows(supabase, "milk_records"),
    countRows(supabase, "farms", (query) => query.gte("created_at", `${today}T00:00:00.000Z`)),
    supabase.from("farms").select("id, total_cows, is_active, created_at"),
    supabase.from("farms").select("id, total_cows, created_at, is_active, subscription_status").gte("created_at", last30),
    supabase
      .from("farms")
      .select("id, farm_name, owner_name, owner_mobile, district_name, total_cows, subscription_status, trial_ends_at, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("farms")
      .select("id, farm_name, owner_name, trial_ends_at")
      .eq("subscription_status", "trial")
      .eq("is_active", true)
      .lte("trial_ends_at", next3)
      .order("trial_ends_at", { ascending: true })
      .limit(10),
    supabase
      .from("farms")
      .select("id, farm_name, owner_name, last_activity_at")
      .eq("is_active", true)
      .or(`last_activity_at.is.null,last_activity_at.lt.${isoDaysAgo(14)}`)
      .order("last_activity_at", { ascending: true })
      .limit(10),
    supabase
      .from("farms")
      .select("id, farm_name, owner_name, suspended_reason, suspended_at")
      .eq("is_active", false)
      .order("suspended_at", { ascending: false })
      .limit(10)
  ]);

  if (allFarmsResult.error) throw allFarmsResult.error;
  const allFarms = allFarmsResult.data || [];
  const farms = farmsResult.data || [];
  const totalCows = allFarms
    .filter((farm) => farm.is_active)
    .reduce((sum, farm) => sum + Number(farm.total_cows || 0), 0);
  const dailyMap = new Map();

  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    dailyMap.set(dateKey(date), { label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), signups: 0, active: 0 });
  }

  farms.forEach((farm) => {
    const key = String(farm.created_at || "").slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.get(key).signups += 1;
    }
  });

  const activity = Array.from(dailyMap.entries()).map(([key, item]) => {
    const dayEnd = new Date(`${key}T23:59:59.999Z`).getTime();
    return {
      ...item,
      active: allFarms.filter((farm) => (
        farm.is_active &&
        farm.created_at &&
        new Date(farm.created_at).getTime() <= dayEnd
      )).length
    };
  });

  return {
    stats: {
      totalFarms,
      activeSubscriptions,
      trialFarms,
      totalCows,
      totalUsers,
      totalMilkRecords,
      newSignupsToday
    },
    recentSignups: (recentResult.data || []).map((farm) => ({
      ...farm,
      owner_mobile_masked: maskMobile(farm.owner_mobile)
    })),
    activity,
    alerts: {
      expiringTrials: expiringResult.data || [],
      inactiveFarms: inactiveResult.data || [],
      suspendedFarms: suspendedResult.data || []
    }
  };
}

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const data = await getDashboardStats(supabase);
    return NextResponse.json(data);
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.rpc("refresh_platform_stats");
    if (error) {
      throw error;
    }
    await logAdminAction(request, adminId, "refreshed_platform_stats", null, {});
    const data = await getDashboardStats(supabase);
    return NextResponse.json(data);
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
