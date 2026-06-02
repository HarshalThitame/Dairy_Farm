import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const notificationId = body.notificationId || body.id;
    if (!notificationId) {
      throw new Error("Notification ID is required.");
    }

    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("id, status")
      .eq("id", notificationId)
      .single();

    if (fetchError) throw fetchError;
    if (!["draft", "scheduled"].includes(existing.status)) {
      throw new Error("Only draft or scheduled notifications can be cancelled.");
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
