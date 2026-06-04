"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCookieValue,
  safeGetLocalStorageItem,
  safeParseLocalStorageJson,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem
} from "@/lib/clientStorage";

const SuperAdminContext = createContext(null);
const TOKEN_KEY = "super_admin_token";
const ADMIN_KEY = "super_admin_user";

function setAdminCookie(token) {
  if (typeof document === "undefined") {
    return;
  }
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Max-Age=${60 * 60 * 12}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // Ignore cookie errors.
  }
}

function clearAdminCookie() {
  if (typeof document === "undefined") {
    return;
  }
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
  } catch {
    // Ignore cookie errors.
  }
}

function getStoredAdmin() {
  return safeParseLocalStorageJson(ADMIN_KEY, null);
}

function getStoredToken() {
  return safeGetLocalStorageItem(TOKEN_KEY, "") || getCookieValue(TOKEN_KEY);
}

function storeSession(token, admin) {
  safeSetLocalStorageItem(TOKEN_KEY, token);
  safeSetLocalStorageItem(ADMIN_KEY, JSON.stringify(admin));
  setAdminCookie(token);
}

function clearSession() {
  safeRemoveLocalStorageItem(TOKEN_KEY);
  safeRemoveLocalStorageItem(ADMIN_KEY);
  clearAdminCookie();
}

export function getSuperAdminAuthHeader() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function SuperAdminProvider({ children }) {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setAdmin(null);
    router.replace("/admin-login");
  }, [router]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { success: false, error: result.error || "Invalid credentials" };
      }

      storeSession(result.token, result.admin);
      setAdmin(result.admin);
      return { success: true, admin: result.admin };
    } catch {
      return { success: false, error: "Login failed. Try again." };
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = getStoredToken();
    const storedAdmin = getStoredAdmin();

    if (!token || !storedAdmin) {
      setAdmin(null);
      setIsLoading(false);
      return false;
    }

    setAdmin(storedAdmin);
    setAdminCookie(token);
    setIsLoading(false);
    return true;
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = useMemo(
    () => ({
      admin,
      isLoading,
      isAuthenticated: Boolean(admin),
      login,
      logout,
      checkAuth,
      getAuthHeader: getSuperAdminAuthHeader
    }),
    [admin, checkAuth, isLoading, login, logout]
  );

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>;
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);

  if (!context) {
    throw new Error("useSuperAdmin must be used inside SuperAdminProvider");
  }

  return context;
}
