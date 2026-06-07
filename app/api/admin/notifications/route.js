import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import {
  createAdminNotification,
  getPagination,
  notificationTypes,
  sendNotificationNow
} from "@/lib/notificationCenter";
import { badRequest, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["all", "draft", "scheduled", "sending", "sent", "cancelled", "failed"]);

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, from, to } = getPagination(searchParams);
    const status = searchParams.get("status") || "all";
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("search") || "";
    const supabase = getSupabaseServerClient();

    if (!ALLOWED_STATUSES.has(status)) {
      throw badRequest("Notification status चुकीचा आहे.");
    }
    if (type !== "all" && !notificationTypes.includes(type)) {
      throw badRequest("Notification type चुकीचा आहे.");
    }

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (type !== "all") {
      query = query.eq("type", type);
    }
    if (search.trim()) {
      const value = search.trim().replace(/[%,()]/g, "");
      if (value) {
        query = query.or(`title.ilike.%${value}%,message.ilike.%${value}%`);
      }
    }

    const { data, error, count } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({
      notifications: data || [],
      total: count || 0,
      page,
      pages: Math.max(1, Math.ceil((count || 0) / limit))
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await readJsonBody(request);
    const supabase = getSupabaseServerClient();
    const created = await createAdminNotification(supabase, adminId, body);
    let sent = null;

    if (created.payload.sendNow && !created.payload.saveAsDraft) {
      sent = await sendNotificationNow(supabase, created.notification.id);
    }

    await logAdminAction(request, adminId, sent ? "sent_notification" : "created_notification", null, {
      notificationId: created.notification.id,
      targetAudience: created.payload.target_audience,
      recipientCount: sent?.recipientCount ?? created.recipientCount
    });

    return NextResponse.json({
      success: true,
      notification: sent?.notification || created.notification,
      recipientCount: sent?.recipientCount ?? created.recipientCount,
      push: sent?.push || null
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
