"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PendingSyncBadge from "@/components/PendingSyncBadge";

const tabs = [
  { href: "/", icon: "🏠", label: "मुख्यपृष्ठ" },
  { href: "/gayi", icon: "🐄", label: "गायी" },
  { href: "/nondi", icon: "📋", label: "नोंदी" },
  { href: "/athavan", icon: "🔔", label: "आठवण" },
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
    <nav className="bottom-nav-padding fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="mx-auto grid min-h-[86px] max-w-3xl grid-cols-5 gap-1 px-1 py-2">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={[
                "relative flex min-h-[68px] flex-col items-center justify-center rounded-lg px-0.5 text-center text-[18px] font-bold leading-tight transition",
                active
                  ? "bg-green-100 text-sheti"
                  : "text-slate-700 active:bg-slate-100"
              ].join(" ")}
            >
              {tab.href === "/nondi" ? <PendingSyncBadge /> : null}
              <span className="text-[22px] leading-none" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="mt-1 text-[18px] font-bold leading-tight [overflow-wrap:anywhere]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
