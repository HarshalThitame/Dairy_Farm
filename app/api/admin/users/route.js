import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { maskMobile, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farm_id") || "";
    const role = searchParams.get("role") || "all";
    const search = searchParams.get("search") || "";
    const supabase = getSupabaseServerClient();

    let query = supabase
      .from("users")
      .select("id, farm_id, mobile, name, role, is_active, is_farm_owner, last_login, created_at, farms(id, farm_name)")
      .order("created_at", { ascending: false });

    if (farmId) {
      query = query.eq("farm_id", farmId);
    }

    if (role === "owners") {
      query = query.eq("is_farm_owner", true);
    } else if (role !== "all") {
      query = query.eq("role", role);
    }

    if (search.trim()) {
      const value = search.trim().replace(/[%,()]/g, "");
      if (value) {
        query = query.or(`name.ilike.%${value}%,mobile.ilike.%${value}%`);
      }
    }

    const { data, error } = await query.limit(300);
    if (error) {
      throw error;
    }

    return NextResponse.json({
      users: (data || []).map((user) => ({
        ...user,
        mobile_masked: maskMobile(user.mobile)
      }))
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
