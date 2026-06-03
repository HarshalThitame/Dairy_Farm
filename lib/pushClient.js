"use client";

const PERMISSION_KEY = "goshala_notification_permission";
const DISMISSED_KEY = "goshala_notification_dismissed";
const VAPID_KEY_STORAGE = "majhi_dairy_vapid_public_key";
const PUSH_SW_SCRIPT_URL = "/push-sw.js";
const PUSH_SW_SCOPE = "/push-notifications/";

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

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function absoluteUrl(path) {
  return new URL(path, window.location.origin).href;
}

async function waitForRegistrationByScope(scope, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  const scopeUrl = absoluteUrl(scope);

  while (Date.now() < deadline) {
    const registration = await navigator.serviceWorker.getRegistration(scopeUrl).catch(() => null);
    if (registration?.active && registration.pushManager) {
      return registration;
    }
    await sleep(350);
  }

  return null;
}

function waitForActiveRegistration(registration, timeoutMs) {
  if (!registration) {
    return Promise.resolve(null);
  }
  if (registration.active) {
    return Promise.resolve(registration);
  }

  const worker = registration.installing || registration.waiting;
  if (!worker) {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(registration.active ? registration : null), timeoutMs);
    });
  }

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      worker.removeEventListener("statechange", onStateChange);
      resolve(registration.active ? registration : null);
    }, timeoutMs);

    function onStateChange() {
      if (worker.state === "activated") {
        window.clearTimeout(timeoutId);
        worker.removeEventListener("statechange", onStateChange);
        resolve(registration);
      }
    }

    worker.addEventListener("statechange", onStateChange);
  });
}

async function getActiveRegistrationForUrl(url) {
  try {
    const registration = await navigator.serviceWorker.getRegistration(absoluteUrl(url));
    return registration?.active ? registration : null;
  } catch {
    return null;
  }
}

async function unregisterLocalhostRootAppWorkers() {
  if (
    process.env.NODE_ENV === "production" ||
    typeof window === "undefined" ||
    !window.location.hostname.match(/^(localhost|127\.0\.0\.1)$/)
  ) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const rootScope = new URL("/", window.location.href).href;

    await Promise.all(
      registrations
        .filter((registration) => registration.scope === rootScope)
        .map((registration) => registration.unregister())
    );
  } catch (error) {
    console.warn("Local root service worker cleanup skipped:", error);
  }
}

async function registerServiceWorker(scriptUrl, scope, timeoutMs = 8000) {
  try {
    const registration = await navigator.serviceWorker.register(scriptUrl, {
      scope,
      updateViaCache: "none"
    });
    try {
      await registration.update?.();
    } catch (error) {
      console.warn(`Service worker update skipped for ${scriptUrl}:`, error);
    }
    const activeRegistration = await waitForActiveRegistration(registration, timeoutMs);
    if (activeRegistration?.pushManager) {
      return activeRegistration;
    }

    return waitForRegistrationByScope(scope, Math.max(timeoutMs, 15000));
  } catch (error) {
    console.error(`Service worker registration failed for ${scriptUrl}:`, error);
    return null;
  }
}

async function ensureServiceWorkerRegistration() {
  await unregisterLocalhostRootAppWorkers();

  const existingPushRegistration =
    (await getActiveRegistrationForUrl(PUSH_SW_SCOPE)) ||
    (await waitForRegistrationByScope(PUSH_SW_SCOPE, 1500));
  if (existingPushRegistration?.pushManager) {
    return existingPushRegistration;
  }

  const pushRegistration = await registerServiceWorker(PUSH_SW_SCRIPT_URL, PUSH_SW_SCOPE, 20000);
  if (pushRegistration?.pushManager) {
    return pushRegistration;
  }

  const scopedRegistration = await waitForRegistrationByScope(PUSH_SW_SCOPE, 10000);
  if (scopedRegistration?.pushManager) {
    return scopedRegistration;
  }

  const readyRegistration = await waitForServiceWorkerReady(2500);
  if (readyRegistration?.scope?.endsWith(PUSH_SW_SCOPE) && readyRegistration.pushManager) {
    return readyRegistration;
  }

  return waitForRegistrationByScope(PUSH_SW_SCOPE, 3000);
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
