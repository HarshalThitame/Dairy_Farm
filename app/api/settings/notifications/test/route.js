import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { sendDirectPushToUser } from "@/lib/notificationCenter";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getOrCreateNotificationPreferences, normalizeNotificationPreferences } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const prefs = normalizeNotificationPreferences(
      await getOrCreateNotificationPreferences(supabase, auth.userId, auth.farmId)
    );
    const inAppEnabled = prefs.channels.in_app === true;
    const pushEnabled = prefs.channels.push === true;

    if (!inAppEnabled && !pushEnabled) {
      return NextResponse.json(
        { error: "किमान App मध्ये सूचना किंवा Mobile Notification channel चालू करा." },
        { status: 400 }
      );
    }

    const notificationPayload = {
      title: "📢 माझी डेअरी सूचना",
      message: "ही चाचणी सूचना आहे. तुमच्या सूचना व्यवस्थित चालू आहेत.",
      type: "information",
      priority: "normal",
      target_audience: "specific_users",
      target_filter: { userIds: [auth.userId] },
      channels: [
        ...(inAppEnabled ? ["in_app"] : []),
        ...(pushEnabled ? ["push"] : [])
      ],
      status: "sent",
      sent_at: new Date().toISOString(),
      total_recipients: 1
    };

    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert(notificationPayload)
      .select("id")
      .single();

    if (notificationError) {
      throw notificationError;
    }

    let inAppDelivered = 0;
    if (inAppEnabled) {
      const { error: logError } = await supabase.from("notification_delivery_logs").upsert({
        notification_id: notification.id,
        farm_id: auth.farmId,
        user_id: auth.userId,
        channel: "in_app",
        delivery_status: "delivered",
        delivered_at: new Date().toISOString()
      }, { onConflict: "notification_id,user_id,channel" });
      if (logError) {
        throw logError;
      }
      inAppDelivered = 1;
    }

    let push = { attempted: 0, delivered: 0, failed: 0 };
    let pushError = "";
    if (pushEnabled) {
      try {
        push = await sendDirectPushToUser(supabase, auth.userId, {
          id: notification.id,
          title: notificationPayload.title,
          body: notificationPayload.message,
          url: "/notifications",
          tag: `settings-test:${notification.id}`
        });
      } catch (error) {
        pushError = error.message || "Mobile push पाठवता आली नाही.";
      }
    }

    const delivered = inAppDelivered > 0 || push.delivered > 0;
    const fallbackPushMessage = pushEnabled && push.delivered < 1
      ? "Mobile notification phone panel मध्ये पोहोचली नाही. Push permission आणि subscription तपासा."
      : "";
    const message = [
      inAppDelivered > 0 ? "App मध्ये चाचणी सूचना पाठवली." : "",
      pushEnabled && push.delivered > 0 ? "Mobile notification phone panel मध्ये पाठवली." : "",
      pushEnabled && push.delivered < 1 ? (pushError || fallbackPushMessage) : ""
    ].filter(Boolean).join(" ");

    await supabase
      .from("notifications")
      .update({
        status: delivered ? "sent" : "failed",
        delivered_count: delivered ? 1 : 0,
        failure_reason: delivered && pushError ? pushError : delivered ? null : (pushError || fallbackPushMessage)
      })
      .eq("id", notification.id);

    return NextResponse.json({
      success: delivered,
      notificationId: notification.id,
      inAppDelivered,
      push,
      warning: pushError || (!delivered ? fallbackPushMessage : null),
      message,
      error: delivered ? undefined : (pushError || fallbackPushMessage || "चाचणी सूचना पाठवता आली नाही.")
    }, { status: delivered ? 200 : 400 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
