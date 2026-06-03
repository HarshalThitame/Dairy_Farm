"use client";

const SETTINGS_KEY = "majhi_dairy_voice_notification_settings";
const CHANGE_EVENT = "majhi-dairy-voice-settings-changed";

export const defaultVoiceSettings = {
  enabled: true,
  volume: 0.85,
  mode: "tone"
};

function clampVolume(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return defaultVoiceSettings.volume;
  }

  return Math.min(1, Math.max(0, number));
}

function normalizeSettings(settings = {}) {
  return {
    enabled: settings.enabled !== false,
    volume: clampVolume(settings.volume),
    mode: "tone"
  };
}

function readRawSettings() {
  if (typeof window === "undefined") {
    return defaultVoiceSettings;
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultVoiceSettings;
  } catch {
    return defaultVoiceSettings;
  }
}

export function getVoiceSettings() {
  return normalizeSettings(readRawSettings());
}

export function saveVoiceSettings(nextSettings) {
  if (typeof window === "undefined") {
    return defaultVoiceSettings;
  }

  const settings = normalizeSettings({
    ...getVoiceSettings(),
    ...(nextSettings || {})
  });

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: settings }));
  return settings;
}

export function setVoiceNotificationsEnabled(enabled) {
  return saveVoiceSettings({ enabled: Boolean(enabled) });
}

export function setVoiceNotificationVolume(volume) {
  return saveVoiceSettings({ volume: clampVolume(volume) });
}

export function setNotificationToneEnabled(enabled) {
  return setVoiceNotificationsEnabled(enabled);
}

export function setNotificationToneVolume(volume) {
  return setVoiceNotificationVolume(volume);
}

export function subscribeVoiceSettings(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleChange(event) {
    listener(event.detail || getVoiceSettings());
  }

  function handleStorage(event) {
    if (event.key === SETTINGS_KEY) {
      listener(getVoiceSettings());
    }
  }

  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}
