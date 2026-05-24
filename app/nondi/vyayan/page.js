"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  addDaysToDate,
  formatMarathiDate,
  getTodayISODate,
  toISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { getReminderDayDistance } from "@/lib/reminderUtils";
import {
  fetchCows as fetchCowsOffline,
  saveCalvingRecord
} from "@/lib/offlineActions";
import { getCachedAIByCow } from "@/lib/localDB";

async function fetchLastAI(cowId) {
  try {
    const response = await fetch(`/api/ai?cow_id=${cowId}`, { cache: "no-store" });
    const result = await response.json();

    if (response.ok) {
      return (result.data || [])[0] || null;
    }
  } catch {
    // Fall back to local AI records below.
  }

  const cachedRecords = await getCachedAIByCow(cowId);
  return cachedRecords[0] || null;
}

export default function VyayanNondPage() {
  const router = useRouter();
  const today = getTodayISODate();
  const [initialCowId, setInitialCowId] = useState("");
  const [reminderId, setReminderId] = useState("");
  const [cows, setCows] = useState([]);
  const [selectedCow, setSelectedCow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    actual_date: today,
    calf_gender: "मादी",
    calf_name: "",
    calf_weight: "",
    calving_notes: "",
    milk_start_date: today
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPregnantCows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchCowsOffline();

      const pregnantCows = (result.data || []).filter((cow) => cow.status === "गाभण");
      const cowsWithAI = await Promise.all(
        pregnantCows.map(async (cow) => {
          const lastAI = await fetchLastAI(cow.id);
          const expectedDate = lastAI ? toISODate(addDaysToDate(lastAI.ai_date, 270)) : "";

          return {
            ...cow,
            last_ai_record: lastAI,
            expected_calving_date: expectedDate
          };
        })
      );

      setCows(cowsWithAI);
    } catch (fetchError) {
      setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitialCowId(params.get("cow_id") || "");
    setReminderId(params.get("reminder_id") || "");
    fetchPregnantCows();
  }, [fetchPregnantCows]);

  useEffect(() => {
    if (!initialCowId || selectedCow || cows.length === 0) {
      return;
    }

    const cow = cows.find((item) => item.id === initialCowId);

    if (cow) {
      setSelectedCow(cow);
    }
  }, [cows, initialCowId, selectedCow]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
    setSaveError("");
    setSuccess("");
  }

  const dryOffDate = useMemo(() => {
    return toISODate(addDaysToDate(form.actual_date, 60));
  }, [form.actual_date]);

  async function saveCalving(event) {
    event.preventDefault();

    if (!selectedCow) {
      setSaveError("गाय निवडा.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSuccess("");

    try {
      const result = await saveCalvingRecord({
        cow_id: selectedCow.id,
        cowName: selectedCow.name,
        cow: selectedCow,
        ai_record_id: selectedCow.last_ai_record?.id || null,
        expected_date: selectedCow.expected_calving_date || null,
        actual_date: form.actual_date,
        calf_gender: form.calf_gender,
        calf_name: form.calf_name.trim() || null,
        calf_weight: form.calf_weight === "" ? null : Number(form.calf_weight),
        calving_notes: form.calving_notes.trim() || null,
        dryOffDate,
        reminderId
      });

      setSuccess(
        result.offline
          ? "⏳ व्यायण नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल."
          : "✅ व्यायण नोंद जतन झाली! 🐄 वासरू जन्मले!"
      );
      window.setTimeout(() => router.push(`/gayi/${selectedCow.id}`), 1100);
    } catch (saveFailure) {
      setSaveError(saveFailure.message || "व्यायण नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState text="गाभण गायी लोड होत आहेत..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPregnantCows} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="🐄 व्यायण नोंद" subtitle="वासरू जन्मल्याची नोंद करा" />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="mb-3 text-[24px] font-extrabold text-slate-950">गाय निवडा</h2>
        <div className="space-y-3">
          {cows.map((cow) => {
            const overdueDays = cow.expected_calving_date
              ? Math.abs(Math.min(getReminderDayDistance(cow.expected_calving_date), 0))
              : 0;
            const overdue = cow.expected_calving_date && cow.expected_calving_date < today;
            const active = selectedCow?.id === cow.id;

            return (
              <button
                key={cow.id}
                type="button"
                onClick={() => setSelectedCow(cow)}
                className={`w-full rounded-lg border-2 p-3 text-left shadow-sm ${
                  active
                    ? "border-green-300 bg-green-50"
                    : overdue
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[22px] font-extrabold text-slate-950">{cow.name}</p>
                    <p className="mt-1 text-[18px] font-bold text-slate-700">
                      अपेक्षित तारीख: {formatMarathiDate(cow.expected_calving_date)}
                    </p>
                    {overdue ? (
                      <p className="mt-1 text-[18px] font-extrabold text-red-800">
                        {toMarathiNumerals(overdueDays)} दिवस उशीर झाला
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={cow.status} />
                </div>
              </button>
            );
          })}

          {cows.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
              सध्या गाभण गाय नाही.
            </p>
          ) : null}
        </div>
      </section>

      {selectedCow ? (
        <form onSubmit={saveCalving} className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="space-y-5">
              <FormField label="व्यायण तारीख" required>
                <input
                  type="date"
                  value={form.actual_date}
                  onChange={(event) => updateField("actual_date", event.target.value)}
                  required
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <div>
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">
                  वासराचे लिंग <span className="text-tatkal">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {["नर", "मादी"].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => updateField("calf_gender", gender)}
                      className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                        form.calf_gender === gender
                          ? "border-green-300 bg-green-100 text-sheti"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {gender === "नर" ? "🐂 नर" : "🐄 मादी"}
                    </button>
                  ))}
                </div>
              </div>

              <FormField label="वासराचे नाव">
                <input
                  type="text"
                  value={form.calf_name}
                  onChange={(event) => updateField("calf_name", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <FormField label="वासराचे वजन" hint="किलोमध्ये लिहा">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={form.calf_weight}
                  onChange={(event) => updateField("calf_weight", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <FormField label="व्यायणाची नोंद">
                <textarea
                  value={form.calving_notes}
                  onChange={(event) => updateField("calving_notes", event.target.value)}
                  placeholder="सामान्य / कठीण / डॉक्टर बोलावले..."
                  rows={4}
                  className="min-h-[132px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <FormField label="दूध सुरू तारीख">
                <input
                  type="date"
                  value={form.milk_start_date}
                  onChange={(event) => updateField("milk_start_date", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-[19px] font-extrabold text-yellow-900">
                दूध बंद आठवण: {formatMarathiDate(dryOffDate)}
              </p>
            </div>
          </section>

        {success ? (
          <p
            className={`rounded-lg border p-4 text-[20px] font-extrabold ${
              success.startsWith("⏳")
                ? "border-yellow-200 bg-yellow-50 text-yellow-900"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {success}
          </p>
        ) : null}

          {saveError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">
              {saveError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
          >
            {saving ? "⏳ नोंद जतन होत आहे..." : "✅ व्यायण नोंद जतन करा"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
