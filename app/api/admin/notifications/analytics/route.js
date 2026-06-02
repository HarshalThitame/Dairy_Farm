import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { getAdminNotificationAnalytics } from "@/lib/notificationCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const analytics = await getAdminNotificationAnalytics(supabase);

    const [{ data: districtLogs }, { data: farmLogs }] = await Promise.all([
      supabase
        .from("notification_delivery_logs")
        .select("opened_at, clicked_at, farms(district_name)")
        .eq("channel", "in_app")
        .limit(5000),
      supabase
        .from("notification_delivery_logs")
        .select("opened_at, clicked_at, farms(id, farm_name)")
        .eq("channel", "in_app")
        .limit(5000)
    ]);

    const districtMap = new Map();
    (districtLogs || []).forEach((log) => {
      const district = log.farms?.district_name || "Unknown";
      const row = districtMap.get(district) || { district, delivered: 0, opened: 0, clicked: 0 };
      row.delivered += 1;
      if (log.opened_at) row.opened += 1;
      if (log.clicked_at) row.clicked += 1;
      districtMap.set(district, row);
    });

    const farmMap = new Map();
    (farmLogs || []).forEach((log) => {
      const farmId = log.farms?.id || "unknown";
      const row = farmMap.get(farmId) || { farmId, farmName: log.farms?.farm_name || "Unknown", delivered: 0, opened: 0, clicked: 0 };
      row.delivered += 1;
      if (log.opened_at) row.opened += 1;
      if (log.clicked_at) row.clicked += 1;
      farmMap.set(farmId, row);
    });

    return NextResponse.json({
      ...analytics,
      districtEngagement: Array.from(districtMap.values()).sort((a, b) => b.opened - a.opened).slice(0, 20),
      farmEngagement: Array.from(farmMap.values()).sort((a, b) => b.opened - a.opened).slice(0, 20)
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
