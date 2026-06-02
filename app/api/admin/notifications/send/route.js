import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { sendNotificationNow } from "@/lib/notificationCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const notificationId = body.notificationId || body.id;
    if (!notificationId) {
      throw new Error("Notification ID is required.");
    }

    const supabase = getSupabaseServerClient();
    const result = await sendNotificationNow(supabase, notificationId);
    await logAdminAction(request, adminId, "sent_notification", null, {
      notificationId,
      recipientCount: result.recipientCount,
      push: result.push
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
