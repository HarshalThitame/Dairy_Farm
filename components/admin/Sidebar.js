"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";

const items = [
  { href: "/admin", icon: "📊", label: "Dashboard" },
  { href: "/admin/farms", icon: "🏠", label: "All Farms" },
  { href: "/admin/users", icon: "👥", label: "All Users" },
  { href: "/admin/analytics", icon: "📈", label: "Analytics" },
  { href: "/admin/activity", icon: "📋", label: "Activity Log" },
  { href: "/admin/settings", icon: "⚙️", label: "Settings" }
];

function isActive(pathname, href) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ admin, onLogout, open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="border-b border-slate-200 px-5 py-5">
          <BrandLockup size="sm" />
          <div className="mt-1 text-[16px] font-semibold text-slate-500">Smart Dairy Platform</div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "flex min-h-[52px] items-center gap-3 rounded-lg px-4 text-[18px] font-bold transition",
                  active ? "bg-green-100 text-green-800" : "text-slate-700 hover:bg-slate-100"
                ].join(" ")}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 rounded-lg bg-slate-50 p-3">
            <div className="text-[18px] font-extrabold text-slate-950">{admin?.name || "Admin"}</div>
            <div className="break-all text-[14px] font-semibold text-slate-500">{admin?.email}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[52px] w-full rounded-lg bg-red-600 px-4 text-[18px] font-extrabold text-white"
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
