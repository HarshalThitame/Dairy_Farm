"use client";

import { getVoiceSettings } from "@/store/voiceSettingsStore";
import { isSpeechSupported, speakText } from "@/services/speechService";

const SPOKEN_IDS_KEY = "majhi_dairy_spoken_notification_ids";
const MAX_SPOKEN_IDS = 150;

const queue = [];
let processing = false;

function readSpokenIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(SPOKEN_IDS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeSpokenIds(ids) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SPOKEN_IDS_KEY, JSON.stringify(ids.slice(-MAX_SPOKEN_IDS)));
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

function markSpoken(id) {
  const ids = readSpokenIds();
  if (!ids.includes(id)) {
    writeSpokenIds([...ids, id]);
  }
}

function hasBeenSpoken(id) {
  return readSpokenIds().includes(id);
}

async function processQueue() {
  if (processing) {
    return;
  }

  processing = true;

  while (queue.length) {
    const item = queue.shift();

    try {
      await speakText(item.text, { volume: item.volume, rate: 0.9, pitch: 1 });
      markSpoken(item.id);
    } catch (error) {
      console.error("Voice notification queue failed:", error);
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

  if (!isSpeechSupported()) {
    return false;
  }

  const id = buildNotificationSpeechId(notification);
  if (!options.force && hasBeenSpoken(id)) {
    return false;
  }

  if (queue.some((item) => item.id === id)) {
    return false;
  }

  const text = buildNotificationSpeechText(notification);
  if (!text) {
    return false;
  }

  queue.push({
    id,
    text,
    volume: options.volume ?? settings.volume
  });

  processQueue();
  return true;
}

export function speakTestVoice(volume) {
  return enqueueNotificationSpeech(
    {
      id: `voice-test-${Date.now()}`,
      title: "",
      body: "नमस्कार. माझी डेअरी मध्ये तुमचे स्वागत आहे."
    },
    { force: true, volume }
  );
}

