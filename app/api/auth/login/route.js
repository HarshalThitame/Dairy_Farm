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
  return "id, farm_id, mobile, email, name, role, is_active, is_farm_owner, pin_hash";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const mobile = String(body.mobile || "").replace(/\D/g, "");
    const pin = String(body.pin || "").trim();
    const supabase = getSupabaseServerClient();

    if (!/^\d{10}$/.test(mobile) || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "मोबाइल नंबर आणि PIN तपासा." }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(publicUserSelect())
      .eq("mobile", mobile)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "खाते सापडले नाही." }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "हे खाते बंद केले आहे. मालकाशी संपर्क करा." },
        { status: 403 }
      );
    }

    const valid = Boolean(user.pin_hash) && (await bcrypt.compare(pin, user.pin_hash));

    if (!valid) {
      return NextResponse.json({ error: "चुकीचा PIN. पुन्हा प्रयत्न करा." }, { status: 401 });
    }

    const { data: farm, error: farmError } = await supabase
      .from("farms")
      .select("*")
      .eq("id", user.farm_id)
      .single();

    if (farmError || !farm) {
      return NextResponse.json({ error: "डेअरी सापडली नाही." }, { status: 403 });
    }

    if (!farm.is_active) {
      return NextResponse.json(
        {
          error: `तुमचे खाते स्थगित केले आहे. ${
            farm.suspended_reason || "कृपया सहाय्याशी संपर्क करा."
          }`
        },
        { status: 403 }
      );
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
