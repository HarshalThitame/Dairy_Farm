"use client";

import { usePathname } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

export default function AppFooter() {
  const pathname = usePathname();

  if (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/welcome" ||
    pathname.startsWith("/welcome/") ||
    pathname === "/admin-login" ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pb-28 pt-2 text-center sm:px-6">
      <p className="text-[18px] font-extrabold text-slate-700">🐄 {APP_NAME}</p>
      <p className="mt-1 text-[16px] font-bold text-slate-500">{APP_TAGLINE}</p>
    </footer>
  );
}
