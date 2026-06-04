"use client";

import { useEffect, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { safeGetLocalStorageItem, safeSetLocalStorageItem } from "@/lib/clientStorage";

const IOS_DISMISS_KEY = "majhi-dairy-ios-install-help-dismissed-at";
const IOS_DISMISS_DAYS = 7;

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOSDevice() {
  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";

  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

function isSafariBrowser() {
  const userAgent = window.navigator.userAgent || "";
  return /safari/i.test(userAgent) && !/crios|fxios|edgios|chrome|android/i.test(userAgent);
}

function shouldShowIOSHelp() {
  try {
    const dismissedAt = Number(safeGetLocalStorageItem(IOS_DISMISS_KEY, "0") || 0);
    if (!dismissedAt) {
      return true;
    }

    const dismissedAge = Date.now() - dismissedAt;
    return dismissedAge > IOS_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

export default function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    if (isRunningStandalone()) {
      return undefined;
    }

    const iOS = isIOSDevice();
    const safari = isSafariBrowser();
    setIsSafari(safari);

    if (iOS && shouldShowIOSHelp()) {
      setShowIOSHelp(true);
      setVisible(true);
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setShowIOSHelp(false);
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

  const dismissBanner = () => {
    if (showIOSHelp) {
      safeSetLocalStorageItem(IOS_DISMISS_KEY, String(Date.now()));
    }

    setVisible(false);
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
            {showIOSHelp
              ? isSafari
                ? "iPhone वर अ‍ॅपसारखे वापरायचे असल्यास Share → Add to Home Screen करा."
                : "iPhone वर install साठी Safari मध्ये उघडा, मग Share → Add to Home Screen करा."
              : `${APP_TAGLINE} फोनवर अ‍ॅपसारखे वापरा.`}
          </p>
          {showIOSHelp ? (
            <ol className="mt-2 space-y-1 text-[16px] font-semibold leading-snug text-slate-700">
              <li>1. Safari मध्ये ही साइट उघडा</li>
              <li>2. Share बटण दाबा</li>
              <li>3. Add to Home Screen → Add दाबा</li>
            </ol>
          ) : null}
        </div>
        <div className="flex gap-2">
          {installPrompt ? (
            <button
              type="button"
              onClick={installApp}
              className="min-h-[52px] flex-1 rounded-lg bg-sheti px-4 text-[18px] font-bold text-white shadow-sm active:bg-green-700 sm:flex-none"
            >
              📱 इंस्टॉल करा
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismissBanner}
            className="min-h-[52px] flex-1 rounded-lg border border-slate-300 bg-white px-4 text-[18px] font-bold text-slate-700 active:bg-slate-100 sm:flex-none"
          >
            {showIOSHelp ? "समजले" : "✖ बंद करा"}
          </button>
        </div>
      </div>
    </section>
  );
}
