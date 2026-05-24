"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import {
  deleteSyncRecord,
  getAllSyncRecords,
  getPendingSyncCount,
  getRecentlySynced,
  resetSyncRecord
} from "@/lib/localDB";
import { isOnline, onNetworkChange } from "@/lib/networkStatus";
import { checkNetworkAndSync } from "@/lib/syncManager";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

const entityMeta = {
  milk: { emoji: "🥛", label: "दूध नोंद" },
  ai: { emoji: "💉", label: "रेतन नोंद" },
  health: { emoji: "🏥", label: "आरोग्य नोंद" },
  cow: { emoji: "🐄", label: "गाय" },
  finance: { emoji: "💰", label: "हिशोब नोंद" },
  calving: { emoji: "🐄", label: "व्यायण नोंद" },
  vaccination: { emoji: "💊", label: "लसीकरण नोंद" },
  reminder: { emoji: "🔔", label: "आठवण" }
};

function timeAgo(dateString) {
  if (!dateString) {
    return "आत्ताच";
  }

  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) {
    return "आत्ताच";
  }

  if (minutes < 60) {
    return `${toMarathiNumerals(minutes)} मिनिटांपूर्वी`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${toMarathiNumerals(hours)} तासांपूर्वी`;
  }

  const days = Math.floor(hours / 24);
  return `${toMarathiNumerals(days)} दिवसांपूर्वी`;
}

function getStatus(record) {
  if (record.permanentFail) {
    return "चूक झाली";
  }

  if (record.syncError) {
    return "पुन्हा प्रयत्न होईल";
  }

  return "रांगेत";
}

function dataSummary(record) {
  const payload = record.payload || {};

  if (record.entity === "milk") {
    return `तारीख: ${formatMarathiDate(payload.date)} | सकाळ: ${toMarathiNumerals(payload.morning_litres || 0)} | संध्याकाळ: ${toMarathiNumerals(payload.evening_litres || 0)}`;
  }

  if (record.entity === "finance") {
    return `${payload.type || "नोंद"} | ${payload.category || "इतर"} | ₹ ${toMarathiNumerals(payload.amount || 0)}`;
  }

  return payload.date || payload.ai_date || payload.reminder_date
    ? `तारीख: ${formatMarathiDate(payload.date || payload.ai_date || payload.reminder_date)}`
    : "माहिती फोनवर साठवली आहे.";
}

function SyncItem({ record, onRetry, onDelete }) {
  const meta = entityMeta[record.entity] || { emoji: "📋", label: "नोंद" };

  return (
    <article
      className={`rounded-lg border-2 bg-white p-4 shadow-soft ${
        record.permanentFail ? "border-red-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[21px] font-extrabold text-slate-950">
            {meta.emoji} {meta.label}
          </p>
          {record.cowName ? (
            <p className="mt-1 text-[19px] font-extrabold text-sheti">{record.cowName}</p>
          ) : null}
          <p className="mt-1 text-[18px] font-bold text-slate-600">
            {timeAgo(record.createdAt)} नोंदवले
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[18px] font-extrabold ${
            record.permanentFail
              ? "bg-red-100 text-red-800"
              : record.syncError
                ? "bg-yellow-100 text-yellow-800"
                : "bg-slate-100 text-slate-700"
          }`}
        >
          {getStatus(record)}
        </span>
      </div>

      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-[18px] font-bold text-slate-700">
        {dataSummary(record)}
      </p>

      {record.syncError ? (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-[18px] font-bold text-red-800">
          {record.syncError}
        </p>
      ) : null}

      {record.syncError || record.permanentFail ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onRetry(record)}
            className="min-h-[52px] rounded-lg bg-sheti px-3 text-[18px] font-extrabold text-white active:bg-green-700"
          >
            🔄 पुन्हा प्रयत्न करा
          </button>
          <button
            type="button"
            onClick={() => onDelete(record)}
            className="min-h-[52px] rounded-lg border-2 border-red-200 bg-red-50 px-3 text-[18px] font-extrabold text-red-800 active:bg-red-100"
          >
            🗑️ हटवा
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function SyncStatusPage() {
  const [online, setOnline] = useState(true);
  const [records, setRecords] = useState([]);
  const [recent, setRecent] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    setError("");

    try {
      setOnline(isOnline());
      setRecords(await getAllSyncRecords());
      setRecent(await getRecentlySynced(10));
      setPendingCount(await getPendingSyncCount());
    } catch (loadError) {
      setError(loadError.message || "समक्रमण माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    const cleanup = onNetworkChange((nextOnline) => {
      setOnline(nextOnline);
      loadRecords();
    });

    window.addEventListener("pending-sync-change", loadRecords);
    window.addEventListener("sync-complete", loadRecords);

    return () => {
      cleanup();
      window.removeEventListener("pending-sync-change", loadRecords);
      window.removeEventListener("sync-complete", loadRecords);
    };
  }, [loadRecords]);

  const pendingItems = useMemo(
    () => records.filter((record) => !record.synced && !record.permanentFail),
    [records]
  );
  const failedItems = useMemo(
    () => records.filter((record) => record.permanentFail),
    [records]
  );
  const lastSync = typeof localStorage !== "undefined" ? localStorage.getItem("goshala-last-sync") : null;

  async function runSync() {
    setSyncing(true);
    setError("");

    try {
      await checkNetworkAndSync();
      await loadRecords();
    } catch (syncError) {
      setError(syncError.message || "समक्रमण चुकले.");
    } finally {
      setSyncing(false);
    }
  }

  async function retryRecord(record) {
    await resetSyncRecord(record.localId);
    await runSync();
  }

  async function removeRecord(record) {
    await deleteSyncRecord(record.localId);
    await loadRecords();
  }

  if (loading) {
    return <LoadingState text="समक्रमण माहिती लोड होत आहे..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadRecords} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="🔄 समक्रमण स्थिती" />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid gap-3">
          <p
            className={`rounded-lg p-4 text-center text-[22px] font-extrabold ${
              online ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {online ? "🟢 इंटरनेट चालू आहे" : "🔴 इंटरनेट नाही"}
          </p>
          <p className="text-[20px] font-extrabold text-slate-900">
            {toMarathiNumerals(pendingCount)} नोंदी समक्रमणासाठी रांगेत
          </p>
          <p className="text-[18px] font-bold text-slate-600">
            शेवटचे समक्रमण: {lastSync ? timeAgo(lastSync) : "अजून झाले नाही"}
          </p>
          {online ? (
            <button
              type="button"
              onClick={runSync}
              disabled={syncing}
              className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white active:bg-green-700 disabled:bg-slate-400"
            >
              {syncing ? "🔄 समक्रमण होत आहे..." : "🔄 आत्ता समक्रमण करा"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[24px] font-extrabold text-slate-950">रांगेतील नोंदी</h2>
        {pendingItems.length > 0 ? (
          pendingItems.map((record) => (
            <SyncItem
              key={record.localId}
              record={record}
              onRetry={retryRecord}
              onDelete={removeRecord}
            />
          ))
        ) : (
          <p className="rounded-lg border-2 border-dashed border-green-200 bg-green-50 p-5 text-center text-[20px] font-extrabold text-green-800">
            समक्रमणासाठी बाकी नोंदी नाहीत.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[24px] font-extrabold text-slate-950">अलीकडे समक्रमित झालेल्या</h2>
        {recent.length > 0 ? (
          recent.map((record) => {
            const meta = entityMeta[record.entity] || { emoji: "📋", label: "नोंद" };
            return (
              <article key={record.localId} className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-[20px] font-extrabold text-green-900">
                  ✅ {meta.emoji} {meta.label}
                </p>
                <p className="mt-1 text-[18px] font-bold text-green-800">
                  {timeAgo(record.syncedAt)} समक्रमित झाले
                </p>
              </article>
            );
          })
        ) : (
          <p className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-5 text-center text-[19px] font-bold text-slate-600">
            अजून समक्रमित झालेल्या नोंदी नाहीत.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[24px] font-extrabold text-slate-950">चुकलेल्या नोंदी</h2>
        {failedItems.length > 0 ? (
          failedItems.map((record) => (
            <SyncItem
              key={record.localId}
              record={record}
              onRetry={retryRecord}
              onDelete={removeRecord}
            />
          ))
        ) : (
          <p className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-5 text-center text-[19px] font-bold text-slate-600">
            चुकलेल्या नोंदी नाहीत.
          </p>
        )}
      </section>
    </div>
  );
}
