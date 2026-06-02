"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { SuperAdminProvider, useSuperAdmin } from "@/context/SuperAdminContext";

function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isAuthenticated, isLoading, logout } = useSuperAdmin();
  const [open, setOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Sidebar admin={admin} onLogout={logout} open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-[48px] rounded-lg bg-slate-900 px-4 text-[18px] font-bold text-white lg:hidden"
          >
            ☰ Menu
          </button>
          <div>
            <div className="text-[22px] font-extrabold">Platform Management</div>
            <div className="text-[14px] font-semibold text-slate-500">{pathname}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/notification-center"
              className="flex min-h-[48px] items-center justify-center rounded-lg bg-yellow-100 px-4 text-[16px] font-extrabold text-yellow-900 ring-1 ring-yellow-200 hover:bg-yellow-200"
            >
              🔔 Notifications
            </Link>
            <div className="hidden text-right lg:block">
              <div className="text-[18px] font-extrabold">{admin?.name}</div>
              <div className="text-[14px] font-semibold text-slate-500">{admin?.email}</div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
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
