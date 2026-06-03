"use client";

import { useEffect } from "react";

const TOKEN_KEY = "goshala_token";
const STORAGE_KEY = "majhi_dairy_appearance";

const defaultPreferences = {
  theme_mode: "light",
  font_size: "medium",
  language: "mr",
  default_page: "dashboard",
  compact_mode: false,
  high_contrast: false,
  large_touch_targets: true,
  reduce_animations: false
};

export function applyAppearancePreferences(preferences = {}) {
  if (typeof document === "undefined") return;

  const next = { ...defaultPreferences, ...preferences };
  const root = document.documentElement;
  const body = document.body;
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const darkMode = next.theme_mode === "dark" || (next.theme_mode === "system" && prefersDark);
  const fontScale = next.font_size === "large" ? "1.12" : next.font_size === "small" ? "0.92" : "1";

  root.classList.toggle("majhi-theme-dark", darkMode);
  root.dataset.theme = darkMode ? "dark" : "light";
  root.style.colorScheme = darkMode ? "dark" : "light";
  root.style.setProperty("--majhi-font-scale", fontScale);
  body?.classList.toggle("majhi-theme-dark", darkMode);
  root.classList.toggle("majhi-font-small", next.font_size === "small");
  root.classList.toggle("majhi-font-large", next.font_size === "large");
  root.classList.toggle("majhi-compact", Boolean(next.compact_mode));
  root.classList.toggle("majhi-high-contrast", Boolean(next.high_contrast));
  root.classList.toggle("majhi-large-touch", Boolean(next.large_touch_targets));
  root.classList.toggle("majhi-reduce-motion", Boolean(next.reduce_animations));
  root.lang = next.language === "en" ? "en-IN" : next.language === "hi" ? "hi-IN" : "mr-IN";

  const themeColor = darkMode ? "#020617" : "#16a34a";
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement("meta");
    metaTheme.setAttribute("name", "theme-color");
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute("content", themeColor);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local storage is optional.
  }
}

function readLocalPreferences() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export default function AppearanceBoot() {
  useEffect(() => {
    const local = readLocalPreferences();
    if (local) {
      applyAppearancePreferences(local);
    }

    let cancelled = false;
    const handleSystemTheme = () => {
      const latest = readLocalPreferences() || defaultPreferences;
      if (latest?.theme_mode === "system") {
        applyAppearancePreferences(latest);
      }
    };
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", handleSystemTheme);

    const token = getToken();
    if (token && navigator.onLine) {
      fetch("/api/settings/appearance", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((response) => response.json().then((json) => ({ ok: response.ok, json })))
        .then(({ ok, json }) => {
          if (!cancelled && ok && json.preferences) {
            applyAppearancePreferences(json.preferences);
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      media?.removeEventListener?.("change", handleSystemTheme);
    };
  }, []);

  return null;
}
