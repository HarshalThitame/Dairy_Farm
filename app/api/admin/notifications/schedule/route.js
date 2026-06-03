import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getStoredScheduleConfig } from "@/lib/notificationCenter";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { badRequest, isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await readJsonBody(request);
    const notificationId = body.notificationId || body.id;
    const scheduledAt = body.scheduledAt || body.scheduled_at;

    if (!notificationId || !scheduledAt) {
      throw badRequest("Notification ID आणि schedule time आवश्यक आहे.");
    }
    if (!isUuid(notificationId)) {
      throw badRequest("Notification ID चुकीचा आहे.");
    }
    if (Number.isNaN(new Date(scheduledAt).getTime())) {
      throw badRequest("Schedule time चुकीचा आहे.");
    }
    if (new Date(scheduledAt).getTime() < Date.now() - 60000) {
      throw badRequest("Schedule time मागच्या वेळेत ठेवू शकत नाही.");
    }

    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("id, status")
      .eq("id", notificationId)
      .single();

    if (fetchError) throw fetchError;
    if (["sent", "sending", "cancelled"].includes(existing.status)) {
      throw badRequest("ही notification schedule करता येणार नाही.");
    }

    const scheduleConfig = getStoredScheduleConfig(body);
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
      schedule_type: scheduleConfig.schedule_type,
      cron_expression: scheduleConfig.cron_expression,
      next_run_at: scheduledAt,
      status: "active"
    });
    if (insertScheduleError) {
      await supabase
        .from("notifications")
        .update({
          status: "failed",
          failure_reason: insertScheduleError.message || "Schedule creation failed."
        })
        .eq("id", notificationId);
      throw insertScheduleError;
    }

    await logAdminAction(request, adminId, "scheduled_notification", null, { notificationId, scheduledAt });
    return NextResponse.json({ success: true, notification: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
