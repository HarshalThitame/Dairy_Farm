import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const weakPins = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "4321"
]);

function validPin(pin) {
  return /^\d{4}$/.test(String(pin || ""));
}

export async function PATCH(request) {
  try {
    const { userId } = await verifyFarmAccess(request);
    const body = await request.json();
    const currentPin = String(body.currentPin || "");
    const newPin = String(body.newPin || "");

    if (!validPin(currentPin) || !validPin(newPin)) {
      return NextResponse.json({ error: "४ अंकी PIN लिहा." }, { status: 400 });
    }

    if (currentPin === newPin) {
      return NextResponse.json({ error: "नवीन PIN वेगळा असावा." }, { status: 400 });
    }

    if (weakPins.has(newPin)) {
      return NextResponse.json(
        { error: "हा PIN खूप सोपा आहे. कठीण PIN निवडा." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, pin_hash")
      .eq("id", userId)
      .single();

    if (userError || !user?.pin_hash) {
      return NextResponse.json({ error: "खाते सापडले नाही." }, { status: 404 });
    }

    const currentValid = await bcrypt.compare(currentPin, user.pin_hash);

    if (!currentValid) {
      return NextResponse.json({ error: "सध्याचा PIN चुकीचा आहे." }, { status: 401 });
    }

    const pinHash = await bcrypt.hash(newPin, Number(process.env.BCRYPT_ROUNDS || 10));
    const { error } = await supabase
      .from("users")
      .update({ pin_hash: pinHash })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "PIN यशस्वीरित्या बदलला."
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  return PATCH(request);
}
