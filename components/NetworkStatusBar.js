"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getPendingSyncCount } from "@/lib/localDB";
import { isOnline, onNetworkChange } from "@/lib/networkStatus";
import { checkNetworkAndSync } from "@/lib/syncManager";
import { toMarathiNumerals } from "@/lib/marathiUtils";
import { showToast } from "@/components/Toast";

export default function NetworkStatusBar() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [complete, setComplete] = useState(false);

  const refreshPending = useCallback(async () => {
    setPendingCount(await getPendingSyncCount());
  }, []);

  useEffect(() => {
    setOnline(isOnline());
    refreshPending();

    const cleanupNetwork = onNetworkChange(async (nextOnline) => {
      setOnline(nextOnline);
      await refreshPending();

      if (nextOnline) {
        setSyncing(true);
        let result = null;

        try {
          result = await checkNetworkAndSync();
        } catch {
          showToast("❌ समक्रमण चुकले. पुन्हा प्रयत्न होईल.", "error");
        } finally {
          setSyncing(false);
          await refreshPending();
        }

        if (!result?.offline && (result?.synced || 0) > 0 && (result?.failed || 0) === 0) {
          setComplete(true);
          window.setTimeout(() => setComplete(false), 3000);
        }
      }
    });

    function handlePendingChange() {
      refreshPending();
    }

    function handleSyncStart(event) {
      setSyncing((event.detail?.count || 0) > 0);
    }

    function handleSyncComplete(event) {
      setSyncing(false);
      refreshPending();

      if ((event.detail?.synced || 0) > 0 && (event.detail?.failed || 0) === 0) {
        setComplete(true);
        showToast("✅ सर्व नोंदी समक्रमित झाल्या!", "success");
        window.setTimeout(() => setComplete(false), 3000);
      }
    }

    function handleSyncFailed() {
      setSyncing(false);
      refreshPending();
      showToast("❌ समक्रमण चुकले. पुन्हा प्रयत्न होईल.", "error");
    }

    function handleOfflineSave(event) {
      refreshPending();
      const labels = {
        milk: "दूध नोंद",
        ai: "रेतन नोंद",
        health: "आरोग्य नोंद",
        vaccination: "लसीकरण नोंद",
        reminder: "आठवण",
        cow: "गाय",
        finance: "हिशोब नोंद"
      };
      showToast(`⏳ ${labels[event.detail?.entity] || "नोंद"} फोनवर साठवली`, "warning");
    }

    window.addEventListener("pending-sync-change", handlePendingChange);
    window.addEventListener("sync-start", handleSyncStart);
    window.addEventListener("sync-complete", handleSyncComplete);
    window.addEventListener("sync-failed", handleSyncFailed);
    window.addEventListener("offline-save", handleOfflineSave);

    checkNetworkAndSync()
      .catch(() => {
        showToast("❌ समक्रमण चुकले. पुन्हा प्रयत्न होईल.", "error");
      })
      .finally(refreshPending);

    return () => {
      cleanupNetwork();
      window.removeEventListener("pending-sync-change", handlePendingChange);
      window.removeEventListener("sync-start", handleSyncStart);
      window.removeEventListener("sync-complete", handleSyncComplete);
      window.removeEventListener("sync-failed", handleSyncFailed);
      window.removeEventListener("offline-save", handleOfflineSave);
    };
  }, [refreshPending]);

  if (syncing) {
    return (
      <Link
        href="/sync"
        className="sticky top-0 z-[60] block min-h-[40px] bg-yellow-600 px-3 py-2 text-center text-[14px] font-extrabold text-white"
      >
        🔄 {toMarathiNumerals(pendingCount)} नोंदी समक्रमित होत आहेत...
      </Link>
    );
  }

  if (complete) {
    return (
      <div className="sticky top-0 z-[60] min-h-[40px] bg-sheti px-3 py-2 text-center text-[14px] font-extrabold text-white">
        ✅ सर्व नोंदी समक्रमित झाल्या!
      </div>
    );
  }

  if (!online) {
    return (
      <Link
        href="/sync"
        className="sticky top-0 z-[60] block min-h-[40px] bg-tatkal px-3 py-2 text-center text-[14px] font-extrabold text-white"
      >
        📵 इंटरनेट नाही — नोंदी फोनवर साठवल्या जातील
        {pendingCount > 0 ? ` | ⏳ ${toMarathiNumerals(pendingCount)} नोंदी समक्रमणासाठी रांगेत आहेत` : ""}
      </Link>
    );
  }

  if (pendingCount > 0) {
    return (
      <Link
        href="/sync"
        className="sticky top-0 z-[60] block min-h-[40px] bg-yellow-600 px-3 py-2 text-center text-[14px] font-extrabold text-white"
      >
        ⏳ {toMarathiNumerals(pendingCount)} नोंदी समक्रमणासाठी रांगेत आहेत
      </Link>
    );
  }

  return null;
}
