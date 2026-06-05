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
  theme_mode: "light",
  font_size: "medium",
  language: "mr",
  default_page: "dashboard",
  compact_mode: false,
  high_contrast: false,
  large_touch_targets: true,
  reduce_animations: false
};

function normalizeTimeInputValue(value, fallback) {
  const text = String(value || fallback || "").trim();
  const match = text.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : fallback;
}

export function getRequestIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

function cleanDeviceText(value, maxLength = 120) {
  return String(value || "")
    .replace(/^"|"$/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function headerValue(headers, key) {
  if (!headers || typeof headers.get !== "function") return "";
  return cleanDeviceText(headers.get(key) || "");
}

function firstNonEmpty(...values) {
  return values.map((value) => cleanDeviceText(value)).find(Boolean) || "";
}

function parseBrowserVersion(userAgent = "", browser = "") {
  const ua = String(userAgent || "");
  const patterns = {
    Edge: /Edg\/([\d.]+)/,
    "Samsung Internet": /SamsungBrowser\/([\d.]+)/,
    Chrome: /(?:Chrome|CriOS)\/([\d.]+)/,
    Safari: /Version\/([\d.]+).*Safari/,
    Firefox: /Firefox\/([\d.]+)/
  };
  return cleanDeviceText(ua.match(patterns[browser])?.[1] || "");
}

function parseAndroidModel(userAgent = "") {
  const ua = String(userAgent || "");
  const androidSegment = ua.match(/\(([^)]*Android[^)]*)\)/)?.[1] || "";
  if (!androidSegment) return "";
  const parts = androidSegment
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
  const modelPart = parts.findLast?.((item) => !/^Linux$/i.test(item) && !/^U$/i.test(item) && !/^Android\b/i.test(item) && !/^wv$/i.test(item))
    || parts[parts.length - 1]
    || "";
  return cleanDeviceText(modelPart.replace(/\s+Build\/.*$/i, ""));
}

function inferDeviceType(userAgent = "", os = "", clientInfo = {}) {
  const ua = String(userAgent || "");
  if (clientInfo.deviceType) return cleanDeviceText(clientInfo.deviceType, 30);
  if (clientInfo.mobile === true || /Mobile|Android|iPhone|iPod/i.test(ua)) return "mobile";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (os === "Android" && !/Mobile/i.test(ua)) return "tablet";
  return "desktop";
}

export function parseDevice(userAgent = "", clientInfo = {}, headers = null) {
  const ua = String(userAgent || "");
  const highEntropy = clientInfo && typeof clientInfo === "object" ? clientInfo : {};
  const browser = highEntropy.browser
    ? cleanDeviceText(highEntropy.browser, 60)
    : ua.includes("Edg/")
    ? "Edge"
    : ua.includes("SamsungBrowser")
      ? "Samsung Internet"
      : ua.includes("Chrome") || ua.includes("CriOS")
        ? "Chrome"
        : ua.includes("Firefox")
          ? "Firefox"
        : ua.includes("Safari")
          ? "Safari"
          : "Browser";
  const os = highEntropy.platform
    ? cleanDeviceText(highEntropy.platform, 60)
    : ua.includes("Android")
    ? "Android"
    : ua.includes("iPhone") || ua.includes("iPad")
      ? "iOS"
      : ua.includes("Windows")
        ? "Windows"
        : ua.includes("Linux")
          ? "Linux"
          : "Unknown";
  const clientModel = firstNonEmpty(
    highEntropy.model,
    highEntropy.deviceModel,
    headerValue(headers, "sec-ch-ua-model")
  );
  const clientBrand = firstNonEmpty(
    highEntropy.brand,
    highEntropy.deviceBrand,
    Array.isArray(highEntropy.brands) ? highEntropy.brands.find((item) => !/Chromium|Not/i.test(item?.brand))?.brand : ""
  );
  const androidModel = parseAndroidModel(ua);
  const deviceModel = firstNonEmpty(clientModel, androidModel);
  const deviceBrand = firstNonEmpty(clientBrand, os === "iOS" ? "Apple" : "");
  const deviceType = inferDeviceType(ua, os, highEntropy);
  const platformVersion = firstNonEmpty(highEntropy.platformVersion, headerValue(headers, "sec-ch-ua-platform-version"));
  const browserVersion = firstNonEmpty(highEntropy.browserVersion, highEntropy.uaFullVersion, parseBrowserVersion(ua, browser));
  const iosDevice = ua.includes("iPad") ? "iPad" : "iPhone";
  const deviceName = highEntropy.deviceName
    ? cleanDeviceText(highEntropy.deviceName)
    : os === "Android"
      ? firstNonEmpty(deviceBrand && deviceModel ? `${deviceBrand} ${deviceModel}` : "", deviceModel, "Android Phone")
      : os === "iOS"
        ? iosDevice
        : `${os} Device`;

  return {
    deviceName,
    browser,
    os,
    deviceBrand: deviceBrand || null,
    deviceModel: deviceModel || null,
    deviceType,
    platformVersion: platformVersion || null,
    browserVersion: browserVersion || null,
    clientHints: Object.fromEntries(
      Object.entries({
        model: deviceModel || null,
        brand: deviceBrand || null,
        platform: os || null,
        platformVersion: platformVersion || null,
        browserVersion: browserVersion || null,
        mobile: Boolean(highEntropy.mobile)
      }).filter(([, value]) => value !== null && value !== "")
    )
  };
}

export function normalizeNotificationPreferences(row = {}) {
  return {
    categories: { ...DEFAULT_NOTIFICATION_CATEGORIES, ...(row.categories || {}) },
    channels: { ...DEFAULT_NOTIFICATION_CHANNELS, ...(row.channels || {}) },
    quiet_hours_enabled: Boolean(row.quiet_hours_enabled),
    quiet_hours_start: normalizeTimeInputValue(row.quiet_hours_start, "22:00"),
    quiet_hours_end: normalizeTimeInputValue(row.quiet_hours_end, "06:00"),
    frequency: ["instant", "daily", "weekly"].includes(row.frequency) ? row.frequency : "instant"
  };
}

export function normalizeAppearancePreferences(row = {}) {
  const source = row && typeof row === "object" && !Array.isArray(row) ? row : {};
  return {
    theme_mode: ["light", "dark", "system"].includes(source.theme_mode) ? source.theme_mode : DEFAULT_APPEARANCE.theme_mode,
    font_size: ["small", "medium", "large"].includes(source.font_size) ? source.font_size : DEFAULT_APPEARANCE.font_size,
    language: ["mr", "en", "hi"].includes(source.language) ? source.language : DEFAULT_APPEARANCE.language,
    default_page: ["dashboard", "ai_assistant", "milk_reports", "slip_scanner", "analytics"].includes(source.default_page)
      ? source.default_page
      : DEFAULT_APPEARANCE.default_page,
    compact_mode: Boolean(source.compact_mode),
    high_contrast: Boolean(source.high_contrast),
    large_touch_targets: source.large_touch_targets !== false,
    reduce_animations: Boolean(source.reduce_animations)
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
