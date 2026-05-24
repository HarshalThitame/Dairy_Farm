"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  calculateMilkTotal,
  formatMarathiDate,
  getTodayISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import {
  fetchCows as fetchCowsOffline,
  fetchMilkByDate,
  saveBulkMilkRecords
} from "@/lib/offlineActions";

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function createEmptyEntry(existingRecord) {
  return {
    id: existingRecord?.id || null,
    morning: existingRecord?.morning_litres ? String(existingRecord.morning_litres) : "",
    evening: existingRecord?.evening_litres ? String(existingRecord.evening_litres) : ""
  };
}

export default function DudhNondPage() {
  const today = getTodayISODate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [cows, setCows] = useState([]);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveTotal, setSaveTotal] = useState(0);
  const [success, setSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setSaveError("");

    try {
      const [cowsResult, milkResult] = await Promise.all([
        fetchCowsOffline(),
        fetchMilkByDate(selectedDate)
      ]);

      const milkByCow = new Map(
        (milkResult.data || []).map((record) => [record.cow_id, record])
      );
      const nextEntries = {};

      (cowsResult.data || []).forEach((cow) => {
        nextEntries[cow.id] = createEmptyEntry(milkByCow.get(cow.id));
      });

      setCows(cowsResult.data || []);
      setEntries(nextEntries);
    } catch (fetchError) {
      setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateEntry(cowId, field, value) {
    setEntries((currentEntries) => ({
      ...currentEntries,
      [cowId]: {
        ...currentEntries[cowId],
        [field]: value
      }
    }));
    setSuccess("");
    setSaveError("");
  }

  const totalMilk = useMemo(() => {
    return Object.values(entries).reduce(
      (total, entry) => total + toNumber(entry.morning) + toNumber(entry.evening),
      0
    );
  }, [entries]);

  const recordsToSave = useMemo(() => {
    return cows
      .filter((cow) => cow.status !== "वाळलेली")
      .map((cow) => ({
        cow,
        entry: entries[cow.id] || createEmptyEntry()
      }))
      .filter(({ entry }) => toNumber(entry.morning) + toNumber(entry.evening) > 0);
  }, [cows, entries]);

  async function saveEntries() {
    setSaving(true);
    setSavedCount(0);
    setSaveTotal(recordsToSave.length);
    setSuccess("");
    setSaveError("");

    if (recordsToSave.length === 0) {
      setSaving(false);
      setSaveError("जतन करण्यासाठी दूधाची नोंद भरा.");
      return;
    }

    try {
      const savedResult = await saveBulkMilkRecords(
        recordsToSave.map(({ cow, entry }) => ({
          id: entry.id,
          cow_id: cow.id,
          date: selectedDate,
          morning_litres: toNumber(entry.morning),
          evening_litres: toNumber(entry.evening),
          cowName: cow.name,
          cows: { id: cow.id, name: cow.name, breed: cow.breed, status: cow.status }
        }))
      );
      const nextEntries = {};

      recordsToSave.forEach(({ cow }, index) => {
        const savedRecord = savedResult.data?.[index];
        nextEntries[cow.id] = savedRecord?.id;
      });

      setEntries((currentEntries) => {
        const updatedEntries = { ...currentEntries };

        Object.entries(nextEntries).forEach(([cowId, id]) => {
          updatedEntries[cowId] = {
            ...updatedEntries[cowId],
            id: id || updatedEntries[cowId]?.id
          };
        });

        return updatedEntries;
      });
      setSavedCount(recordsToSave.length);

      setSuccess(
        savedResult.offline
          ? `⏳ दूध नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल. आज एकूण ${calculateMilkTotal(totalMilk, 0)} दूध नोंदवले`
          : `✅ दूध नोंद यशस्वीरित्या जतन झाली! आज एकूण ${calculateMilkTotal(
              totalMilk,
              0
            )} दूध नोंदवले`
      );
    } catch (saveFailure) {
      setSaveError(saveFailure.message || "दूध नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState text="दूध नोंदी लोड होत आहेत..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const offlineSuccess = success.startsWith("⏳");

  return (
    <div className="space-y-5 pb-36">
      <PageHeader title="🥛 दूध नोंद" subtitle="रोजचे दूध नोंदवा" />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <FormField label="तारीख निवडा">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="min-h-[56px] rounded-lg border-2 border-green-200 bg-green-50 px-5 text-[19px] font-extrabold text-sheti active:bg-green-100"
            >
              आज
            </button>
          </div>
        </FormField>
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-[22px] font-extrabold text-sheti">
          {formatMarathiDate(selectedDate)}
        </p>
      </section>

      <section className="space-y-3" aria-label="गायींची दूध नोंद">
        {cows.map((cow) => {
          const entry = entries[cow.id] || createEmptyEntry();
          const disabled = cow.status === "वाळलेली";

          return (
            <article
              key={cow.id}
              className={`rounded-lg border p-4 shadow-soft ${
                disabled
                  ? "border-slate-200 bg-slate-100 opacity-70"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/gayi/${cow.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[23px] font-extrabold leading-tight text-slate-950 underline decoration-green-200 underline-offset-4"
                >
                  {cow.name}
                </Link>
                <StatusBadge status={cow.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <FormField label="🌅 सकाळ">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    placeholder="०.०"
                    value={entry.morning}
                    onChange={(event) => updateEntry(cow.id, "morning", event.target.value)}
                    disabled={disabled}
                    className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-950 outline-none disabled:bg-slate-200 focus:border-sheti focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
                <FormField label="🌆 संध्याकाळ">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    placeholder="०.०"
                    value={entry.evening}
                    onChange={(event) => updateEntry(cow.id, "evening", event.target.value)}
                    disabled={disabled}
                    className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-950 outline-none disabled:bg-slate-200 focus:border-sheti focus:ring-4 focus:ring-green-100"
                  />
                </FormField>
              </div>

              <p className="mt-3 text-[20px] font-extrabold text-slate-800">
                एकूण: {calculateMilkTotal(entry.morning, entry.evening)}
              </p>
            </article>
          );
        })}
      </section>

      {success ? (
        <div
          className={`rounded-lg border p-4 text-[20px] font-extrabold leading-relaxed ${
            offlineSuccess
              ? "border-yellow-200 bg-yellow-50 text-yellow-900"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {success}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold leading-relaxed text-red-800">
          {saveError}
        </div>
      ) : null}

      <section className="fixed inset-x-0 bottom-[calc(5.9rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="mx-auto max-w-3xl space-y-3">
          <p className="text-center text-[20px] font-extrabold text-slate-950">
            आजचे एकूण दूध: {calculateMilkTotal(totalMilk, 0)}
          </p>
          {saving ? (
            <p className="text-center text-[18px] font-bold text-athavan">
              जतन होत आहे... {toMarathiNumerals(savedCount)}/{toMarathiNumerals(saveTotal)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={saveEntries}
            disabled={saving}
            className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
          >
            ✅ सर्व नोंदी जतन करा
          </button>
        </div>
      </section>
    </div>
  );
}
