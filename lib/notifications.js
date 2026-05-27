"use client";

import { fetchRemindersByFilter } from "@/lib/offlineActions";
import { getTodayISODate } from "@/lib/reminderUtils";

const permissionKey = "goshala_notification_permission";
const dismissedKey = "goshala_notification_dismissed";
const firedKey = "goshala_notifications_fired";
const notificationTitle = "🐄 माझी डेअरी आठवण";
const activeScheduledIds = new Set();

function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function readStoredList(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeStoredList(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function isNotificationDismissed() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(dismissedKey) === "true";
}

export function dismissNotificationBanner() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(dismissedKey, "true");
}

export function getStoredNotificationPermission() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  return window.localStorage.getItem(permissionKey) || "unknown";
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) {
    window.localStorage.setItem(permissionKey, "unsupported");
    return "unsupported";
  }

  const allowed = window.confirm("आठवणींसाठी सूचना चालू करायच्या का?");

  if (!allowed) {
    window.localStorage.setItem(permissionKey, "denied");
    return "denied";
  }

  const permission = await window.Notification.requestPermission();
  window.localStorage.setItem(permissionKey, permission);
  window.localStorage.removeItem(dismissedKey);
  return permission;
}

async function getReadyServiceWorkerRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const timeout = new Promise((resolve) => {
    window.setTimeout(() => resolve(null), 1000);
  });

  return Promise.race([navigator.serviceWorker.ready, timeout]).catch(() => null);
}

async function loadReminders(filter) {
  try {
    const result = await fetchRemindersByFilter(filter);
    return result.data || [];
  } catch {
    return [];
  }
}

async function fireScheduledReminder(reminder) {
  const activeTodayReminders = await loadReminders("today");
  const isStillActive = activeTodayReminders.some((item) => item.id === reminder.id);

  if (isStillActive) {
    await scheduleLocalNotification(reminder);
  }
}

export async function scheduleLocalNotification(reminder) {
  if (!notificationsSupported() || window.Notification.permission !== "granted") {
    return false;
  }

  const options = {
    body: reminder.message,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: reminder.id,
    renotify: false
  };

  const registration = await getReadyServiceWorkerRegistration();

  if (registration?.showNotification) {
    await registration.showNotification(notificationTitle, options);
    return true;
  }

  new window.Notification(notificationTitle, options);

  return true;
}

export async function checkAndFireTodayNotifications() {
  if (!notificationsSupported() || window.Notification.permission !== "granted") {
    return;
  }

  const reminders = await loadReminders("today");
  const today = getTodayISODate();
  const firedIds = readStoredList(firedKey);
  const nextFiredIds = [...firedIds];

  for (const reminder of reminders) {
    const notificationId = `${today}:${reminder.id}`;

    if (!nextFiredIds.includes(notificationId)) {
      await scheduleLocalNotification(reminder);
      nextFiredIds.push(notificationId);
    }
  }

  writeStoredList(firedKey, nextFiredIds.slice(-100));
}

export async function scheduleUpcomingNotifications() {
  if (!notificationsSupported() || window.Notification.permission !== "granted") {
    return;
  }

  const reminders = await loadReminders("week");
  const today = getTodayISODate();
  reminders.forEach((reminder) => {
    const scheduleId = `${reminder.reminder_date}:${reminder.id}`;

    if (reminder.reminder_date <= today || activeScheduledIds.has(scheduleId)) {
      return;
    }

    const dueDate = new Date(`${reminder.reminder_date}T08:00:00`);
    const delay = dueDate.getTime() - Date.now();

    if (delay <= 0) {
      return;
    }

    window.setTimeout(() => {
      activeScheduledIds.delete(scheduleId);
      fireScheduledReminder(reminder);
    }, delay);
    activeScheduledIds.add(scheduleId);
  });
}
