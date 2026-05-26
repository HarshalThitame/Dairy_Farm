import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const [adminResult, settingsResult] = await Promise.all([
      supabase
        .from("super_admins")
        .select("id, email, name, mobile, last_login, created_at")
        .eq("id", adminId)
        .single(),
      supabase.from("platform_settings").select("*").order("key")
    ]);

    if (adminResult.error) throw adminResult.error;
    if (settingsResult.error) throw settingsResult.error;

    return NextResponse.json({
      admin: adminResult.data,
      settings: settingsResult.data || []
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();

    if (body.profile) {
      const profile = {};
      if (body.profile.name !== undefined) profile.name = String(body.profile.name).trim();
      if (body.profile.mobile !== undefined) profile.mobile = String(body.profile.mobile).trim();
      if (Object.keys(profile).length) {
        const { error } = await supabase.from("super_admins").update(profile).eq("id", adminId);
        if (error) throw error;
      }
    }

    if (body.password) {
      const currentPassword = String(body.password.currentPassword || "");
      const newPassword = String(body.password.newPassword || "");

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }

      const { data: admin, error: adminError } = await supabase
        .from("super_admins")
        .select("password_hash")
        .eq("id", adminId)
        .single();
      if (adminError) throw adminError;

      const valid = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }

      const passwordHash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS || 10));
      const { error } = await supabase.from("super_admins").update({ password_hash: passwordHash }).eq("id", adminId);
      if (error) throw error;
    }

    if (body.settings) {
      const keys = Object.keys(body.settings);
      for (const key of keys) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value: String(body.settings[key]), updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) throw error;
      }
    }

    await logAdminAction(request, adminId, "updated_admin_settings", null, {
      profile: Boolean(body.profile),
      password: Boolean(body.password),
      settings: body.settings ? Object.keys(body.settings) : []
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
