export const DEFAULT_NOTIFICATION_CATEGORIES = {
  daily_reminder: true,
  milk_entry_reminder: true,
  slip_upload_reminder: true,
  subscription_reminder: true,
  system_updates: true,
  ai_assistant_updates: true,
  promotional_notifications: false,
  support_messages: true
};

export const DEFAULT_NOTIFICATION_CHANNELS = {
  in_app: true,
  push: true,
  email: false,
  whatsapp: false,
  sms: false
};

export const DEFAULT_APPEARANCE = {
  theme_mode: "system",
  font_size: "medium",
  language: "mr",
  default_page: "dashboard",
  compact_mode: false,
  high_contrast: false,
  large_touch_targets: true,
  reduce_animations: false
};

export function getRequestIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

export function parseDevice(userAgent = "") {
  const ua = String(userAgent || "");
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("SamsungBrowser")
      ? "Samsung Internet"
      : ua.includes("Chrome")
        ? "Chrome"
        : ua.includes("Safari")
          ? "Safari"
          : "Browser";
  const os = ua.includes("Android")
    ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad")
      ? "iOS"
      : ua.includes("Windows")
        ? "Windows"
        : ua.includes("Linux")
          ? "Linux"
          : "Unknown";
  const mobileMatch = ua.match(/\(([^)]+)\)/);
  const deviceName = os === "Android"
    ? (mobileMatch?.[1]?.split(";").map((item) => item.trim()).slice(-1)[0] || "Android Phone")
    : os === "iOS"
      ? "iPhone / iPad"
      : `${os} Device`;

  return { deviceName, browser, os };
}

export function normalizeNotificationPreferences(row = {}) {
  return {
    categories: { ...DEFAULT_NOTIFICATION_CATEGORIES, ...(row.categories || {}) },
    channels: { ...DEFAULT_NOTIFICATION_CHANNELS, ...(row.channels || {}) },
    quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
    quiet_hours_start: row.quiet_hours_start || "22:00",
    quiet_hours_end: row.quiet_hours_end || "06:00",
    frequency: ["instant", "daily", "weekly"].includes(row.frequency) ? row.frequency : "instant"
  };
}

export function normalizeAppearancePreferences(row = {}) {
  return {
    ...DEFAULT_APPEARANCE,
    ...Object.fromEntries(
      Object.entries(row || {}).filter(([, value]) => value !== undefined && value !== null)
    )
  };
}

export async function logUserSettingsAction(supabase, request, userId, farmId, action, details = {}) {
  try {
    await supabase.from("user_settings_audit_logs").insert({
      user_id: userId,
      farm_id: farmId,
      action,
      details,
      ip_address: getRequestIp(request),
      user_agent: request.headers.get("user-agent") || ""
    });
  } catch {
    // Audit logging should not block the user action.
  }
}

export async function getOrCreateNotificationPreferences(supabase, userId, farmId) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (data) {
    return data;
  }

  const { data: created, error: createError } = await supabase
    .from("notification_preferences")
    .insert({
      user_id: userId,
      farm_id: farmId,
      categories: DEFAULT_NOTIFICATION_CATEGORIES,
      channels: DEFAULT_NOTIFICATION_CHANNELS
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }
  return created;
}

export async function getOrCreateAppearancePreferences(supabase, userId, farmId) {
  const { data, error } = await supabase
    .from("appearance_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (data) {
    return data;
  }

  const { data: created, error: createError } = await supabase
    .from("appearance_preferences")
    .insert({
      user_id: userId,
      farm_id: farmId,
      ...DEFAULT_APPEARANCE
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }
  return created;
}
