"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);
const TOKEN_KEY = "goshala_token";
const USER_KEY = "goshala_user";
const FARM_KEY = "goshala_farm";
const VERIFIED_AT_KEY = "goshala_auth_verified_at";
const AUTH_TIMEOUT_MS = 8000;
const AUTH_VERIFY_TTL_MS = 5 * 60 * 1000;
const memorySession = {
  token: "",
  user: null,
  farm: null,
  verifiedAt: 0
};

async function fetchWithTimeout(url, options = {}, timeoutMs = AUTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      credentials: options.credentials || "same-origin",
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

function readJson(key) {
  if (typeof localStorage === "undefined") {
    if (key === USER_KEY) return memorySession.user;
    if (key === FARM_KEY) return memorySession.farm;
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    if (key === USER_KEY) return memorySession.user;
    if (key === FARM_KEY) return memorySession.farm;
    return null;
  }
}

function getCookieToken() {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${TOKEN_KEY}=`));

  return cookie ? decodeURIComponent(cookie.slice(TOKEN_KEY.length + 1)) : "";
}

function setAuthCookie(token) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax${secure}`;
}

function clearAuthCookie() {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

function storeSession(token, user, farm) {
  memorySession.token = token;
  memorySession.user = user;
  memorySession.farm = farm;
  memorySession.verifiedAt = Date.now();

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(FARM_KEY, JSON.stringify(farm));
      localStorage.setItem(VERIFIED_AT_KEY, String(Date.now()));
    } catch {
      // iOS can temporarily reject Web Storage in standalone/private contexts.
      // Cookie + in-memory state still keep the current session usable.
    }
  }

  setAuthCookie(token);
}

function clearSession() {
  memorySession.token = "";
  memorySession.user = null;
  memorySession.farm = null;
  memorySession.verifiedAt = 0;

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(FARM_KEY);
      localStorage.removeItem(VERIFIED_AT_KEY);
    } catch {
      // Ignore storage errors.
    }
  }

  clearAuthCookie();
}

function isRecentlyVerified() {
  if (typeof localStorage === "undefined") {
    return memorySession.verifiedAt > 0 && Date.now() - memorySession.verifiedAt < AUTH_VERIFY_TTL_MS;
  }

  let verifiedAt = memorySession.verifiedAt;
  try {
    verifiedAt = Number(localStorage.getItem(VERIFIED_AT_KEY) || verifiedAt || 0);
  } catch {
    verifiedAt = memorySession.verifiedAt;
  }
  return verifiedAt > 0 && Date.now() - verifiedAt < AUTH_VERIFY_TTL_MS;
}

function getStoredToken() {
  if (typeof localStorage === "undefined") {
    return memorySession.token || getCookieToken();
  }

  try {
    return localStorage.getItem(TOKEN_KEY) || memorySession.token || getCookieToken();
  } catch {
    return memorySession.token || getCookieToken();
  }
}

async function postAuth(url, body) {
  const response = await fetchWithTimeout(url, {
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

  const signup = useCallback(
    async (signupData) => {
      try {
        const result = await postAuth("/api/auth/signup", signupData);
        applySession(result.token, result.user, result.farm);

        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("onboarding_completed");
        }

        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message || "नोंदणी करताना त्रुटी झाली." };
      }
    },
    [applySession]
  );

  const checkAuth = useCallback(async () => {
    let storedUser = null;
    let storedFarm = null;
    try {
      const token = getStoredToken();
      storedUser = readJson(USER_KEY);
      storedFarm = readJson(FARM_KEY);

      if (!token) {
        setUser(null);
        setFarm(null);
        return false;
      }

      if (storedUser && storedFarm) {
        setUser(storedUser);
        setFarm(storedFarm);
        setIsLoading(false);
      }

      if (storedUser && storedFarm && isRecentlyVerified()) {
        setAuthCookie(token);
        return true;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return Boolean(storedUser && storedFarm);
      }

      const response = await fetchWithTimeout("/api/auth/verify", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.valid) {
        clearSession();
        setUser(null);
        setFarm(null);
        return false;
      }

      applySession(token, result.user, result.farm);
      return true;
    } catch {
      if (storedUser && storedFarm) {
        setUser(storedUser);
        setFarm(storedFarm);
        return true;
      }

      clearSession();
      setUser(null);
      setFarm(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applySession]);

  const refreshFarm = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      return null;
    }

    const response = await fetchWithTimeout("/api/farms/current", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "डेअरीची माहिती मिळाली नाही.");
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
      loginWithPin,
      signup,
      checkAuth,
      refreshFarm,
      logout
    }),
    [checkAuth, farm, isLoading, loginWithPin, logout, refreshFarm, signup, user]
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
