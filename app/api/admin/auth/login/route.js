import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, signSuperAdminToken } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCK_MINUTES = 15;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: admin, error } = await supabase
      .from("super_admins")
      .select("id, email, password_hash, name, mobile, is_active, failed_attempts, locked_until, last_login")
      .eq("email", email)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!admin.is_active) {
      await logAdminAction(request, admin.id, "failed_login_suspended", null, { email });
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    if (admin.locked_until && new Date(admin.locked_until).getTime() > Date.now()) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again after 15 minutes." },
        { status: 429 }
      );
    }

    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      const failedAttempts = Number(admin.failed_attempts || 0) + 1;
      const update = { failed_attempts: failedAttempts };

      if (failedAttempts >= 5) {
        update.locked_until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
      }

      await supabase.from("super_admins").update(update).eq("id", admin.id);
      await logAdminAction(request, admin.id, "failed_login", null, { email, failedAttempts });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await supabase
      .from("super_admins")
      .update({
        failed_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq("id", admin.id);

    const publicAdmin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      mobile: admin.mobile,
      lastLogin: admin.last_login
    };

    const token = signSuperAdminToken(admin);
    await logAdminAction(request, admin.id, "super_admin_login", null, { email });

    return NextResponse.json({ token, admin: publicAdmin });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
