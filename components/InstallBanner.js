"use client";

import { useEffect, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

export default function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (standalone) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setVisible(false);
    setInstallPrompt(null);
  };

  if (!visible) {
    return null;
  }

  return (
    <section className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-3xl rounded-lg border border-green-200 bg-white p-3 shadow-soft sm:bottom-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[19px] font-extrabold leading-snug text-slate-900">
            🐄 {APP_NAME}
          </p>
          <p className="mt-1 text-[17px] font-bold leading-snug text-slate-600">
            {APP_TAGLINE} फोनवर अ‍ॅपसारखे वापरा.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={installApp}
            className="min-h-[52px] flex-1 rounded-lg bg-sheti px-4 text-[18px] font-bold text-white shadow-sm active:bg-green-700 sm:flex-none"
          >
            📱 इंस्टॉल करा
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="min-h-[52px] flex-1 rounded-lg border border-slate-300 bg-white px-4 text-[18px] font-bold text-slate-700 active:bg-slate-100 sm:flex-none"
          >
            ✖ बंद करा
          </button>
        </div>
      </div>
    </section>
  );
}
