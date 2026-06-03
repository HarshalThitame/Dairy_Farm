"use client";

let audioContext = null;
let toneUnlocked = false;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function clampVolume(volume) {
  const number = Number(volume);
  if (!Number.isFinite(number)) {
    return 0.85;
  }

  return Math.min(1, Math.max(0, number));
}

function playNote(context, destination, startAt, frequency, duration, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

export function isNotificationToneSupported() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.AudioContext || window.webkitAudioContext);
}

export function markToneUnlocked() {
  toneUnlocked = true;

  const context = getAudioContext();
  if (context?.state === "suspended") {
    context.resume().catch(() => {});
  }
}

export function isToneUnlocked() {
  return toneUnlocked;
}

export async function playNotificationTone(options = {}) {
  const context = getAudioContext();
  if (!context) {
    return false;
  }

  try {
    if (context.state === "suspended") {
      await context.resume();
    }

    const volume = clampVolume(options.volume);
    const masterGain = context.createGain();
    masterGain.gain.value = volume * 0.42;
    masterGain.connect(context.destination);

    const startAt = context.currentTime + 0.02;
    playNote(context, masterGain, startAt, 659.25, 0.16, 0.55);
    playNote(context, masterGain, startAt + 0.14, 783.99, 0.17, 0.7);
    playNote(context, masterGain, startAt + 0.3, 987.77, 0.24, 0.85);

    window.setTimeout(() => {
      try {
        masterGain.disconnect();
      } catch {}
    }, 900);

    return true;
  } catch (error) {
    console.error("Notification tone failed:", error);
    return false;
  }
}

export function getNotificationToneInfo() {
  return {
    supported: isNotificationToneSupported(),
    toneName: "माझी डेअरी टोन",
    fallbackUsed: false
  };
}

