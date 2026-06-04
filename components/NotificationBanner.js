"use client";

import { useEffect, useState } from "react";
import {
  dismissNotificationBanner,
  getStoredNotificationPermission,
  isNotificationDismissed
} from "@/lib/notifications";
import { getClientAuthHeaders, getClientAuthToken } from "@/lib/clientStorage";
import { getPushPermissionState, pushNotificationsSupported, requestAndRegisterPushSubscription } from "@/lib/pushClient";

function getAuthToken() {
  return getClientAuthToken();
}

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("🔔 मोबाइल notification चालू करा");
  const [description, setDescription] = useState("Admin कडून आलेल्या सूचना थेट phone notification panel मध्ये दिसतील.");

  useEffect(() => {
    let active = true;

    async function refreshStatus() {
      const permission = getStoredNotificationPermission();
      const browserPermission = pushNotificationsSupported() ? getPushPermissionState() : "unsupported";

      if (browserPermission === "unsupported") {
        if (active) setVisible(false);
        return;
      }

      if (browserPermission === "granted") {
        const token = getAuthToken();
        if (!token) {
          if (active) setVisible(false);
          return;
        }

        try {
          const response = await fetch("/api/notifications/push-status", {
            cache: "no-store",
            credentials: "same-origin",
            headers: getClientAuthHeaders()
          });
          const status = await response.json().catch(() => ({}));

          if (!active) return;

          if (!response.ok) {
            setVisible(false);
            return;
          }

          if (!status.vapidPublicKeyConfigured || !status.vapidPrivateKeyConfigured) {
            setTitle("🔔 Mobile notification setup अपूर्ण आहे");
            setDescription("Permission आहे, पण server वर push keys नीट configure नाहीत.");
            setVisible(true);
            return;
          }

          if ((status.activeSubscriptions || 0) < 1) {
            setTitle("🔔 Mobile notification registration बाकी आहे");
            setDescription("Permission दिली आहे, पण हा phone अजून server मध्ये जोडलेला नाही. पुन्हा चालू करा.");
            setVisible(true);
            return;
          }

          setVisible(false);
          return;
        } catch {
          if (active) setVisible(false);
          return;
        }
      }

      if (!active) return;
      setTitle("🔔 मोबाइल notification चालू करा");
      setDescription("Admin कडून आलेल्या सूचना थेट phone notification panel मध्ये दिसतील.");
      setVisible(
        permission !== "denied" &&
          permission !== "unsupported" &&
          !isNotificationDismissed()
      );
    }

    refreshStatus();
    window.addEventListener("notification-push-subscribed", refreshStatus);
    window.addEventListener("notification-permission-changed", refreshStatus);
    window.addEventListener("online", refreshStatus);

    return () => {
      active = false;
      window.removeEventListener("notification-push-subscribed", refreshStatus);
      window.removeEventListener("notification-permission-changed", refreshStatus);
      window.removeEventListener("online", refreshStatus);
    };
  }, []);

  async function enableNotifications() {
    setLoading(true);
    setMessage("");
    try {
      const result = await requestAndRegisterPushSubscription({ requestPermission: true });
      setVisible(!result.success);
      setMessage(result.success ? "मोबाइल notification चालू झाले." : result.message);
    } catch (error) {
      setMessage(error.message || "Notification चालू करताना अडचण आली.");
      setVisible(true);
    } finally {
      setLoading(false);
    }
  }

  function dismissBanner() {
    dismissNotificationBanner();
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <section className="dashboard-card rounded-lg border border-green-200 bg-green-50 p-4 shadow-soft">
      <p className="text-[20px] font-extrabold leading-snug text-green-900">
        {title}
      </p>
      <p className="mt-1 text-[16px] font-bold text-green-800">
        {description}
      </p>
      {message ? <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-[15px] font-bold text-slate-700">{message}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={enableNotifications}
          disabled={loading}
          className="min-h-[52px] rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white active:bg-green-700 disabled:bg-slate-300"
        >
          {loading ? "चालू करत आहे..." : "चालू करा"}
        </button>
        <button
          type="button"
          onClick={dismissBanner}
          className="min-h-[52px] rounded-lg border-2 border-green-200 bg-white px-4 text-[19px] font-extrabold text-slate-700 active:bg-green-100"
        >
          नको
        </button>
      </div>
    </section>
  );
}
