"use client";

import { useEffect } from "react";
import {
  checkAndFireTodayNotifications,
  scheduleUpcomingNotifications
} from "@/lib/notifications";
import { useSpeechNotification } from "@/hooks/useSpeechNotification";

export default function NotificationBoot() {
  useSpeechNotification({ listenForPushMessages: true });

  useEffect(() => {
    function refreshNotifications() {
      checkAndFireTodayNotifications();
      scheduleUpcomingNotifications();
    }

    refreshNotifications();

    const intervalId = window.setInterval(refreshNotifications, 60 * 60 * 1000);
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
