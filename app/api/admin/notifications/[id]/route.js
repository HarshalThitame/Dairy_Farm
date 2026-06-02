import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { getStoredScheduleConfig, normalizeNotificationPayload } from "@/lib/notificationCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const { data: notification, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      throw error;
    }

    const [{ data: targets }, { data: logs }, { data: schedule }] = await Promise.all([
      supabase.from("notification_targets").select("*").eq("notification_id", params.id),
      supabase.from("notification_delivery_logs").select("*").eq("notification_id", params.id).limit(500),
      supabase.from("scheduled_notifications").select("*").eq("notification_id", params.id).maybeSingle()
    ]);

    return NextResponse.json({
      notification,
      targets: targets || [],
      logs: logs || [],
      schedule: schedule || null
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const payload = normalizeNotificationPayload(body);
    const supabase = getSupabaseServerClient();

    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("id, status")
      .eq("id", params.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }
    if (existing.status === "sent") {
      throw new Error("Sent notification cannot be edited.");
    }

    const status = payload.saveAsDraft ? "draft" : payload.scheduleType === "later" || payload.scheduleType === "recurring" ? "scheduled" : "draft";
    const { data, error } = await supabase
      .from("notifications")
      .update({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority,
        image_url: payload.image_url,
        action_text: payload.action_text,
        action_url: payload.action_url,
        target_audience: payload.target_audience,
        target_filter: payload.target_filter,
        channels: payload.channels,
        scheduled_at: payload.scheduled_at,
        expires_at: payload.expires_at,
        status
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await supabase.from("notification_targets").delete().eq("notification_id", params.id);
    const { resolveNotificationRecipients, createNotificationTargets } = await import("@/lib/notificationCenter");
    const resolved = await resolveNotificationRecipients(supabase, payload);
    await createNotificationTargets(supabase, params.id, payload, resolved);

    await supabase.from("scheduled_notifications").delete().eq("notification_id", params.id);
    if (status === "scheduled") {
      const scheduleConfig = getStoredScheduleConfig(payload);
      const { error: scheduleError } = await supabase.from("scheduled_notifications").insert({
        notification_id: params.id,
        schedule_type: scheduleConfig.schedule_type,
        cron_expression: scheduleConfig.cron_expression,
        next_run_at: payload.scheduled_at,
        status: "active"
      });
      if (scheduleError) {
        await supabase
          .from("notifications")
          .update({
            status: "failed",
            failure_reason: scheduleError.message || "Schedule creation failed."
          })
          .eq("id", params.id);
        throw scheduleError;
      }
    }

    await logAdminAction(request, adminId, "edited_notification", null, { notificationId: params.id });

    return NextResponse.json({ success: true, notification: data, recipientCount: resolved.recipients.length });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("notifications")
      .select("id, status")
      .eq("id", params.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }
    if (existing.status === "sent") {
      await supabase.from("notifications").update({ status: "cancelled" }).eq("id", params.id);
    } else {
      const { error } = await supabase.from("notifications").delete().eq("id", params.id);
      if (error) throw error;
    }

    await logAdminAction(request, adminId, "deleted_notification", null, { notificationId: params.id, previousStatus: existing.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
