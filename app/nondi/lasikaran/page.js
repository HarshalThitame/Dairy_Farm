"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CowSelector from "@/components/CowSelector";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";
import {
  autoSuggestVaccinationDate,
  formatMarathiDate,
  getTodayISODate,
  toISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { addLocalReminder, addToPendingSync } from "@/lib/localDB";
import {
  fetchCows as fetchCowsOffline,
  saveHealthRecord
} from "@/lib/offlineActions";
import { isOnline } from "@/lib/networkStatus";
import { registerBackgroundSync } from "@/lib/syncManager";

const vaccineOptions = [
  { value: "खुरपका-तोंडपका", label: "खुरपका-तोंडपका" },
  { value: "घटसर्प", label: "घटसर्प" },
  { value: "हेमोरेजिक सेप्टिसेमिया", label: "हेमोरेजिक सेप्टिसेमिया" },
  { value: "ब्रुसेलोसिस", label: "ब्रुसेलोसिस" },
  { value: "थायलेरिया", label: "थायलेरिया" },
  { value: "जंतनाशक", label: "जंतनाशक" },
  { value: "इतर", label: "इतर" }
];

function buildDescription(vaccineName, batchNumber, dose) {
  const lines = [`लसीचे नाव: ${vaccineName}`];

  if (batchNumber) {
    lines.push(`लस बॅच नंबर: ${batchNumber}`);
  }

  if (dose) {
    lines.push(`दिलेली मात्रा: ${dose}`);
  }

  return lines.join("\n");
}

export default function LasikaranNondPage() {
  const router = useRouter();
  const [mode, setMode] = useState("single");
  const [initialCowId, setInitialCowId] = useState("");
  const [selectedCow, setSelectedCow] = useState(null);
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({
    date: getTodayISODate(),
    vaccine_name: "खुरपका-तोंडपका",
    custom_vaccine_name: "",
    batch_number: "",
    dose: "",
    doctor_name: "",
    cost: "",
    next_due_date: ""
  });
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveTotal, setSaveTotal] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchCows = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const result = await fetchCowsOffline();

      setCows(result.data || []);
    } catch (fetchError) {
      setLoadError(fetchError.message || "गायींची माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitialCowId(params.get("cow_id") || "");
    fetchCows();
  }, [fetchCows]);

  const actualVaccineName = useMemo(() => {
    if (form.vaccine_name === "इतर") {
      return form.custom_vaccine_name.trim();
    }

    return form.vaccine_name;
  }, [form.custom_vaccine_name, form.vaccine_name]);

  useEffect(() => {
    const suggestedDate = autoSuggestVaccinationDate(form.vaccine_name, form.date);
    setForm((currentForm) => ({
      ...currentForm,
      next_due_date: toISODate(suggestedDate)
    }));
  }, [form.date, form.vaccine_name]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
    setError("");
    setSuccess("");
  }

  function buildHealthPayload(cowId, includeNextDueDate) {
    const recordType = actualVaccineName === "जंतनाशक" ? "जंतनाशक" : "लसीकरण";

    return {
      cow_id: cowId,
      date: form.date,
      type: recordType,
      description: buildDescription(
        actualVaccineName,
        form.batch_number.trim(),
        form.dose.trim()
      ),
      doctor_name: form.doctor_name.trim() || null,
      cost: form.cost === "" ? null : Number(form.cost),
      next_due_date: includeNextDueDate ? form.next_due_date : null,
      vaccine_name: actualVaccineName,
      notes: form.next_due_date
        ? `पुढील तारीख: ${formatMarathiDate(form.next_due_date)}`
        : null
    };
  }

  async function postHealthRecord(cowId, includeNextDueDate) {
    const cow = cows.find((item) => item.id === cowId) || selectedCow;
    return saveHealthRecord({
      ...buildHealthPayload(cowId, includeNextDueDate),
      cow,
      cowName: cow?.name || ""
    });
  }

  async function saveSingleCow() {
    if (!selectedCow) {
      setError("गाय निवडा.");
      return;
    }

    const result = await postHealthRecord(selectedCow.id, true);
    setSuccess(
      result.offline
        ? "⏳ लसीकरण नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल."
        : "✅ लसीकरण नोंद जतन झाली! पुढील लसीची आठवण तयार झाली 🔔"
    );
    window.setTimeout(() => router.push(`/gayi/${selectedCow.id}`), 1100);
  }

  async function saveAllCows() {
    if (cows.length === 0) {
      setError("जतन करण्यासाठी गाय उपलब्ध नाही.");
      return;
    }

    setSaveTotal(cows.length);
    setSavedCount(0);

    for (let index = 0; index < cows.length; index += 1) {
      await postHealthRecord(cows[index].id, false);
      setSavedCount(index + 1);
    }

    const reminderPayload = {
      cow_id: null,
      reminder_date: form.next_due_date,
      type: actualVaccineName === "जंतनाशक" ? "जंतनाशक" : "लसीकरण",
      message: `सर्व गायींना ${actualVaccineName} देण्याची वेळ झाली`
    };

    if (isOnline()) {
      const reminderResponse = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reminderPayload)
      });
      const reminderResult = await reminderResponse.json();

      if (!reminderResponse.ok) {
        throw new Error(reminderResult.error || "पुढील आठवण तयार झाली नाही.");
      }
    } else {
      await addLocalReminder(reminderPayload);
      await addToPendingSync({
        type: "CREATE",
        entity: "reminder",
        endpoint: "/api/reminders",
        method: "POST",
        payload: reminderPayload,
        cow_id: null,
        cowName: "",
        createdAt: new Date().toISOString()
      });
      registerBackgroundSync();
    }

    setSuccess(
      isOnline()
        ? `✅ सर्व ${toMarathiNumerals(cows.length)} गायींची लस नोंद जतन झाली!`
        : `⏳ सर्व ${toMarathiNumerals(cows.length)} गायींची लस नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल.`
    );
  }

  async function saveRecord(event) {
    event.preventDefault();

    if (!actualVaccineName) {
      setError("लसीचे नाव आवश्यक आहे.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "single") {
        await saveSingleCow();
      } else {
        await saveAllCows();
      }
    } catch (saveError) {
      setError(saveError.message || "लसीकरण नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState text="गायी लोड होत आहेत..." />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={fetchCows} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="💊 लसीकरण" subtitle="लस आणि जंतनाशक नोंदवा" />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="mb-3 text-[24px] font-extrabold text-slate-950">नोंद कोणासाठी?</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`min-h-[56px] rounded-lg border-2 px-4 text-[19px] font-extrabold ${
              mode === "single"
                ? "border-green-300 bg-green-100 text-sheti"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            🐄 एक गाय
          </button>
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`min-h-[56px] rounded-lg border-2 px-4 text-[19px] font-extrabold ${
              mode === "all"
                ? "border-green-300 bg-green-100 text-sheti"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            🐄 सर्व गायी
          </button>
        </div>

        {mode === "single" ? (
          <div className="mt-4">
            <CowSelector
              selectedCow={selectedCow}
              onSelect={setSelectedCow}
              initialCowId={initialCowId}
              placeholder="गायीचे नाव शोधा..."
            />
          </div>
        ) : (
          <p className="mt-4 rounded-lg border-2 border-green-200 bg-green-50 p-4 text-[20px] font-extrabold text-green-800">
            सर्व {toMarathiNumerals(cows.length)} गायींसाठी नोंद होईल.
          </p>
        )}
      </section>

      <form onSubmit={saveRecord} className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="space-y-5">
            <FormField label="तारीख" required>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                required
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="लसीचे नाव" required>
              <select
                value={form.vaccine_name}
                onChange={(event) => updateField("vaccine_name", event.target.value)}
                required
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              >
                {vaccineOptions.map((vaccine) => (
                  <option key={vaccine.value} value={vaccine.value}>
                    {vaccine.label}
                  </option>
                ))}
              </select>
            </FormField>

            {form.vaccine_name === "इतर" ? (
              <FormField label="लसीचे नाव लिहा" required>
                <MarathiTextInput
                  value={form.custom_vaccine_name}
                  onValueChange={(value) => updateField("custom_vaccine_name", value)}
                  required
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>
            ) : null}

            <FormField label="लस बॅच नंबर">
              <input
                type="text"
                value={form.batch_number}
                onChange={(event) => updateField("batch_number", event.target.value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="दिलेली मात्रा">
              <MarathiTextInput
                value={form.dose}
                onValueChange={(value) => updateField("dose", value)}
                placeholder="उदा. २ मिली"
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="पशुवैद्यकाचे नाव">
              <MarathiTextInput
                value={form.doctor_name}
                onValueChange={(value) => updateField("doctor_name", value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="खर्च (रुपये)">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={form.cost}
                onChange={(event) => updateField("cost", event.target.value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="पुढील लसीची तारीख" required>
              <input
                type="date"
                value={form.next_due_date}
                onChange={(event) => updateField("next_due_date", event.target.value)}
                required
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-[19px] font-extrabold text-yellow-900">
              पुढील तारीख: {formatMarathiDate(form.next_due_date)}
            </p>
          </div>
        </section>

        {saving && mode === "all" ? (
          <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-[20px] font-extrabold text-yellow-900">
            जतन होत आहे... {toMarathiNumerals(savedCount)}/{toMarathiNumerals(saveTotal)}
          </p>
        ) : null}

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

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
        >
          {saving ? "⏳ नोंद जतन होत आहे..." : "✅ लसीकरण नोंद जतन करा"}
        </button>
      </form>
    </div>
  );
}
