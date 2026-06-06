"use client";

const ADMIN_TOKEN_KEY = "super_admin_token";
const ADMIN_USER_KEY = "super_admin_user";

let adminRedirectInProgress = false;
let originalFetch = null;

function safeBase64UrlDecode(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return window.atob(padded);
}

function clearAdminCookie() {
  if (typeof document === "undefined") {
    return;
  }

  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_TOKEN_KEY}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

function getAdminApiPath(input) {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const url =
      typeof input === "string"
        ? new URL(input, window.location.origin)
        : input instanceof URL
          ? input
          : new URL(input?.url || "", window.location.origin);

    return url.origin === window.location.origin ? url.pathname : "";
  } catch {
    return "";
  }
}

export function clearSuperAdminBrowserSession() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_USER_KEY);
    } catch {
      // Ignore storage errors on restricted browsers.
    }
  }

  clearAdminCookie();
}

export function isAdminJwtExpired(token, clockSkewSeconds = 30) {
  if (!token || typeof window === "undefined") {
    return true;
  }

  try {
    const [, payloadPart] = token.split(".");
    if (!payloadPart) {
      return true;
    }

    const payload = JSON.parse(safeBase64UrlDecode(payloadPart));
    if (!payload?.exp) {
      return true;
    }

    return payload.exp * 1000 <= Date.now() + clockSkewSeconds * 1000;
  } catch {
    return true;
  }
}

export function redirectToAdminLogin(fromPath) {
  if (typeof window === "undefined" || adminRedirectInProgress) {
    return;
  }

  adminRedirectInProgress = true;
  clearSuperAdminBrowserSession();

  const from = fromPath || `${window.location.pathname}${window.location.search}`;
  const loginUrl = `/admin-login?from=${encodeURIComponent(from || "/admin")}`;
  window.location.replace(loginUrl);
}

export function installAdminSessionRedirectInterceptor() {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (originalFetch) {
    return () => {};
  }

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const pathname = getAdminApiPath(input);

    if (pathname.startsWith("/api/admin/") && pathname !== "/api/admin/auth/login" && response.status === 401) {
      redirectToAdminLogin();
    }

    return response;
  };

  return () => {};
}
