import { NextResponse } from "next/server";
import { badRequest, isUuid, readJsonBody } from "@/lib/apiSafety";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("User ID चुकीचा आहे.");
    }

    const { adminId } = await verifySuperAdmin(request);
    const body = await readJsonBody(request);
    const action = String(body.action || "").trim();
    const supabase = getSupabaseServerClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, farm_id, name, mobile, is_active")
      .eq("id", params.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "activate" || action === "deactivate") {
      const isActive = action === "activate";
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", params.id)
        .select("id, farm_id, name, mobile, role, is_active, is_farm_owner, last_login, created_at")
        .single();

      if (error) {
        throw error;
      }

      await logAdminAction(request, adminId, isActive ? "activated_user" : "deactivated_user", user.farm_id, {
        userId: user.id,
        userName: user.name
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === "force_logout") {
      const { error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          logout_at: new Date().toISOString()
        })
        .eq("user_id", params.id)
        .eq("is_active", true);

      if (error) {
        throw error;
      }

      await logAdminAction(request, adminId, "force_logged_out_user", user.farm_id, {
        userId: user.id,
        userName: user.name
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
