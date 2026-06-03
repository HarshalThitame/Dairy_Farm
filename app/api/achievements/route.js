import { NextResponse } from "next/server";
import { evaluateAchievements } from "@/lib/achievementEngine";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const result = await evaluateAchievements(supabase, auth, { notify: true });
    return NextResponse.json(result);
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const supabase = getSupabaseServerClient();

    if (body.action === "mark_notifications_read") {
      const { error } = await supabase
        .from("achievement_notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("farm_id", auth.farmId)
        .eq("user_id", auth.userId)
        .is("read_at", null);
      if (error) throw error;
      return NextResponse.json({ message: "Achievement notifications वाचल्या म्हणून mark झाल्या." });
    }

    const result = await evaluateAchievements(supabase, auth, { notify: body.notify !== false });
    return NextResponse.json({ ...result, message: "Achievements update झाले." });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

