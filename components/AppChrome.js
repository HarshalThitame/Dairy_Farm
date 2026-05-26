"use client";

import { usePathname } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import AuthRequired from "@/components/AuthRequired";
import BottomNav from "@/components/BottomNav";
import InstallBanner from "@/components/InstallBanner";
import NetworkStatusBar from "@/components/NetworkStatusBar";
import NotificationBoot from "@/components/NotificationBoot";
import ToastContainer from "@/components/Toast";
import TopHeader from "@/components/TopHeader";

function isAdminRoute(pathname) {
  return pathname === "/admin-login" || pathname.startsWith("/admin");
}

export default function AppChrome({ children }) {
  const pathname = usePathname();

  if (isAdminRoute(pathname || "")) {
    return (
      <>
        {children}
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <NetworkStatusBar />
      <TopHeader />
      <main className="safe-bottom mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6">
        <AuthRequired>{children}</AuthRequired>
      </main>
      <AppFooter />
      <NotificationBoot />
      <InstallBanner />
      <ToastContainer />
      <BottomNav />
    </>
  );
}
