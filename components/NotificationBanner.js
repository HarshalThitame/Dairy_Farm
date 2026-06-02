"use client";

import { useEffect, useState } from "react";
import {
  dismissNotificationBanner,
  getStoredNotificationPermission,
  isNotificationDismissed
} from "@/lib/notifications";
import { getPushPermissionState, pushNotificationsSupported, requestAndRegisterPushSubscription } from "@/lib/pushClient";

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const permission = getStoredNotificationPermission();
    const browserPermission = pushNotificationsSupported() ? getPushPermissionState() : "unsupported";

    setVisible(
      browserPermission !== "unsupported" &&
        browserPermission !== "granted" &&
        permission !== "denied" &&
        permission !== "unsupported" &&
        !isNotificationDismissed()
    );
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
        🔔 मोबाइल notification चालू करा
      </p>
      <p className="mt-1 text-[16px] font-bold text-green-800">
        Admin कडून आलेल्या सूचना थेट phone notification panel मध्ये दिसतील.
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
