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
    const scheduledAt = body.scheduledAt || body.scheduled_at;

    if (!notificationId || !scheduledAt) {
      throw new Error("Notification ID and schedule time are required.");
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .update({ status: "scheduled", scheduled_at: scheduledAt })
      .eq("id", notificationId)
      .select("*")
      .single();

    if (error) throw error;

    const { error: deleteScheduleError } = await supabase.from("scheduled_notifications").delete().eq("notification_id", notificationId);
    if (deleteScheduleError) {
      throw deleteScheduleError;
    }

    const { error: insertScheduleError } = await supabase.from("scheduled_notifications").insert({
      notification_id: notificationId,
      schedule_type: body.scheduleType || "once",
      cron_expression: body.cronExpression || null,
      next_run_at: scheduledAt,
      status: "active"
    });
    if (insertScheduleError) {
      throw insertScheduleError;
    }

    await logAdminAction(request, adminId, "scheduled_notification", null, { notificationId, scheduledAt });
    return NextResponse.json({ success: true, notification: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
