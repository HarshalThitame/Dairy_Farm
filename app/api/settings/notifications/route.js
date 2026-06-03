import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  DEFAULT_NOTIFICATION_CATEGORIES,
  DEFAULT_NOTIFICATION_CHANNELS,
  getOrCreateNotificationPreferences,
  logUserSettingsAction,
  normalizeNotificationPreferences
} from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const [prefs, historyResult] = await Promise.all([
      getOrCreateNotificationPreferences(supabase, auth.userId, auth.farmId),
      supabase
        .from("notification_delivery_logs")
        .select("id, delivery_status, delivered_at, opened_at, notifications(title, message, type, priority)")
        .eq("user_id", auth.userId)
        .eq("farm_id", auth.farmId)
        .eq("channel", "in_app")
        .is("deleted_at", null)
        .order("delivered_at", { ascending: false })
        .limit(50)
    ]);

    return NextResponse.json({
      preferences: normalizeNotificationPreferences(prefs),
      history: historyResult.error ? [] : historyResult.data || []
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();
    const current = await getOrCreateNotificationPreferences(supabase, auth.userId, auth.farmId);
    const categories = {
      ...DEFAULT_NOTIFICATION_CATEGORIES,
      ...(current.categories || {}),
      ...(body.categories || {})
    };
    const channels = {
      ...DEFAULT_NOTIFICATION_CHANNELS,
      ...(current.channels || {}),
      ...(body.channels || {})
    };
    const frequency = ["instant", "daily", "weekly"].includes(body.frequency) ? body.frequency : current.frequency || "instant";
    const payload = {
      user_id: auth.userId,
      farm_id: auth.farmId,
      categories,
      channels,
      quiet_hours_enabled: Boolean(body.quiet_hours_enabled),
      quiet_hours_start: body.quiet_hours_start || "22:00",
      quiet_hours_end: body.quiet_hours_end || "06:00",
      frequency,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw error;

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "notification_settings_updated", {
      categories,
      channels,
      frequency
    });

    return NextResponse.json({ preferences: normalizeNotificationPreferences(data) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
