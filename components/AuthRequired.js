"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { useUiTranslation } from "@/lib/useUiLanguage";

const publicPaths = ["/login", "/signup", "/admin-login", "/admin"];

export default function AuthRequired({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const t = useUiTranslation();
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublic) {
      const loginUrl = `/login?from=${encodeURIComponent(pathname || "/")}`;
      router.replace(loginUrl);
      const timeout = window.setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.replace(loginUrl);
        }
      }, 1200);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [isAuthenticated, isLoading, isPublic, pathname, router]);

  if (isPublic) {
    return children;
  }

  if (isLoading) {
    return <LoadingState text={t("खाते तपासत आहे...", "Checking account...")} />;
  }

  if (!isAuthenticated) {
    return <LoadingState text={t("लॉगिन पान उघडत आहे...", "Opening login page...")} />;
  }

  return children;
}
