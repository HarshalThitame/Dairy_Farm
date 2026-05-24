"use client";

const permissionKey = "goshala_notification_permission";
const dismissedKey = "goshala_notification_dismissed";
const firedKey = "goshala_notifications_fired";
const scheduledKey = "goshala_notifications_scheduled";

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

export function scheduleLocalNotification(reminder) {
  if (!notificationsSupported() || window.Notification.permission !== "granted") {
    return false;
  }

  new window.Notification("🐄 गोशाळा आठवण", {
    body: reminder.message,
    icon: "/icons/icon-192x192.png",
    tag: reminder.id,
    renotify: false
  });

  return true;
}

export async function checkAndFireTodayNotifications() {
  if (!notificationsSupported() || window.Notification.permission !== "granted") {
    return;
  }

  const response = await fetch("/api/reminders?filter=today", { cache: "no-store" });
  const result = await response.json();

  if (!response.ok) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const firedIds = readStoredList(firedKey);
  const nextFiredIds = [...firedIds];

  (result.data || []).forEach((reminder) => {
    const notificationId = `${today}:${reminder.id}`;

    if (!nextFiredIds.includes(notificationId)) {
      scheduleLocalNotification(reminder);
      nextFiredIds.push(notificationId);
    }
  });

  writeStoredList(firedKey, nextFiredIds.slice(-100));
}

export async function scheduleUpcomingNotifications() {
  if (!notificationsSupported() || window.Notification.permission !== "granted") {
    return;
  }

  const response = await fetch("/api/reminders?filter=week", { cache: "no-store" });
  const result = await response.json();

  if (!response.ok) {
    return;
  }

  const scheduledIds = readStoredList(scheduledKey);
  const nextScheduledIds = [...scheduledIds];

  (result.data || []).forEach((reminder) => {
    if (nextScheduledIds.includes(reminder.id)) {
      return;
    }

    const dueDate = new Date(`${reminder.reminder_date}T08:00:00`);
    const delay = dueDate.getTime() - Date.now();

    if (delay <= 0) {
      return;
    }

    window.setTimeout(() => scheduleLocalNotification(reminder), delay);
    nextScheduledIds.push(reminder.id);
  });

  writeStoredList(scheduledKey, nextScheduledIds.slice(-200));
}
