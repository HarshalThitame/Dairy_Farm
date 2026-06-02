import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getPagination(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

function isExpired(notification) {
  return notification?.expires_at && new Date(notification.expires_at).getTime() < Date.now();
}

export async function GET(request) {
  try {
    const { userId, farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, from, to } = getPagination(searchParams);
    const filter = searchParams.get("filter") || "all";
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("search") || "";
    const supabase = getSupabaseServerClient();

    let query = supabase
      .from("notification_delivery_logs")
      .select("id, notification_id, farm_id, user_id, delivery_status, delivered_at, opened_at, clicked_at, deleted_at, notifications(*)", { count: "exact" })
      .eq("user_id", userId)
      .eq("farm_id", farmId)
      .eq("channel", "in_app")
      .is("deleted_at", null)
      .order("delivered_at", { ascending: false, nullsFirst: false })
      .range(0, Math.min(999, Math.max(to, page * limit * 5 - 1)));

    if (filter === "unread") {
      query = query.is("opened_at", null);
    } else if (filter === "read") {
      query = query.not("opened_at", "is", null);
    }

    const { data, error, count } = await query;
    if (error) {
      throw error;
    }

    const filteredRows = (data || [])
      .filter((row) => row.notifications && row.notifications.status === "sent" && !isExpired(row.notifications))
      .filter((row) => type === "all" || row.notifications.type === type)
      .filter((row) => {
        if (!search.trim()) return true;
        const value = search.trim().toLowerCase();
        return `${row.notifications.title || ""} ${row.notifications.message || ""}`.toLowerCase().includes(value);
      });
    const rows = filteredRows.slice(from, to + 1);

    const unreadResponse = await supabase
      .from("notification_delivery_logs")
      .select("id, notifications(status, expires_at)")
      .eq("user_id", userId)
      .eq("farm_id", farmId)
      .eq("channel", "in_app")
      .is("opened_at", null)
      .is("deleted_at", null)
      .limit(1000);

    if (unreadResponse.error) {
      throw unreadResponse.error;
    }

    const unreadCount = (unreadResponse.data || []).filter((row) => (
      row.notifications?.status === "sent" && !isExpired(row.notifications)
    )).length;

    return NextResponse.json({
      notifications: rows.map((row) => ({
        ...row.notifications,
        deliveryLogId: row.id,
        deliveredAt: row.delivered_at,
        readAt: row.opened_at,
        clickedAt: row.clicked_at,
        unread: !row.opened_at
      })),
      unreadCount,
      total: filteredRows.length || count || 0,
      page,
      pages: Math.max(1, Math.ceil((filteredRows.length || count || 0) / limit))
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
