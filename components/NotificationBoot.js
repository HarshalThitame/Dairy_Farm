"use client";

import { useEffect } from "react";
import {
  checkAndFireTodayNotifications,
  scheduleUpcomingNotifications
} from "@/lib/notifications";
import { getPushPermissionState, pushNotificationsSupported, requestAndRegisterPushSubscription } from "@/lib/pushClient";
import { useSpeechNotification } from "@/hooks/useSpeechNotification";
import { enqueueNotificationSpeech } from "@/services/notificationSpeechQueue";
import {
  getClientAuthHeaders,
  getClientAuthToken,
  safeGetLocalStorageItem,
  safeSetLocalStorageItem
} from "@/lib/clientStorage";

const ANNOUNCED_ADMIN_NOTIFICATIONS_KEY = "majhi_dairy_announced_admin_notifications";

function getAuthToken() {
  return getClientAuthToken();
}

function readAnnouncedIds() {
  try {
    return JSON.parse(safeGetLocalStorageItem(ANNOUNCED_ADMIN_NOTIFICATIONS_KEY, "[]"));
  } catch {
    return [];
  }
}

function writeAnnouncedIds(ids) {
  safeSetLocalStorageItem(ANNOUNCED_ADMIN_NOTIFICATIONS_KEY, JSON.stringify(ids.slice(-100)));
}

export default function NotificationBoot() {
  useSpeechNotification({ listenForPushMessages: true });

  useEffect(() => {
    let registeringPush = false;

    async function registerPushSubscription() {
      if (
        !pushNotificationsSupported() ||
        getPushPermissionState() !== "granted" ||
        !getAuthToken() ||
        registeringPush
      ) {
        return;
      }

      registeringPush = true;
      try {
        const result = await requestAndRegisterPushSubscription({ requestPermission: false });
        if (!result.success) {
          console.warn("Push subscription registration skipped:", result.status, result.message);
        }
      } catch (error) {
        console.error("Push subscription registration failed:", error);
      } finally {
        registeringPush = false;
      }
    }

    async function pollAdminNotifications() {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          return;
        }
        const response = await fetch("/api/notifications?filter=unread&limit=3", {
          cache: "no-store",
          credentials: "same-origin",
          headers: getClientAuthHeaders()
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
    window.setTimeout(registerPushSubscription, 800);
    window.setTimeout(registerPushSubscription, 5000);

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
