"use client";

const PREFIX = "majhi-dairy-reminder-snapshot:";
const MAX_AGE_MS = 5 * 60 * 1000;

function keyForReminder(reminderId) {
  return `${PREFIX}${reminderId}`;
}

function normalizeReminderSnapshot(reminder) {
  if (!reminder?.id) return null;
  return {
    id: reminder.id,
    farm_id: reminder.farm_id || "",
    cow_id: reminder.cow_id || null,
    reminder_date: reminder.reminder_date || "",
    type: reminder.type || "",
    message: reminder.message || "",
    is_done: Boolean(reminder.is_done),
    done_at: reminder.done_at || null,
    skipped: Boolean(reminder.skipped),
    related_record_id: reminder.related_record_id || null,
    action_href: reminder.action_href || reminder.actionHref || "",
    action_label: reminder.action_label || reminder.actionLabel || "",
    cows: reminder.cows || null,
    related_calf: reminder.related_calf || null,
    calf_name: reminder.calf_name || "",
    cached_at: new Date().toISOString()
  };
}

export function cacheReminderSnapshot(reminder) {
  if (typeof window === "undefined") return;
  const snapshot = normalizeReminderSnapshot(reminder);
  if (!snapshot) return;

  try {
    const payload = JSON.stringify(snapshot);
    window.sessionStorage.setItem(keyForReminder(snapshot.id), payload);
    window.localStorage.setItem(keyForReminder(snapshot.id), payload);
  } catch {
    // Instant navigation cache is best-effort only.
  }
}

export function getReminderSnapshot(reminderId) {
  if (typeof window === "undefined" || !reminderId) return null;

  try {
    const raw = window.sessionStorage.getItem(keyForReminder(reminderId))
      || window.localStorage.getItem(keyForReminder(reminderId));
    if (!raw) return null;

    const snapshot = JSON.parse(raw);
    const cachedAt = new Date(snapshot.cached_at || 0).getTime();
    if (!cachedAt || Date.now() - cachedAt > MAX_AGE_MS) {
      return null;
    }

    return snapshot?.id ? snapshot : null;
  } catch {
    return null;
  }
}
