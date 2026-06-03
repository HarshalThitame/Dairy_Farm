"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cacheNotifications, getCachedNotifications } from "@/lib/localDB";
import { supabase } from "@/lib/supabase";

function getAuthToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }
  return localStorage.getItem("goshala_token") || "";
}

function getTokenClaims() {
  try {
    const token = getAuthToken();
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(window.atob(normalized));
  } catch {
    return null;
  }
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [shake, setShake] = useState(false);
  const previousUnreadCountRef = useRef(null);
  const shakeTimerRef = useRef(null);

  const applyUnreadCount = useCallback((nextCount) => {
    const normalizedCount = Number(nextCount || 0);
    const previousCount = previousUnreadCountRef.current;

    if (previousCount !== null && normalizedCount > previousCount) {
      setShake(true);
      window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = window.setTimeout(() => setShake(false), 720);
    }

    previousUnreadCountRef.current = normalizedCount;
    setUnreadCount(normalizedCount);
  }, []);

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = await getCachedNotifications();
        applyUnreadCount(cached.filter((item) => !item.readAt && !item.deletedAt).length);
        return;
      }

      const response = await fetch("/api/notifications?limit=5", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (!silent) applyUnreadCount(0);
        return;
      }
      applyUnreadCount(result.unreadCount || 0);
      await cacheNotifications(result.notifications || []);
    } catch {
      const cached = await getCachedNotifications();
      applyUnreadCount(cached.filter((item) => !item.readAt && !item.deletedAt).length);
    }
  }, [applyUnreadCount]);

  useEffect(() => {
    loadNotifications({ silent: true });
    const interval = window.setInterval(() => loadNotifications({ silent: true }), 30000);
    window.addEventListener("focus", loadNotifications);
    window.addEventListener("online", loadNotifications);
    window.addEventListener("notification-updated", loadNotifications);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(shakeTimerRef.current);
      window.removeEventListener("focus", loadNotifications);
      window.removeEventListener("online", loadNotifications);
      window.removeEventListener("notification-updated", loadNotifications);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const claims = getTokenClaims();
    if (!supabase || !claims?.userId) {
      return undefined;
    }

    const channel = supabase
      .channel(`notification-delivery-${claims.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_delivery_logs",
          filter: `user_id=eq.${claims.userId}`
        },
        () => loadNotifications({ silent: true })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  return (
    <Link
      href="/notifications"
      className={`dashboard-card relative flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full border border-yellow-300 bg-gradient-to-br from-yellow-100 via-white to-orange-50 text-[24px] shadow-[0_8px_22px_rgba(245,158,11,0.22)] ring-1 ring-yellow-100 active:bg-yellow-100 ${shake ? "notification-bell-shake" : ""}`}
      aria-label="सूचना"
      title="सूचना"
    >
      🔔
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[12px] font-black leading-none text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
