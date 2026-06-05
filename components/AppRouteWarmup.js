"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const CORE_ROUTES = [
  "/",
  "/gayi",
  "/vasare",
  "/nondi",
  "/athavan",
  "/ahval",
  "/accounting/slip-scan"
];

const ROUTE_GROUPS = {
  "/": [
    "/nondi/dudh",
    "/accounting/slip-scan",
    "/accounting/expenses/new",
    "/ahval/dudh",
    "/ahval/hishob"
  ],
  "/gayi": ["/gayi/navi", "/nondi/ai", "/nondi/vyayan", "/vasare"],
  "/vasare": ["/gayi", "/nondi/vyayan"],
  "/nondi": ["/nondi/dudh", "/nondi/ai", "/nondi/vyayan", "/nondi/arogya", "/nondi/lasikaran", "/nondi/chara"],
  "/athavan": ["/nondi/ai", "/nondi/vyayan", "/nondi/lasikaran", "/nondi/arogya", "/vasare"],
  "/ahval": ["/ahval/dudh", "/ahval/utpanna", "/ahval/kharch", "/ahval/nafa", "/ahval/hishob", "/ahval/varshik"],
  "/accounting": ["/accounting/slip-scan", "/accounting/dairy-slips", "/accounting/settlements", "/accounting/profit"],
  "/accounting/slip-scan": ["/accounting/slip-scan/camera", "/accounting/slip-scan/upload"]
};

function routesForPath(pathname = "") {
  const matchingGroup = Object.entries(ROUTE_GROUPS)
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] || [];

  return Array.from(new Set([...CORE_ROUTES, ...matchingGroup])).filter((route) => route !== pathname);
}

export default function AppRouteWarmup() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (pathname === "/login" || pathname.startsWith("/admin")) return undefined;

    const routes = routesForPath(pathname);
    let cancelled = false;

    const prefetchRoutes = () => {
      routes.forEach((route, index) => {
        window.setTimeout(() => {
          if (!cancelled) {
            router.prefetch(route);
          }
        }, index * 45);
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(prefetchRoutes, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pathname, router]);

  return null;
}
