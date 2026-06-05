"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import AppRouteWarmup from "@/components/AppRouteWarmup";
import AuthRequired from "@/components/AuthRequired";
import BottomNav from "@/components/BottomNav";
import NetworkStatusBar from "@/components/NetworkStatusBar";
import NotificationBanner from "@/components/NotificationBanner";
import ToastContainer from "@/components/Toast";
import TopHeader from "@/components/TopHeader";

const InstallBanner = dynamic(() => import("@/components/InstallBanner"), { ssr: false });
const NotificationBoot = dynamic(() => import("@/components/NotificationBoot"), { ssr: false });
const AppearanceBoot = dynamic(() => import("@/components/settings/AppearanceBoot"), { ssr: false });
const AIAssistantWidget = dynamic(() => import("@/components/ai/AIAssistantWidget"), { ssr: false });

function isAdminRoute(pathname) {
  return pathname === "/admin-login" || pathname.startsWith("/admin");
}

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const hideAssistant = ["/login", "/signup", "/welcome"].some(
    (path) => pathname === path || pathname?.startsWith(`${path}/`)
  );

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
      <main className="app-shell safe-bottom relative mx-auto min-h-screen w-full max-w-3xl px-4 pb-28 pt-5 sm:px-6">
        <AuthRequired>
          <NotificationBanner />
          <AppRouteWarmup />
          {children}
        </AuthRequired>
      </main>
      <AppFooter />
      <AppearanceBoot />
      <NotificationBoot />
      <InstallBanner />
      <ToastContainer />
      {!hideAssistant ? <AIAssistantWidget /> : null}
      <BottomNav />
    </>
  );
}
