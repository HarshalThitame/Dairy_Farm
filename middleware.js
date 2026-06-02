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

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("goshala_token")?.value;
  const adminToken = request.cookies.get("super_admin_token")?.value;
  const authorization = request.headers.get("authorization") || "";
  const adminAuthorization = authorization.startsWith("Bearer ");

  if (isPublic(pathname)) {
    if (pathname === "/admin-login" && (adminToken || adminAuthorization)) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }

    if ((pathname === "/login" || pathname === "/signup") && (token || authorization.startsWith("Bearer "))) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    if (adminToken || adminAuthorization) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (adminToken || adminAuthorization) {
      return NextResponse.next();
    }

    const adminLoginUrl = request.nextUrl.clone();
    adminLoginUrl.pathname = "/admin-login";
    adminLoginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(adminLoginUrl);
  }

  if (token || authorization.startsWith("Bearer ")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "लॉगिन आवश्यक आहे." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
