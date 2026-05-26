import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("admin_activity_log")
      .select("id, admin_id, farm_id, action, details, ip_address, user_agent, created_at, farms(farm_name), super_admins(name, email)")
      .order("created_at", { ascending: false })
      .limit(300);

    if (searchParams.get("from_date")) {
      query = query.gte("created_at", searchParams.get("from_date"));
    }
    if (searchParams.get("to_date")) {
      query = query.lte("created_at", searchParams.get("to_date"));
    }
    if (searchParams.get("action")) {
      query = query.eq("action", searchParams.get("action"));
    }
    if (searchParams.get("farm_id")) {
      query = query.eq("farm_id", searchParams.get("farm_id"));
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({ activity: data || [] });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    await logAdminAction(request, adminId, body.action || "manual_log", body.farm_id || null, body.details || {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
