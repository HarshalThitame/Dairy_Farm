import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { badRequest, isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await readJsonBody(request);
    const notificationId = body.notificationId || body.id;
    if (!notificationId) {
      throw badRequest("Notification ID आवश्यक आहे.");
    }
    if (!isUuid(notificationId)) {
      throw badRequest("Notification ID चुकीचा आहे.");
    }

    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("id, status")
      .eq("id", notificationId)
      .single();

    if (fetchError) throw fetchError;
    if (!["draft", "scheduled"].includes(existing.status)) {
      throw badRequest("फक्त draft किंवा scheduled notifications cancel करता येतात.");
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ status: "cancelled" })
      .eq("id", notificationId)
      .select("*")
      .single();

    if (error) throw error;

    await supabase
      .from("scheduled_notifications")
      .update({ status: "cancelled" })
      .eq("notification_id", notificationId);

    await logAdminAction(request, adminId, "cancelled_notification", null, { notificationId });
    return NextResponse.json({ success: true, notification: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
