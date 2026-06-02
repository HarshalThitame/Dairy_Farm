import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { sendNotificationNow } from "@/lib/notificationCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function addRecurringDate(date, scheduleType) {
  const next = new Date(date);
  if (scheduleType === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (scheduleType === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}

export async function POST(request) {
  try {
    const cronSecret = request.headers.get("x-cron-secret") || "";
    let adminId = null;

    if (process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET) {
      adminId = null;
    } else {
      const auth = await verifySuperAdmin(request);
      adminId = auth.adminId;
    }

    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const { data: due, error } = await supabase
      .from("scheduled_notifications")
      .select("*, notifications(*)")
      .eq("status", "active")
      .lte("next_run_at", now)
      .limit(25);

    if (error) throw error;

    const processed = [];
    for (const schedule of due || []) {
      if (!schedule.notifications) {
        await supabase
          .from("scheduled_notifications")
          .update({ status: "failed", last_run_at: now })
          .eq("id", schedule.id);
        processed.push({ scheduleId: schedule.id, skipped: true, reason: "Notification record missing" });
        continue;
      }

      if (schedule.notifications?.status === "cancelled") {
        await supabase.from("scheduled_notifications").update({ status: "cancelled" }).eq("id", schedule.id);
        continue;
      }

      if (schedule.schedule_type === "once") {
        const result = await sendNotificationNow(supabase, schedule.notification_id);
        processed.push({ notificationId: schedule.notification_id, recipientCount: result.recipientCount });
        await supabase
          .from("scheduled_notifications")
          .update({ status: "completed", last_run_at: now })
          .eq("id", schedule.id);
      } else {
        const original = schedule.notifications;
        const { data: clone, error: cloneError } = await supabase
          .from("notifications")
          .insert({
            title: original.title,
            message: original.message,
            type: original.type,
            priority: original.priority,
            image_url: original.image_url,
            action_text: original.action_text,
            action_url: original.action_url,
            target_audience: original.target_audience,
            target_filter: original.target_filter,
            channels: original.channels,
            created_by: original.created_by,
            scheduled_at: now,
            expires_at: original.expires_at,
            status: "draft"
          })
          .select("id")
          .single();
        if (cloneError) throw cloneError;

        const result = await sendNotificationNow(supabase, clone.id);
        processed.push({ notificationId: clone.id, recurringSourceId: schedule.notification_id, recipientCount: result.recipientCount });
        await supabase
          .from("scheduled_notifications")
          .update({
            last_run_at: now,
            next_run_at: addRecurringDate(now, schedule.schedule_type)
          })
          .eq("id", schedule.id);
      }
    }

    if (adminId) {
      await logAdminAction(request, adminId, "processed_scheduled_notifications", null, { processed });
    }

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
