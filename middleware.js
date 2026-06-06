import { NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/signup",
  "/admin-login",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/check-mobile",
  "/api/admin/auth/login",
  "/manifest.json",
  "/sw.js",
  "/push-sw.js",
  "/sw-sync.js"
];

function isPublic(pathname) {
  return (
    publicPaths.includes(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/workbox-")
  );
}

function withDeviceHintHeaders(response) {
  response.headers.set("Accept-CH", "Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Mobile, Sec-CH-UA-Full-Version-List");
  response.headers.set("Critical-CH", "Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version");
  response.headers.set("Permissions-Policy", "ch-ua-model=(self), ch-ua-platform=(self), ch-ua-platform-version=(self), ch-ua-mobile=(self), ch-ua-full-version-list=(self)");
  response.headers.set("Vary", "Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Mobile, Sec-CH-UA-Full-Version-List");
  return response;
}

function safeDecodeJwtPayload(token) {
  try {
    const [, payloadPart] = String(token || "").split(".");
    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(globalThis.atob(padded));
  } catch {
    return null;
  }
}

function isJwtExpired(token, clockSkewSeconds = 30) {
  const payload = safeDecodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + clockSkewSeconds * 1000;
}

function clearAdminCookie(response) {
  response.cookies.set("super_admin_token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax"
  });
  return response;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("goshala_token")?.value;
  const adminToken = request.cookies.get("super_admin_token")?.value;
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const hasUserAuth = Boolean(token || bearerToken);
  const adminAuthorization = Boolean(bearerToken);
  const hasValidAdminAuth = Boolean(
    (adminToken && !isJwtExpired(adminToken)) ||
      (adminAuthorization && !isJwtExpired(bearerToken))
  );
  const hasExpiredAdminCookie = Boolean(adminToken && isJwtExpired(adminToken));

  if (isPublic(pathname)) {
    if (pathname === "/admin-login") {
      if (hasValidAdminAuth) {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = "/admin";
        adminUrl.search = "";
        return withDeviceHintHeaders(NextResponse.redirect(adminUrl));
      }

      if (hasExpiredAdminCookie) {
        return withDeviceHintHeaders(clearAdminCookie(NextResponse.next()));
      }
    }

    if ((pathname === "/login" || pathname === "/signup") && hasUserAuth) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return withDeviceHintHeaders(NextResponse.redirect(homeUrl));
    }

    return withDeviceHintHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/admin/")) {
    if (hasValidAdminAuth) {
      return withDeviceHintHeaders(NextResponse.next());
    }

    const response = NextResponse.json({ error: "Unauthorized", code: "ADMIN_SESSION_EXPIRED" }, { status: 401 });
    return withDeviceHintHeaders(hasExpiredAdminCookie ? clearAdminCookie(response) : response);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (hasValidAdminAuth) {
      return withDeviceHintHeaders(NextResponse.next());
    }

    const adminLoginUrl = request.nextUrl.clone();
    adminLoginUrl.pathname = "/admin-login";
    adminLoginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(adminLoginUrl);
    return withDeviceHintHeaders(hasExpiredAdminCookie ? clearAdminCookie(response) : response);
  }

  if (!pathname.startsWith("/api/")) {
    return withDeviceHintHeaders(NextResponse.next());
  }

  if (hasUserAuth) {
    return withDeviceHintHeaders(NextResponse.next());
  }

  return withDeviceHintHeaders(NextResponse.json({ error: "लॉगिन आवश्यक आहे." }, { status: 401 }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
