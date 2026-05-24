"use client";

import { useEffect } from "react";
import {
  checkAndFireTodayNotifications,
  scheduleUpcomingNotifications
} from "@/lib/notifications";

export default function NotificationBoot() {
  useEffect(() => {
    checkAndFireTodayNotifications();
    scheduleUpcomingNotifications();
  }, []);

  return null;
}
