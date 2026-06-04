"use client";

const AUTH_TOKEN_KEY = "goshala_token";
const FARM_KEY = "goshala_farm";

export function safeGetLocalStorageItem(key, fallback = "") {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSetLocalStorageItem(key, value) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveLocalStorageItem(key) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeParseLocalStorageJson(key, fallback = null) {
  const value = safeGetLocalStorageItem(key, "");

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getCookieValue(name) {
  if (typeof document === "undefined") {
    return "";
  }

  try {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));

    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
  } catch {
    return "";
  }
}

export function getClientAuthToken() {
  return safeGetLocalStorageItem(AUTH_TOKEN_KEY, "") || getCookieValue(AUTH_TOKEN_KEY);
}

export function getClientAuthHeaders() {
  const token = getClientAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getClientStoredFarm() {
  return safeParseLocalStorageJson(FARM_KEY, null);
}
