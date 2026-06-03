import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) return "Password किमान ८ अक्षरांचा असावा.";
  if (!/[A-Z]/.test(value)) return "Password मध्ये एक uppercase अक्षर हवे.";
  if (!/[a-z]/.test(value)) return "Password मध्ये एक lowercase अक्षर हवे.";
  if (!/\d/.test(value)) return "Password मध्ये एक number हवा.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password मध्ये एक special character हवा.";
  return "";
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await readJsonBody(request);
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "नवीन password दोन्ही ठिकाणी सारखा नाही." }, { status: 400 });
    }

    const validation = validatePassword(newPassword);
    if (validation) {
      return NextResponse.json({ error: validation }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, password_hash")
      .eq("id", auth.userId)
      .single();

    if (userError) throw userError;

    if (user.password_hash) {
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "सध्याचा password चुकीचा आहे." }, { status: 401 });
      }
    } else if (currentPassword) {
      return NextResponse.json({ error: "या खात्यासाठी आधी password सेट केलेला नाही." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS || 10));
    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq("id", auth.userId);
    if (error) throw error;

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "password_changed");
    return NextResponse.json({ success: true, message: "Password बदलला." });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
