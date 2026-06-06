"use client";

import { fetchRemindersByFilter } from "@/lib/offlineActions";
import { getTodayISODate } from "@/lib/reminderUtils";
import { enqueueNotificationSpeech } from "@/services/notificationSpeechQueue";
import {
  getClientAuthHeaders,
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem
} from "@/lib/clientStorage";

const permissionKey = "goshala_notification_permission";
const dismissedKey = "goshala_notification_dismissed";
const firedKey = "goshala_notifications_fired";
const preferencesCacheKey = "majhi_dairy_notification_preferences_cache";
const notificationTitle = "🐄 माझी डेअरी आठवण";
const activeScheduledIds = new Set();
const PREFERENCES_CACHE_TTL_MS = 60 * 1000;

let preferencesCache = null;
let preferencesCacheAt = 0;

function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function readStoredList(key) {
  try {
    return JSON.parse(safeGetLocalStorageItem(key, "[]"));
  } catch {
    return [];
  }
}

function writeStoredList(key, value) {
  safeSetLocalStorageItem(key, JSON.stringify(value));
}

function readCachedPreferences() {
  try {
    const cached = JSON.parse(safeGetLocalStorageItem(preferencesCacheKey, "{}"));
    return cached?.preferences || null;
  } catch {
    return null;
  }
}

function writeCachedPreferences(preferences) {
  if (!preferences) return;
  safeSetLocalStorageItem(preferencesCacheKey, JSON.stringify({
    cachedAt: Date.now(),
    preferences
  }));
}

function clearPreferencesCache() {
  preferencesCache = null;
  preferencesCacheAt = 0;
}

if (typeof window !== "undefined") {
  window.addEventListener("notification-preferences-updated", clearPreferencesCache);
}

function defaultNotificationPreferences() {
  return {
    categories: {
      daily_reminder: true,
      milk_entry_reminder: true,
      slip_upload_reminder: true
    },
    channels: {
      push: true
    },
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "06:00"
  };
}

async function loadNotificationPreferences() {
  if (preferencesCache && Date.now() - preferencesCacheAt < PREFERENCES_CACHE_TTL_MS) {
    return preferencesCache;
  }

  try {
    const response = await fetch("/api/settings/notifications", {
      cache: "no-store",
      credentials: "same-origin",
      headers: getClientAuthHeaders()
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.preferences) {
      preferencesCache = result.preferences;
      preferencesCacheAt = Date.now();
      writeCachedPreferences(result.preferences);
      return result.preferences;
    }
  } catch {
    // Offline or token errors should not break reminders; use last known preferences below.
  }

  const cached = readCachedPreferences();
  preferencesCache = cached || defaultNotificationPreferences();
  preferencesCacheAt = Date.now();
  return preferencesCache;
}

function minutesFromTime(value, fallback) {
  const [hour, minute] = String(value || fallback || "00:00").split(":").map(Number);
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

function isQuietNow(preferences) {
  if (!preferences?.quiet_hours_enabled) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = minutesFromTime(preferences.quiet_hours_start, "22:00");
  const end = minutesFromTime(preferences.quiet_hours_end, "06:00");

  if (start === end) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function reminderCategory(reminder = {}) {
  const text = `${reminder.type || ""} ${reminder.title || ""} ${reminder.message || ""}`.toLowerCase();

  if (text.includes("milk") || text.includes("dudh") || text.includes("दूध")) {
    return "milk_entry_reminder";
  }
  if (text.includes("slip") || text.includes("स्लिप") || text.includes("देयक")) {
    return "slip_upload_reminder";
  }
  return "daily_reminder";
}

async function canShowLocalReminderNotification(reminder) {
  const preferences = await loadNotificationPreferences();
  const category = reminderCategory(reminder);

  if (preferences?.channels?.push === false) {
    return false;
  }
  if (preferences?.categories?.[category] === false) {
    return false;
  }
  if (isQuietNow(preferences)) {
    return false;
  }

  return true;
}

export function isNotificationDismissed() {
  if (typeof window === "undefined") {
    return false;
  }

  return safeGetLocalStorageItem(dismissedKey, "") === "true";
}

export function dismissNotificationBanner() {
  if (typeof window === "undefined") {
    return;
  }

  safeSetLocalStorageItem(dismissedKey, "true");
}

export function getStoredNotificationPermission() {
  if (typeof window === "undefined") {
    return "unknown";
  }

  return safeGetLocalStorageItem(permissionKey, "unknown") || "unknown";
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) {
    safeSetLocalStorageItem(permissionKey, "unsupported");
    return "unsupported";
  }

  const allowed = window.confirm("आठवणींसाठी सूचना चालू करायच्या का?");

  if (!allowed) {
    safeSetLocalStorageItem(permissionKey, "denied");
    return "denied";
  }

  const permission = await window.Notification.requestPermission();
  safeSetLocalStorageItem(permissionKey, permission);
  safeRemoveLocalStorageItem(dismissedKey);
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
  if (!(await canShowLocalReminderNotification(reminder))) {
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
    enqueueNotificationSpeech({
      id: `reminder:${reminder.reminder_date}:${reminder.id}`,
      tag: reminder.id,
      title: notificationTitle,
      body: reminder.message
    });
    return true;
  }

  new window.Notification(notificationTitle, options);
  enqueueNotificationSpeech({
    id: `reminder:${reminder.reminder_date}:${reminder.id}`,
    tag: reminder.id,
    title: notificationTitle,
    body: reminder.message
  });

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
