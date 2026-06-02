import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { sendDirectPushToUser } from "@/lib/notificationCenter";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const result = await sendDirectPushToUser(supabase, userId, {
      title: "🐄 माझी डेअरी",
      body: "मोबाइल notification test यशस्वी झाला.",
      url: "/notifications",
      tag: `test-push:${userId}:${Date.now()}`
    });

    return NextResponse.json({
      success: result.delivered > 0,
      ...result,
      message: result.delivered > 0
        ? "Test notification phone panel मध्ये पाठवली."
        : "Push पाठवता आली नाही."
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
