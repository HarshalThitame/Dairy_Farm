import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { sendNotificationNow } from "@/lib/notificationCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function matchesCronField(field, value, min, max, sundaySeven = false) {
  const text = String(field || "*").trim();
  if (text === "*") return true;

  return text.split(",").some((part) => {
    const item = part.trim();
    if (!item) return false;

    const stepMatch = item.match(/^\*\/(\d+)$/);
    if (stepMatch) {
      const step = Number(stepMatch[1]);
      return step > 0 && (value - min) % step === 0;
    }

    const rangeMatch = item.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      return value >= start && value <= end;
    }

    const numeric = Number(item);
    if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
      return false;
    }
    if (sundaySeven && numeric === 7) {
      return value === 0;
    }
    return value === numeric;
  });
}

function addCustomCronDate(date, expression) {
  const fields = String(expression || "").trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Invalid custom cron expression. Use five fields, for example: 0 9 * * 1");
  }

  const start = new Date(date);
  start.setSeconds(0, 0);
  const maxMinutesToSearch = 366 * 24 * 60;

  for (let minuteOffset = 1; minuteOffset <= maxMinutesToSearch; minuteOffset += 1) {
    const candidate = new Date(start.getTime() + minuteOffset * 60 * 1000);
    const minute = candidate.getMinutes();
    const hour = candidate.getHours();
    const dayOfMonth = candidate.getDate();
    const month = candidate.getMonth() + 1;
    const dayOfWeek = candidate.getDay();

    if (
      matchesCronField(fields[0], minute, 0, 59) &&
      matchesCronField(fields[1], hour, 0, 23) &&
      matchesCronField(fields[2], dayOfMonth, 1, 31) &&
      matchesCronField(fields[3], month, 1, 12) &&
      matchesCronField(fields[4], dayOfWeek, 0, 7, true)
    ) {
      return candidate.toISOString();
    }
  }

  throw new Error("Could not calculate next custom cron run.");
}

function addRecurringDate(date, scheduleType, cronExpression) {
  const next = new Date(date);
  if (scheduleType === "custom_cron") {
    return addCustomCronDate(date, cronExpression);
  }
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
      try {
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
          processed.push({ scheduleId: schedule.id, skipped: true, reason: "Notification cancelled" });
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
              next_run_at: addRecurringDate(now, schedule.schedule_type, schedule.cron_expression)
            })
            .eq("id", schedule.id);
        }
      } catch (scheduleError) {
        await supabase
          .from("scheduled_notifications")
          .update({
            status: "failed",
            last_run_at: now
          })
          .eq("id", schedule.id);
        processed.push({
          scheduleId: schedule.id,
          notificationId: schedule.notification_id,
          failed: true,
          error: scheduleError.message || "Scheduled notification failed"
        });
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
