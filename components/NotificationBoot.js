"use client";

import { useEffect } from "react";
import {
  checkAndFireTodayNotifications,
  scheduleUpcomingNotifications
} from "@/lib/notifications";
import { useSpeechNotification } from "@/hooks/useSpeechNotification";
import { enqueueNotificationSpeech } from "@/services/notificationSpeechQueue";

const ANNOUNCED_ADMIN_NOTIFICATIONS_KEY = "majhi_dairy_announced_admin_notifications";

function getAuthToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }
  return localStorage.getItem("goshala_token") || "";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
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
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey || typeof navigator === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }
      if (!("Notification" in window) || window.Notification.permission !== "granted") {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        }

        await fetch("/api/notifications/push-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ subscription: subscription.toJSON() })
        });
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
            id: `admin:${notification.id}`,
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

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshNotifications);
      window.removeEventListener("online", refreshNotifications);
      window.removeEventListener("sync-complete", refreshNotifications);
      window.removeEventListener("cache-refreshed", refreshNotifications);
    };
  }, []);

  return null;
}
