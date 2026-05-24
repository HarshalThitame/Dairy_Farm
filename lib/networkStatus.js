"use client";

export function isOnline() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function onNetworkChange(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export async function waitForNetwork(timeoutMs = 30000) {
  if (isOnline()) {
    return true;
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("इंटरनेट जोडणी मिळाली नाही."));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timeout);
      window.removeEventListener("online", handleOnline);
    }

    function handleOnline() {
      cleanup();
      resolve(true);
    }

    window.addEventListener("online", handleOnline);
  });
}

export function getNetworkType() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return connection?.effectiveType || "unknown";
}
