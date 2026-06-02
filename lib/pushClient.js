"use client";

const PERMISSION_KEY = "goshala_notification_permission";
const DISMISSED_KEY = "goshala_notification_dismissed";
const VAPID_KEY_STORAGE = "majhi_dairy_vapid_public_key";

function getAuthToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }
  return localStorage.getItem("goshala_token") || "";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function uint8ArrayToBase64Url(value) {
  const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value || []);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getExistingApplicationServerKey(subscription) {
  try {
    return subscription?.options?.applicationServerKey
      ? uint8ArrayToBase64Url(subscription.options.applicationServerKey)
      : "";
  } catch {
    return "";
  }
}

function waitForServiceWorkerReady(timeoutMs) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => window.setTimeout(() => resolve(null), timeoutMs))
  ]);
}

async function ensureServiceWorkerRegistration() {
  let registration = await waitForServiceWorkerReady(2500);
  if (registration) {
    return registration;
  }

  try {
    const existingRegistration = await navigator.serviceWorker.getRegistration("/");
    if (existingRegistration?.active) {
      return existingRegistration;
    }

    if (existingRegistration) {
      existingRegistration.update?.();
    } else {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    registration = await waitForServiceWorkerReady(10000);
    if (registration) {
      return registration;
    }

    const fallbackRegistration = await navigator.serviceWorker.getRegistration("/");
    return fallbackRegistration?.active ? fallbackRegistration : null;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
}

export function pushNotificationsSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function getPushPermissionState() {
  if (!pushNotificationsSupported()) {
    return "unsupported";
  }
  return window.Notification.permission;
}

export async function requestAndRegisterPushSubscription({ requestPermission = false } = {}) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!pushNotificationsSupported()) {
    localStorage.setItem(PERMISSION_KEY, "unsupported");
    return { success: false, status: "unsupported", message: "या browser मध्ये push notification support नाही." };
  }
  if (!vapidPublicKey) {
    return { success: false, status: "missing_vapid", message: "Push notification keys configure केलेले नाहीत." };
  }

  let permission = window.Notification.permission;
  if (permission !== "granted" && requestPermission) {
    permission = await window.Notification.requestPermission();
    localStorage.setItem(PERMISSION_KEY, permission);
    if (permission === "granted") {
      localStorage.removeItem(DISMISSED_KEY);
      window.dispatchEvent(new CustomEvent("notification-permission-changed"));
    }
  }

  if (permission !== "granted") {
    return { success: false, status: permission, message: "Notification permission दिलेली नाही." };
  }

  const registration = await ensureServiceWorkerRegistration();
  if (!registration) {
    return {
      success: false,
      status: "service_worker_not_ready",
      message: "Service worker तयार नाही. App HTTPS production link वर उघडा किंवा browser storage clear करून पुन्हा प्रयत्न करा."
    };
  }

  let subscription = await registration.pushManager.getSubscription();
  const existingKey = getExistingApplicationServerKey(subscription);
  const storedVapidKey = window.localStorage.getItem(VAPID_KEY_STORAGE) || "";
  if (subscription && ((existingKey && existingKey !== vapidPublicKey) || (!existingKey && storedVapidKey && storedVapidKey !== vapidPublicKey))) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }

  const response = await fetch("/api/notifications/push-subscription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ subscription: subscription.toJSON() })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Push subscription save झाली नाही.");
  }

  window.dispatchEvent(new CustomEvent("notification-push-subscribed"));
  window.localStorage.setItem(VAPID_KEY_STORAGE, vapidPublicKey);
  return { success: true, status: "granted", subscriptionId: result.id };
}
