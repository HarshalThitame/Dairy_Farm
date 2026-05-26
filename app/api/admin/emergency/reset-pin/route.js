import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const userId = body.userId;
    const newPin = String(body.newPin || "").trim();

    if (!userId || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: "Valid userId and 4 digit PIN are required" }, { status: 400 });
    }

    const weakPins = new Set(["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321"]);
    if (weakPins.has(newPin)) {
      return NextResponse.json({ error: "PIN is too weak" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, farm_id, name, mobile")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pinHash = await bcrypt.hash(newPin, Number(process.env.BCRYPT_ROUNDS || 10));
    const { error } = await supabase.from("users").update({ pin_hash: pinHash }).eq("id", userId);

    if (error) {
      throw error;
    }

    await logAdminAction(request, adminId, "reset_user_pin", user.farm_id, {
      userId,
      userName: user.name,
      mobile: user.mobile
    });

    return NextResponse.json({ success: true, newPin });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
