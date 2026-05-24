"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/context/AuthContext";

const publicPaths = ["/login"];

export default function AuthRequired({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublic) {
      router.replace(`/login?from=${encodeURIComponent(pathname || "/")}`);
    }
  }, [isAuthenticated, isLoading, isPublic, pathname, router]);

  if (isPublic) {
    return children;
  }

  if (isLoading || !isAuthenticated) {
    return <LoadingState message="खाते तपासत आहे..." />;
  }

  return children;
}
