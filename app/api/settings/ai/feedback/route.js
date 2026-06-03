import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json();
    const logId = String(body.logId || body.log_id || "").trim();
    const feedback = String(body.feedback || "").trim();
    const note = String(body.note || "").trim().slice(0, 500);

    if (!logId) {
      return NextResponse.json({ error: "AI history record निवडा." }, { status: 400 });
    }
    if (!["useful", "not_useful"].includes(feedback)) {
      return NextResponse.json({ error: "Feedback चुकीचा आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_assistant_logs")
      .update({
        feedback,
        feedback_note: note || null,
        feedback_at: new Date().toISOString()
      })
      .eq("id", logId)
      .eq("farm_id", auth.farmId)
      .eq("user_id", auth.userId)
      .select("id, feedback, feedback_at")
      .single();

    if (error) throw error;

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "ai_feedback_saved", {
      logId,
      feedback
    });

    return NextResponse.json({ success: true, feedback: data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
