"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const SuperAdminContext = createContext(null);
const TOKEN_KEY = "super_admin_token";
const ADMIN_KEY = "super_admin_user";

function setAdminCookie(token) {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${TOKEN_KEY}=${token}; Max-Age=${60 * 60 * 12}; Path=/; SameSite=Lax`;
}

function clearAdminCookie() {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function getStoredAdmin() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || "null");
  } catch {
    return null;
  }
}

function getStoredToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }
  return localStorage.getItem(TOKEN_KEY) || "";
}

function storeSession(token, admin) {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  setAdminCookie(token);
}

function clearSession() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  }
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
