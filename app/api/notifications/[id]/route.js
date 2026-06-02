import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getDeliveryLog(supabase, notificationId, userId, farmId) {
  const { data, error } = await supabase
    .from("notification_delivery_logs")
    .select("id, notification_id, user_id, farm_id, channel")
    .eq("notification_id", notificationId)
    .eq("user_id", userId)
    .eq("farm_id", farmId)
    .eq("channel", "in_app")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const err = new Error("सूचना सापडली नाही.");
    err.status = 404;
    throw err;
  }

  return data;
}

export async function GET(request, { params }) {
  try {
    const { userId, farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const log = await getDeliveryLog(supabase, params.id, userId, farmId);
    const { data: notification, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", log.notification_id)
      .single();

    if (error) throw error;

    return NextResponse.json({ notification });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId, farmId } = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const action = body.action || "read";
    const supabase = getSupabaseServerClient();
    const log = await getDeliveryLog(supabase, params.id, userId, farmId);
    const now = new Date().toISOString();

    if (action === "click") {
      await supabase
        .from("notification_delivery_logs")
        .update({ opened_at: now, clicked_at: now, delivery_status: "clicked" })
        .eq("id", log.id);
    } else if (action === "delete") {
      await supabase
        .from("notification_delivery_logs")
        .update({ deleted_at: now, delivery_status: "deleted" })
        .eq("id", log.id);
    } else {
      await supabase
        .from("notification_delivery_logs")
        .update({ opened_at: now, delivery_status: "opened" })
        .eq("id", log.id);
    }

    if (action === "read" || action === "click") {
      await supabase.from("notification_reads").upsert({
        notification_id: params.id,
        user_id: userId,
        read_at: now
      }, { onConflict: "notification_id,user_id" });
    }

    const { refreshNotificationStats } = await import("@/lib/notificationCenter");
    await refreshNotificationStats(supabase, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId, farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const log = await getDeliveryLog(supabase, params.id, userId, farmId);
    await supabase
      .from("notification_delivery_logs")
      .update({ deleted_at: new Date().toISOString(), delivery_status: "deleted" })
      .eq("id", log.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
