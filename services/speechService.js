"use client";

const preferredVoiceLanguages = ["mr-IN", "hi-IN", "en-IN"];
const defaultSpeechOptions = {
  rate: 0.9,
  pitch: 1,
  volume: 1
};

let voicesPromise = null;
let speechUnlocked = false;

function getSpeechSynthesis() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  return window.speechSynthesis;
}

export function isSpeechSupported() {
  return Boolean(getSpeechSynthesis() && typeof window.SpeechSynthesisUtterance !== "undefined");
}

export function markSpeechUnlocked() {
  speechUnlocked = true;
}

export function isSpeechUnlocked() {
  return speechUnlocked;
}

export function normalizeTextForSpeech(text) {
  return String(text || "")
    .replace(/[0-9]/g, (digit) => "०१२३४५६७८९"[Number(digit)] || digit)
    .replace(/\s+/g, " ")
    .trim();
}

export function getSpeechVoices() {
  const synthesis = getSpeechSynthesis();

  if (!synthesis) {
    return Promise.resolve([]);
  }

  const currentVoices = synthesis.getVoices();
  if (currentVoices.length) {
    return Promise.resolve(currentVoices);
  }

  if (voicesPromise) {
    return voicesPromise;
  }

  voicesPromise = new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(synthesis.getVoices());
    }, 1200);

    function handleVoicesChanged() {
      window.clearTimeout(timeoutId);
      synthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(synthesis.getVoices());
    }

    synthesis.addEventListener("voiceschanged", handleVoicesChanged);
  });

  return voicesPromise;
}

export function selectBestVoice(voices = []) {
  for (const language of preferredVoiceLanguages) {
    const exactVoice = voices.find((voice) => String(voice.lang || "").toLowerCase() === language.toLowerCase());
    if (exactVoice) {
      return exactVoice;
    }
  }

  for (const language of preferredVoiceLanguages) {
    const languagePrefix = language.split("-")[0].toLowerCase();
    const prefixVoice = voices.find((voice) => String(voice.lang || "").toLowerCase().startsWith(languagePrefix));
    if (prefixVoice) {
      return prefixVoice;
    }
  }

  return voices[0] || null;
}

export async function getSelectedVoiceInfo() {
  const voices = await getSpeechVoices();
  const voice = selectBestVoice(voices);

  return {
    supported: isSpeechSupported(),
    voiceName: voice?.name || "",
    voiceLanguage: voice?.lang || "",
    fallbackUsed: voice ? !String(voice.lang || "").toLowerCase().startsWith("mr") : true
  };
}

export async function speakText(text, options = {}) {
  const synthesis = getSpeechSynthesis();

  if (!synthesis || typeof window.SpeechSynthesisUtterance === "undefined") {
    return false;
  }

  const normalizedText = normalizeTextForSpeech(text);
  if (!normalizedText) {
    return false;
  }

  const voices = await getSpeechVoices();
  const voice = selectBestVoice(voices);
  const utterance = new window.SpeechSynthesisUtterance(normalizedText);
  const finalOptions = {
    ...defaultSpeechOptions,
    ...options
  };

  utterance.lang = voice?.lang || "mr-IN";
  utterance.voice = voice;
  utterance.rate = finalOptions.rate;
  utterance.pitch = finalOptions.pitch;
  utterance.volume = Math.min(1, Math.max(0, Number(finalOptions.volume)));

  return new Promise((resolve) => {
    utterance.onend = () => resolve(true);
    utterance.onerror = (event) => {
      console.error("Voice notification failed:", event);
      resolve(false);
    };

    try {
      synthesis.speak(utterance);
      markSpeechUnlocked();
    } catch (error) {
      console.error("Voice notification failed:", error);
      resolve(false);
    }
  });
}

