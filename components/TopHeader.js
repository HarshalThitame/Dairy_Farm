"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandLockup from "@/components/BrandLockup";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/context/AuthContext";

export default function TopHeader() {
  const pathname = usePathname();
  const { farm, user, isAdmin, isFarmOwner, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  const farmName = farm?.farmName || farm?.farm_name || "";
  const canManage = isAdmin || isFarmOwner;

  function handleLogout() {
    if (window.confirm("लॉगआउट करायचे आहे का?")) {
      setOpen(false);
      logout();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <Link href="/" className="dashboard-card min-w-0 rounded-lg px-2 py-1 active:opacity-80" aria-label="माझी डेअरी मुख्यपृष्ठ">
          <BrandLockup size="sm" />
          {farmName ? (
            <p className="mt-1 truncate pl-10 text-[15px] font-bold leading-tight text-slate-500">
              {farmName}
            </p>
          ) : null}
        </Link>

        <div ref={profileMenuRef} className="relative flex items-center gap-2">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="dashboard-card flex min-h-[52px] min-w-[52px] items-center justify-center overflow-hidden rounded-full border border-green-100 bg-gradient-to-br from-green-50 to-white text-[24px] shadow-sm active:bg-green-100"
            aria-label="खाते"
          >
            {user?.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profilePhotoUrl} alt={user?.name || "Profile"} className="h-[52px] w-[52px] object-cover" />
            ) : (
              "👤"
            )}
          </button>

          {open ? (
            <div className="absolute right-0 top-[60px] w-[270px] rounded-lg border border-white/80 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
              <p className="text-[19px] font-extrabold text-slate-950">
                नमस्कार, {user?.name || "वापरकर्ता"}
              </p>
              <p className="mt-1 inline-flex rounded-full bg-green-50 px-3 py-1 text-[16px] font-extrabold text-sheti">
                {canManage ? "मालक" : "कामगार"}
              </p>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="mt-3 flex min-h-[52px] items-center rounded-lg px-3 text-[18px] font-extrabold text-slate-800 active:bg-slate-100"
              >
                👤 माझी माहिती
              </Link>
              <Link
                href="/profile/change-pin"
                onClick={() => setOpen(false)}
                className="mt-1 flex min-h-[52px] items-center rounded-lg px-3 text-[18px] font-extrabold text-slate-800 active:bg-slate-100"
              >
                🔑 PIN बदला
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="mt-1 flex min-h-[52px] items-center rounded-lg px-3 text-[18px] font-extrabold text-slate-800 active:bg-green-50"
              >
                ⚙️ सेटिंग्ज
              </Link>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="mt-1 flex min-h-[52px] items-center rounded-lg px-3 text-[18px] font-extrabold text-slate-800 active:bg-yellow-50"
              >
                🔔 सूचना
              </Link>
              <Link
                href="/vasare"
                onClick={() => setOpen(false)}
                className="mt-1 flex min-h-[52px] items-center rounded-lg px-3 text-[18px] font-extrabold text-slate-800 active:bg-slate-100"
              >
                🐮 वासरे
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
