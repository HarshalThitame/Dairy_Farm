import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { sendDirectPushToUser } from "@/lib/notificationCenter";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const result = await sendDirectPushToUser(supabase, auth.userId, {
      title: "📢 माझी डेअरी सूचना",
      body: "ही चाचणी सूचना आहे. तुमच्या सूचना व्यवस्थित चालू आहेत.",
      url: "/notifications",
      tag: `test-notification:${Date.now()}`
    });

    return NextResponse.json({
      success: result.delivered > 0,
      push: result,
      message: result.delivered > 0
        ? "चाचणी सूचना पाठवली."
        : "Push subscription सापडली नाही. Mobile notification चालू करा."
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
