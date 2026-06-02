import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId, farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();
    const { data: logs, error } = await supabase
      .from("notification_delivery_logs")
      .select("id, notification_id")
      .eq("user_id", userId)
      .eq("farm_id", farmId)
      .eq("channel", "in_app")
      .is("opened_at", null)
      .is("deleted_at", null)
      .limit(1000);

    if (error) throw error;

    if ((logs || []).length) {
      await supabase
        .from("notification_delivery_logs")
        .update({ opened_at: now, delivery_status: "opened" })
        .in("id", logs.map((log) => log.id));

      await supabase.from("notification_reads").upsert(
        logs.map((log) => ({
          notification_id: log.notification_id,
          user_id: userId,
          read_at: now
        })),
        { onConflict: "notification_id,user_id" }
      );
    }

    return NextResponse.json({ success: true, marked: (logs || []).length });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
