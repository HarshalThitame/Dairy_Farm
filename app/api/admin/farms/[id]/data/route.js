import { NextResponse } from "next/server";
import { badRequest, isUuid } from "@/lib/apiSafety";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function fetchType(supabase, farmId, type) {
  if (type === "cows") {
    return supabase.from("cows").select("*").eq("farm_id", farmId).order("name");
  }
  if (type === "milk") {
    return supabase.from("milk_records").select("*, cows(name)").eq("farm_id", farmId).order("date", { ascending: false }).limit(100);
  }
  if (type === "ai") {
    return supabase.from("ai_records").select("*, cows(name)").eq("farm_id", farmId).order("ai_date", { ascending: false }).limit(100);
  }
  if (type === "health") {
    return supabase.from("health_records").select("*, cows(name)").eq("farm_id", farmId).order("date", { ascending: false }).limit(100);
  }
  if (type === "users") {
    return supabase.from("users").select("id, mobile, name, role, is_active, is_farm_owner, last_login").eq("farm_id", farmId);
  }
  const error = new Error("Invalid data type");
  error.status = 400;
  return { data: null, error };
}

export async function GET(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Farm ID चुकीचा आहे.");
    }

    const { adminId } = await verifySuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const supabase = getSupabaseServerClient();

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("id")
      .eq("id", params.id)
      .single();

    if (farmError || !farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 });
    }

    if (type === "all") {
      const [cows, milk, ai, health, users] = await Promise.all([
        fetchType(supabase, params.id, "cows"),
        fetchType(supabase, params.id, "milk"),
        fetchType(supabase, params.id, "ai"),
        fetchType(supabase, params.id, "health"),
        fetchType(supabase, params.id, "users")
      ]);
      const failed = [
        ["cows", cows.error],
        ["milk", milk.error],
        ["ai", ai.error],
        ["health", health.error],
        ["users", users.error]
      ].find(([, error]) => error);
      if (failed) {
        const error = new Error(`${failed[0]} data load failed: ${failed[1].message}`);
        error.status = failed[1].status || 500;
        throw error;
      }
      await logAdminAction(request, adminId, "viewed_data", params.id, { type });
      return NextResponse.json({
        cows: cows.data || [],
        milk: milk.data || [],
        ai: ai.data || [],
        health: health.data || [],
        users: users.data || []
      });
    }

    const result = await fetchType(supabase, params.id, type);
    if (result.error) {
      throw result.error;
    }
    await logAdminAction(request, adminId, "viewed_data", params.id, { type });
    return NextResponse.json({ data: result.data || [] });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
