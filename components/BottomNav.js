"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PendingSyncBadge from "@/components/PendingSyncBadge";

const tabs = [
  { href: "/", icon: "🏠", label: "मुख्यपृष्ठ" },
  { href: "/gayi", icon: "🐄", label: "गायी" },
  { href: "/nondi", icon: "📋", label: "नोंदी" },
  { href: "/athavan", icon: "🔔", label: "आठवण" },
  { href: "/ahval", icon: "📊", label: "अहवाल" },
  { href: "/accounting", icon: "💰", label: "हिशोब" }
];

function isActive(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
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
    <nav className="bottom-nav-padding pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-transparent px-2 pb-2">
      <div className="pointer-events-auto mx-auto grid min-h-[82px] max-w-3xl grid-cols-6 gap-1 rounded-lg border border-white/80 bg-white/90 p-1.5 shadow-[0_-14px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={[
                "relative flex min-h-[66px] flex-col items-center justify-center rounded-lg px-0.5 text-center text-[15px] font-bold leading-tight transition",
                active
                  ? "bg-gradient-to-b from-green-100 to-white text-sheti shadow-sm ring-1 ring-green-200"
                  : "text-slate-700 active:bg-slate-100"
              ].join(" ")}
            >
              {tab.href === "/nondi" ? <PendingSyncBadge /> : null}
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[20px] leading-none ${
                active ? "bg-white shadow-sm" : "bg-slate-50"
              }`} aria-hidden="true">
                {tab.icon}
              </span>
              <span className="mt-1 text-[15px] font-extrabold leading-tight [overflow-wrap:anywhere]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
