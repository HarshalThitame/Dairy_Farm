import { NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/manifest.json",
  "/sw.js",
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

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("goshala_token")?.value;
  const authorization = request.headers.get("authorization") || "";

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
