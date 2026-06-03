import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  buildGoalRecommendation,
  calculateGoalHistory,
  calculateGoalProgress,
  getOrCreateGoalSettings,
  notifyGoalAchievements,
  sanitizeGoalSettings,
  upsertGoalHistory
} from "@/lib/goalTracking";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function buildGoalResponse(supabase, farmId, userId, goals, shouldNotify = true) {
  const [progress, history] = await Promise.all([
    calculateGoalProgress(supabase, farmId, goals),
    calculateGoalHistory(supabase, farmId, goals)
  ]);

  await upsertGoalHistory(supabase, farmId, [...progress, ...history]);
  const notifications = goals.enabled && shouldNotify
    ? await notifyGoalAchievements(supabase, farmId, userId, progress)
    : [];

  return {
    goals,
    progress,
    history,
    recommendation: buildGoalRecommendation(progress),
    notifications
  };
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const goals = await getOrCreateGoalSettings(supabase, auth.farmId, auth.userId);
    const response = await buildGoalResponse(supabase, auth.farmId, auth.userId, goals, true);
    return NextResponse.json(response);
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();
    const current = await getOrCreateGoalSettings(supabase, auth.farmId, auth.userId);
    const next = sanitizeGoalSettings(body, current);

    if (next.daily_milk_goal > 100000 || next.weekly_milk_goal > 700000 || next.monthly_milk_goal > 3000000) {
      return NextResponse.json({ error: "दूध लक्ष्य खूप मोठे आहे. कृपया योग्य आकडा भरा." }, { status: 400 });
    }
    if (next.fat_goal > 20 || next.snf_goal > 20) {
      return NextResponse.json({ error: "फॅट/SNF लक्ष्य २० पेक्षा कमी असावे." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("farm_goal_settings")
      .upsert({
        farm_id: auth.farmId,
        updated_by: auth.userId,
        daily_milk_goal: next.daily_milk_goal,
        weekly_milk_goal: next.weekly_milk_goal,
        monthly_milk_goal: next.monthly_milk_goal,
        fat_goal: next.fat_goal,
        snf_goal: next.snf_goal,
        enabled: next.enabled,
        updated_at: new Date().toISOString()
      }, { onConflict: "farm_id" })
      .select("*")
      .single();

    if (error) throw error;

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "goal_settings_updated", next);

    const response = await buildGoalResponse(supabase, auth.farmId, auth.userId, data, false);
    return NextResponse.json({
      ...response,
      message: "लक्ष्य सेटिंग्ज जतन झाल्या."
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
