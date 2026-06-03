"use client";

import { useCallback, useEffect, useState } from "react";
import { enqueueNotificationSpeech, speakTestVoice } from "@/services/notificationSpeechQueue";
import {
  getNotificationToneInfo,
  isNotificationToneSupported,
  markToneUnlocked
} from "@/services/notificationToneService";
import {
  getVoiceSettings,
  saveVoiceSettings,
  subscribeVoiceSettings
} from "@/store/voiceSettingsStore";

function extractServiceWorkerNotification(message = {}) {
  if (message.type !== "MAJHI_DAIRY_PUSH_NOTIFICATION" && message.type !== "MAJHI_DAIRY_NOTIFICATION") {
    return null;
  }

  return message.notification || {
    id: message.id,
    title: message.title,
    body: message.body,
    tag: message.tag
  };
}

export function useSpeechNotification(options = {}) {
  const { listenForPushMessages = false } = options;
  const [settings, setSettings] = useState(getVoiceSettings);
  const [voiceInfo, setVoiceInfo] = useState({
    supported: isNotificationToneSupported(),
    voiceName: "माझी डेअरी टोन",
    voiceLanguage: "tone",
    fallbackUsed: false
  });

  useEffect(() => subscribeVoiceSettings(setSettings), []);

  useEffect(() => {
    const toneInfo = getNotificationToneInfo();
    setVoiceInfo({
      supported: toneInfo.supported,
      voiceName: toneInfo.toneName,
      voiceLanguage: "tone",
      fallbackUsed: false
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function unlockTone() {
      markToneUnlocked();
    }

    window.addEventListener("pointerdown", unlockTone, { once: true });
    window.addEventListener("keydown", unlockTone, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockTone);
      window.removeEventListener("keydown", unlockTone);
    };
  }, []);

  useEffect(() => {
    if (!listenForPushMessages || typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return undefined;
    }

    function handleServiceWorkerMessage(event) {
      const notification = extractServiceWorkerNotification(event.data || {});
      if (notification) {
        enqueueNotificationSpeech(notification);
      }
    }

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, [listenForPushMessages]);

  const updateSettings = useCallback((nextSettings) => saveVoiceSettings(nextSettings), []);

  const speakNotification = useCallback((notification, speechOptions) => {
    return enqueueNotificationSpeech(notification, speechOptions);
  }, []);

  const testVoice = useCallback(() => {
    return speakTestVoice(getVoiceSettings().volume);
  }, []);

  return {
    settings,
    supported: isNotificationToneSupported(),
    voiceInfo,
    updateSettings,
    speakNotification,
    testVoice
  };
}
