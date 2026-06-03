"use client";

import { getVoiceSettings } from "@/store/voiceSettingsStore";
import { isNotificationToneSupported, playNotificationTone } from "@/services/notificationToneService";

const PLAYED_IDS_KEY = "majhi_dairy_played_notification_tone_ids";
const LEGACY_SPOKEN_IDS_KEY = "majhi_dairy_spoken_notification_ids";
const MAX_PLAYED_IDS = 150;

const queue = [];
let processing = false;

function readPlayedIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const currentIds = JSON.parse(window.localStorage.getItem(PLAYED_IDS_KEY) || "[]");
    if (currentIds.length) {
      return currentIds;
    }

    return JSON.parse(window.localStorage.getItem(LEGACY_SPOKEN_IDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writePlayedIds(ids) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PLAYED_IDS_KEY, JSON.stringify(ids.slice(-MAX_PLAYED_IDS)));
}

function stableHash(value) {
  let hash = 0;
  const input = String(value || "");

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return `voice-${Math.abs(hash)}`;
}

export function buildNotificationSpeechText(notification = {}) {
  return [notification.title, notification.body].filter(Boolean).join(". ");
}

export function buildNotificationSpeechId(notification = {}) {
  return String(
    notification.id ||
      notification.tag ||
      notification.notificationId ||
      stableHash(`${notification.title || ""}|${notification.body || ""}`)
  );
}

function markPlayed(id) {
  const ids = readPlayedIds();
  if (!ids.includes(id)) {
    writePlayedIds([...ids, id]);
  }
}

function hasBeenPlayed(id) {
  return readPlayedIds().includes(id);
}

async function processQueue() {
  if (processing) {
    return;
  }

  processing = true;

  while (queue.length) {
    const item = queue.shift();

    try {
      await playNotificationTone({ volume: item.volume });
      markPlayed(item.id);
    } catch (error) {
      console.error("Notification tone queue failed:", error);
    }
  }

  processing = false;
}

export function enqueueNotificationSpeech(notification = {}, options = {}) {
  if (typeof window === "undefined") {
    return false;
  }

  const settings = getVoiceSettings();
  if (!settings.enabled && !options.force) {
    return false;
  }

  if (!isNotificationToneSupported()) {
    return false;
  }

  const id = buildNotificationSpeechId(notification);
  if (!options.force && hasBeenPlayed(id)) {
    return false;
  }

  if (queue.some((item) => item.id === id)) {
    return false;
  }

  queue.push({
    id,
    volume: options.volume ?? settings.volume
  });

  processQueue();
  return true;
}

export function speakTestVoice(volume) {
  return playNotificationTone({ volume });
}
