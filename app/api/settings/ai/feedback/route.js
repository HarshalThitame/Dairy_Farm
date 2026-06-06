import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const safeBody = body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const logId = String(safeBody.logId || safeBody.log_id || "").trim();
    const feedback = String(safeBody.feedback || "").trim();
    const note = String(safeBody.note || "").trim().slice(0, 500);

    if (!logId) {
      return NextResponse.json({ error: "AI history record निवडा." }, { status: 400 });
    }
    if (!uuidPattern.test(logId)) {
      return NextResponse.json({ error: "AI history record चुकीचा आहे." }, { status: 400 });
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
      .is("deleted_at", null)
      .select("id, feedback, feedback_at")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "AI history record सापडला नाही." }, { status: 404 });
    }

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "ai_feedback_saved", {
      logId,
      feedback
    });

    return NextResponse.json({ success: true, feedback: data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
