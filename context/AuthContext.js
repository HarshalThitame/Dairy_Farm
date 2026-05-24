"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);
const TOKEN_KEY = "goshala_token";
const USER_KEY = "goshala_user";
const FARM_KEY = "goshala_farm";

function readJson(key) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function setAuthCookie(token) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${TOKEN_KEY}=${token}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function storeSession(token, user, farm) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(FARM_KEY, JSON.stringify(farm));
  setAuthCookie(token);
}

function clearSession() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(FARM_KEY);
  }

  clearAuthCookie();
}

function getStoredToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }

  return localStorage.getItem(TOKEN_KEY) || "";
}

async function postAuth(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "लॉगिन करताना चूक झाली.");
  }

  return result;
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [farm, setFarm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setFarm(null);
    router.replace("/login");
  }, [router]);

  const applySession = useCallback((token, nextUser, nextFarm) => {
    storeSession(token, nextUser, nextFarm);
    setUser(nextUser);
    setFarm(nextFarm);
  }, []);

  const login = useCallback(
    async (identifier, password) => {
      try {
        const result = await postAuth("/api/auth/login", {
          type: "password",
          identifier,
          password
        });

        applySession(result.token, result.user, result.farm);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [applySession]
  );

  const loginWithPin = useCallback(
    async (mobile, pin) => {
      try {
        const result = await postAuth("/api/auth/login", {
          type: "pin",
          mobile,
          pin
        });

        applySession(result.token, result.user, result.farm);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [applySession]
  );

  const checkAuth = useCallback(async () => {
    const token = getStoredToken();
    const storedUser = readJson(USER_KEY);
    const storedFarm = readJson(FARM_KEY);

    if (!token) {
      setUser(null);
      setFarm(null);
      setIsLoading(false);
      return false;
    }

    if (storedUser && storedFarm) {
      setUser(storedUser);
      setFarm(storedFarm);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsLoading(false);
      return Boolean(storedUser && storedFarm);
    }

    try {
      const response = await fetch("/api/auth/verify", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.valid) {
        clearSession();
        setUser(null);
        setFarm(null);
        setIsLoading(false);
        return false;
      }

      applySession(token, result.user, result.farm);
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return Boolean(storedUser && storedFarm);
    }
  }, [applySession]);

  const refreshFarm = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      return null;
    }

    const response = await fetch("/api/farms/current", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "गोशाळेची माहिती मिळाली नाही.");
    }

    setFarm(result.data);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(FARM_KEY, JSON.stringify(result.data));
    }
    return result.data;
  }, []);

  useEffect(() => {
    checkAuth();
    const interval = window.setInterval(checkAuth, 60 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [checkAuth]);

  const value = useMemo(
    () => ({
      user,
      farm,
      isLoading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      isFarmOwner: Boolean(user?.isFarmOwner),
      isSuperAdmin: Boolean(user?.isSuperAdmin),
      login,
      loginWithPin,
      checkAuth,
      refreshFarm,
      logout
    }),
    [checkAuth, farm, isLoading, login, loginWithPin, logout, refreshFarm, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
