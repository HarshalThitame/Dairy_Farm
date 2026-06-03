import { NextResponse } from "next/server";
import { evaluateAchievements } from "@/lib/achievementEngine";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hasCronAccess(request) {
  const configured = process.env.CRON_SECRET || process.env.ACHIEVEMENT_CRON_SECRET;
  if (!configured) return false;
  const header = request.headers.get("x-cron-secret") || request.headers.get("authorization")?.replace("Bearer ", "");
  return header === configured;
}

async function evaluateAllActiveFarms(supabase) {
  const { data: farms, error } = await supabase
    .from("farms")
    .select("id, farm_name, district_name, users(id, name, mobile, email, role, is_farm_owner, is_active)")
    .eq("is_active", true)
    .limit(500);
  if (error) throw error;

  const results = [];
  for (const farm of farms || []) {
    const owner = (farm.users || []).find((user) => user.is_farm_owner && user.is_active) ||
      (farm.users || []).find((user) => user.is_active);
    if (!owner) continue;

    try {
      await evaluateAchievements(supabase, {
        farmId: farm.id,
        userId: owner.id,
        user: owner,
        decoded: { farmName: farm.farm_name }
      }, { notify: true });
      results.push({ farmId: farm.id, status: "ok" });
    } catch (error) {
      results.push({ farmId: farm.id, status: "failed", error: error.message });
    }
  }
  return results;
}

export async function POST(request) {
  try {
    const supabase = getSupabaseServerClient();

    if (hasCronAccess(request)) {
      const results = await evaluateAllActiveFarms(supabase);
      return NextResponse.json({
        mode: "cron",
        evaluated: results.length,
        failed: results.filter((row) => row.status === "failed").length,
        results
      });
    }

    const auth = await verifyFarmAccess(request);
    const result = await evaluateAchievements(supabase, auth, { notify: true });
    return NextResponse.json({ mode: "user", ...result });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function GET(request) {
  return POST(request);
}

