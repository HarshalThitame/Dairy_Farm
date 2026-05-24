"use client";

import { useEffect, useState } from "react";
import {
  dismissNotificationBanner,
  getStoredNotificationPermission,
  isNotificationDismissed,
  requestNotificationPermission
} from "@/lib/notifications";

export default function NotificationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const permission = getStoredNotificationPermission();
    const browserPermission =
      typeof window !== "undefined" && "Notification" in window
        ? window.Notification.permission
        : "unsupported";

    setVisible(
      browserPermission !== "unsupported" &&
        browserPermission !== "granted" &&
        permission !== "denied" &&
        permission !== "unsupported" &&
        !isNotificationDismissed()
    );
  }, []);

  async function enableNotifications() {
    const permission = await requestNotificationPermission();
    setVisible(permission !== "granted");
  }

  function dismissBanner() {
    dismissNotificationBanner();
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-soft">
      <p className="text-[20px] font-extrabold leading-snug text-green-900">
        🔔 आठवणींसाठी सूचना चालू करा
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={enableNotifications}
          className="min-h-[52px] rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white active:bg-green-700"
        >
          चालू करा
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
