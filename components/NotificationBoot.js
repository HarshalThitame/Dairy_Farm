"use client";

import { useEffect } from "react";
import {
  checkAndFireTodayNotifications,
  scheduleUpcomingNotifications
} from "@/lib/notifications";
import { requestAndRegisterPushSubscription } from "@/lib/pushClient";
import { useSpeechNotification } from "@/hooks/useSpeechNotification";
import { enqueueNotificationSpeech } from "@/services/notificationSpeechQueue";

const ANNOUNCED_ADMIN_NOTIFICATIONS_KEY = "majhi_dairy_announced_admin_notifications";

function getAuthToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }
  return localStorage.getItem("goshala_token") || "";
}

function readAnnouncedIds() {
  try {
    return JSON.parse(localStorage.getItem(ANNOUNCED_ADMIN_NOTIFICATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAnnouncedIds(ids) {
  localStorage.setItem(ANNOUNCED_ADMIN_NOTIFICATIONS_KEY, JSON.stringify(ids.slice(-100)));
}

export default function NotificationBoot() {
  useSpeechNotification({ listenForPushMessages: true });

  useEffect(() => {
    async function registerPushSubscription() {
      try {
        await requestAndRegisterPushSubscription({ requestPermission: false });
      } catch (error) {
        console.error("Push subscription registration failed:", error);
      }
    }

    async function pollAdminNotifications() {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          return;
        }
        const response = await fetch("/api/notifications?filter=unread&limit=3", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          return;
        }

        const announced = readAnnouncedIds();
        const next = [...announced];
        for (const notification of result.notifications || []) {
          if (announced.includes(notification.id)) {
            continue;
          }

          next.push(notification.id);
          enqueueNotificationSpeech({
            id: notification.id,
            title: notification.title,
            body: notification.message,
            tag: `admin:${notification.id}`
          });
        }
        writeAnnouncedIds(next);
        window.dispatchEvent(new CustomEvent("notification-updated"));
      } catch {
        // Polling is best effort; inbox remains available.
      }
    }

    function refreshNotifications() {
      checkAndFireTodayNotifications();
      scheduleUpcomingNotifications();
      registerPushSubscription();
      pollAdminNotifications();
    }

    refreshNotifications();

    const intervalId = window.setInterval(refreshNotifications, 30000);
    window.addEventListener("focus", refreshNotifications);
    window.addEventListener("online", refreshNotifications);
    window.addEventListener("sync-complete", refreshNotifications);
    window.addEventListener("cache-refreshed", refreshNotifications);
    window.addEventListener("notification-permission-changed", refreshNotifications);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshNotifications);
      window.removeEventListener("online", refreshNotifications);
      window.removeEventListener("sync-complete", refreshNotifications);
      window.removeEventListener("cache-refreshed", refreshNotifications);
      window.removeEventListener("notification-permission-changed", refreshNotifications);
    };
  }, []);

  return null;
}
