import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  DEFAULT_APPEARANCE,
  getOrCreateAppearancePreferences,
  logUserSettingsAction,
  normalizeAppearancePreferences
} from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowed = {
  theme_mode: ["light", "dark", "system"],
  font_size: ["small", "medium", "large"],
  language: ["mr", "en", "hi"],
  default_page: ["dashboard", "ai_assistant", "milk_reports", "slip_scanner", "analytics"]
};

function normalizePayload(body = {}, current = {}) {
  const payload = { ...DEFAULT_APPEARANCE, ...current };
  for (const key of Object.keys(allowed)) {
    if (body[key] !== undefined && allowed[key].includes(body[key])) {
      payload[key] = body[key];
    }
  }
  for (const key of ["compact_mode", "high_contrast", "large_touch_targets", "reduce_animations"]) {
    if (body[key] !== undefined) {
      payload[key] = Boolean(body[key]);
    }
  }
  return payload;
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const prefs = await getOrCreateAppearancePreferences(supabase, auth.userId, auth.farmId);
    return NextResponse.json({ preferences: normalizeAppearancePreferences(prefs) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();
    const current = await getOrCreateAppearancePreferences(supabase, auth.userId, auth.farmId);
    const next = normalizePayload(body, current);

    const { data, error } = await supabase
      .from("appearance_preferences")
      .upsert({
        user_id: auth.userId,
        farm_id: auth.farmId,
        ...next,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) throw error;
    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "appearance_settings_updated", next);
    return NextResponse.json({ preferences: normalizeAppearancePreferences(data) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
