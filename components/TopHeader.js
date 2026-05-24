"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function TopHeader() {
  const pathname = usePathname();
  const { farm, user, isAdmin, isFarmOwner, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return null;
  }

  const farmName = farm?.farmName || farm?.farm_name || "गोशाळा व्यवस्थापन";
  const canManage = isAdmin || isFarmOwner;

  function handleLogout() {
    if (window.confirm("लॉगआउट करायचे आहे का?")) {
      logout();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <Link
          href="/"
          className="min-w-0 text-[22px] font-extrabold leading-tight text-sheti"
        >
          <span aria-hidden="true">🐄</span>{" "}
          <span className="break-words">{farmName}</span>
        </Link>

        <div className="relative flex items-center gap-2">
          {canManage ? (
            <Link
              href="/admin"
              className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full bg-green-50 text-[24px] text-sheti active:bg-green-100"
              aria-label="व्यवस्थापक"
            >
              ⚙️
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full bg-slate-100 text-[24px] active:bg-slate-200"
            aria-label="खाते"
          >
            👤
          </button>

          {open ? (
            <div className="absolute right-0 top-[60px] w-[260px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
              <p className="text-[19px] font-extrabold text-slate-950">
                नमस्कार, {user?.name || "वापरकर्ता"}
              </p>
              <p className="mt-1 inline-flex rounded-full bg-green-50 px-3 py-1 text-[16px] font-extrabold text-sheti">
                {canManage ? "मालक" : "कामगार"}
              </p>
              <Link
                href="/admin/change-pin"
                onClick={() => setOpen(false)}
                className="mt-3 flex min-h-[52px] items-center rounded-lg px-3 text-[18px] font-extrabold text-slate-800 active:bg-slate-100"
              >
                🔑 PIN बदला
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex min-h-[52px] w-full items-center rounded-lg px-3 text-left text-[18px] font-extrabold text-red-700 active:bg-red-50"
              >
                🚪 लॉगआउट
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
