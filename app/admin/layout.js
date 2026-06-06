"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { installAdminSessionRedirectInterceptor } from "@/lib/adminSession";
import { SuperAdminProvider, useSuperAdmin } from "@/context/SuperAdminContext";

function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAuthenticated, isLoading, logout } = useSuperAdmin();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    installAdminSessionRedirectInterceptor();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/admin-login?from=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-[20px] font-extrabold text-slate-700">
        Loading admin portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <Sidebar admin={admin} onLogout={logout} open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-sm lg:flex-nowrap lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-[48px] shrink-0 rounded-lg bg-slate-900 px-4 text-[18px] font-bold text-white lg:hidden"
          >
            ☰ Menu
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[20px] font-extrabold sm:text-[22px]">Platform Management</div>
            <div className="truncate text-[14px] font-semibold text-slate-500">{pathname}</div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/admin/notification-center"
              aria-label="Notifications"
              className="flex min-h-[48px] items-center justify-center rounded-lg bg-yellow-100 px-3 text-[16px] font-extrabold text-yellow-900 ring-1 ring-yellow-200 hover:bg-yellow-200 sm:px-4"
            >
              <span aria-hidden="true">🔔</span>
              <span className="hidden sm:ml-2 sm:inline">Notifications</span>
            </Link>
            <div className="hidden text-right lg:block">
              <div className="text-[18px] font-extrabold">{admin?.name}</div>
              <div className="text-[14px] font-semibold text-slate-500">{admin?.email}</div>
            </div>
          </div>
        </header>
        <main className="min-w-0 max-w-full overflow-x-hidden p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <SuperAdminProvider>
      <AdminShell>{children}</AdminShell>
    </SuperAdminProvider>
  );
}
