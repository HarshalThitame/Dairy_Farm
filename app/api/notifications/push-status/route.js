import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { userId, farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_push_subscriptions")
      .select("id,is_active,last_seen_at,user_agent")
      .eq("user_id", userId)
      .eq("farm_id", farmId)
      .eq("is_active", true)
      .order("last_seen_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    const subscriptions = data || [];

    return NextResponse.json({
      success: true,
      vapidPublicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      vapidPrivateKeyConfigured: Boolean(process.env.VAPID_PRIVATE_KEY),
      activeSubscriptions: subscriptions.length,
      latestSubscriptionSeenAt: subscriptions[0]?.last_seen_at || null,
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        lastSeenAt: subscription.last_seen_at,
        userAgent: subscription.user_agent || ""
      }))
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
