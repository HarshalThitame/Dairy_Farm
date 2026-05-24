import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  normalizeFarm,
  normalizeUser,
  signFarmToken
} from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function publicUserSelect() {
  return "id, farm_id, mobile, email, name, role, is_active, is_farm_owner, pin_hash, password_hash";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const type = body.type || "pin";
    const supabase = getSupabaseServerClient();
    let query = supabase.from("users").select(publicUserSelect());

    if (type === "password") {
      const identifier = String(body.identifier || "").trim().toLowerCase();

      if (!identifier || !body.password) {
        return NextResponse.json({ error: "ईमेल/मोबाइल आणि पासवर्ड आवश्यक आहे." }, { status: 400 });
      }

      query = identifier.includes("@")
        ? query.ilike("email", identifier)
        : query.eq("mobile", identifier);
    } else {
      const mobile = String(body.mobile || "").trim();
      const pin = String(body.pin || "").trim();

      if (!/^\d{10}$/.test(mobile) || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: "मोबाइल नंबर आणि PIN तपासा." }, { status: 400 });
      }

      query = query.eq("mobile", mobile);
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      return NextResponse.json({ error: "खाते सापडले नाही." }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "हे खाते बंद केले आहे. मालकाशी संपर्क करा." },
        { status: 403 }
      );
    }

    let valid = false;

    if (type === "password") {
      valid = Boolean(user.password_hash) && (await bcrypt.compare(String(body.password || ""), user.password_hash));
    } else {
      valid = Boolean(user.pin_hash) && (await bcrypt.compare(String(body.pin || ""), user.pin_hash));
    }

    if (!valid) {
      return NextResponse.json({ error: type === "password" ? "पासवर्ड चुकीचा आहे." : "चुकीचा PIN. पुन्हा प्रयत्न करा." }, { status: 401 });
    }

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("*")
      .eq("id", user.farm_id)
      .eq("is_active", true)
      .single();

    if (farmError || !farm) {
      return NextResponse.json({ error: "गोशाळा सापडली नाही." }, { status: 403 });
    }

    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    const token = signFarmToken(user, farm);

    return NextResponse.json({
      token,
      user: normalizeUser(user),
      farm: normalizeFarm(farm)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "लॉगिन करताना चूक झाली." },
      { status: 500 }
    );
  }
}
