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

const implementedChannels = new Set(["in_app", "push"]);
const validTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function sanitizeBooleanMap(source, defaults, options = {}) {
  const incoming = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  return Object.fromEntries(
    Object.entries(defaults).map(([key, defaultValue]) => {
      if (options.implementedOnly && !implementedChannels.has(key)) {
        return [key, false];
      }
      if (Object.prototype.hasOwnProperty.call(incoming, key)) {
        return [key, incoming[key] === true];
      }
      return [key, Boolean(defaultValue)];
    })
  );
}

function cleanTime(value, fallback, hardFallback = "22:00") {
  const time = String(value || "").trim();
  if (validTimePattern.test(time)) {
    return time;
  }
  const fallbackTime = String(fallback || "").trim().slice(0, 5);
  return validTimePattern.test(fallbackTime) ? fallbackTime : hardFallback;
}

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
    const body = await request.json().catch(() => ({}));
    const safeBody = body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const supabase = getSupabaseServerClient();
    const current = await getOrCreateNotificationPreferences(supabase, auth.userId, auth.farmId);
    const currentCategories = {
      ...DEFAULT_NOTIFICATION_CATEGORIES,
      ...(current.categories || {})
    };
    const currentChannels = {
      ...DEFAULT_NOTIFICATION_CHANNELS,
      ...(current.channels || {})
    };
    const categories = sanitizeBooleanMap(
      { ...currentCategories, ...(safeBody.categories || {}) },
      DEFAULT_NOTIFICATION_CATEGORIES
    );
    const channels = sanitizeBooleanMap(
      { ...currentChannels, ...(safeBody.channels || {}) },
      DEFAULT_NOTIFICATION_CHANNELS,
      { implementedOnly: true }
    );
    const frequency = ["instant", "daily", "weekly"].includes(safeBody.frequency)
      ? safeBody.frequency
      : current.frequency || "instant";
    const payload = {
      user_id: auth.userId,
      farm_id: auth.farmId,
      categories,
      channels,
      quiet_hours_enabled: Boolean(safeBody.quiet_hours_enabled),
      quiet_hours_start: cleanTime(safeBody.quiet_hours_start, current.quiet_hours_start || "22:00", "22:00"),
      quiet_hours_end: cleanTime(safeBody.quiet_hours_end, current.quiet_hours_end || "06:00", "06:00"),
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
