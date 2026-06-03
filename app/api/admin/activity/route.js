import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { badRequest, isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function startOfIstDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    const error = new Error("Invalid from date.");
    error.status = 400;
    throw error;
  }
  return new Date(`${date}T00:00:00+05:30`).toISOString();
}

function endOfIstDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    const error = new Error("Invalid to date.");
    error.status = 400;
    throw error;
  }
  return new Date(`${date}T23:59:59.999+05:30`).toISOString();
}

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
      query = query.gte("created_at", startOfIstDate(searchParams.get("from_date")));
    }
    if (searchParams.get("to_date")) {
      query = query.lte("created_at", endOfIstDate(searchParams.get("to_date")));
    }
    if (searchParams.get("action")) {
      query = query.eq("action", searchParams.get("action"));
    }
    if (searchParams.get("farm_id")) {
      if (!isUuid(searchParams.get("farm_id"))) {
        throw badRequest("Farm ID चुकीचा आहे.");
      }
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
    const body = await readJsonBody(request);
    const farmId = body.farm_id || null;
    if (farmId && !isUuid(farmId)) {
      throw badRequest("Farm ID चुकीचा आहे.");
    }
    await logAdminAction(request, adminId, body.action || "manual_log", farmId, body.details || {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
