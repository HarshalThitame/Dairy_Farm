"use client";

import { useCallback, useEffect, useState } from "react";
import { enqueueNotificationSpeech, speakTestVoice } from "@/services/notificationSpeechQueue";
import {
  getSelectedVoiceInfo,
  isSpeechSupported,
  markSpeechUnlocked
} from "@/services/speechService";
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
    supported: false,
    voiceName: "",
    voiceLanguage: "",
    fallbackUsed: true
  });

  useEffect(() => subscribeVoiceSettings(setSettings), []);

  useEffect(() => {
    let active = true;

    getSelectedVoiceInfo()
      .then((info) => {
        if (active) {
          setVoiceInfo(info);
        }
      })
      .catch((error) => {
        console.error("Voice detection failed:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function unlockSpeech() {
      markSpeechUnlocked();
    }

    window.addEventListener("pointerdown", unlockSpeech, { once: true });
    window.addEventListener("keydown", unlockSpeech, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockSpeech);
      window.removeEventListener("keydown", unlockSpeech);
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
    supported: isSpeechSupported(),
    voiceInfo,
    updateSettings,
    speakNotification,
    testVoice
  };
}

