"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CowSelector from "@/components/CowSelector";
import FormField from "@/components/FormField";
import PageHeader from "@/components/PageHeader";
import {
  addDaysToDate,
  formatMarathiDate,
  getTodayISODate,
  toISODate
} from "@/lib/marathiUtils";
import { saveAIRecord } from "@/lib/offlineActions";

const breedOptions = [
  { value: "HF", label: "एच एफ" },
  { value: "गीर", label: "गीर" },
  { value: "साहिवाल", label: "साहिवाल" },
  { value: "जर्सी", label: "जर्सी" },
  { value: "देशी", label: "देशी" },
  { value: "इतर", label: "इतर" }
];

export default function RetanNondPage() {
  const router = useRouter();
  const [initialCowId, setInitialCowId] = useState("");
  const [selectedCow, setSelectedCow] = useState(null);
  const [form, setForm] = useState({
    ai_date: getTodayISODate(),
    bull_code: "",
    bull_breed: "",
    doctor_name: "",
    cost: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitialCowId(params.get("cow_id") || "");
  }, []);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
    setError("");
    setSuccess("");
  }

  const calculatedDates = useMemo(() => {
    return {
      pregnancyCheckDate: toISODate(addDaysToDate(form.ai_date, 60)),
      expectedCalvingDate: toISODate(addDaysToDate(form.ai_date, 270))
    };
  }, [form.ai_date]);

  async function saveRecord(event) {
    event.preventDefault();

    if (!selectedCow) {
      setError("गाय निवडा.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await saveAIRecord({
        cow_id: selectedCow.id,
        cowName: selectedCow.name,
        cow: selectedCow,
        ai_date: form.ai_date,
        bull_code: form.bull_code.trim() || null,
        bull_breed: form.bull_breed || null,
        doctor_name: form.doctor_name.trim() || null,
        cost: form.cost === "" ? null : Number(form.cost),
        pregnancy_check_date: calculatedDates.pregnancyCheckDate,
        pregnancy_result: "pending",
        notes: form.notes.trim() || null
      });

      setSuccess(
        result.offline
          ? "⏳ रेतन नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल."
          : "✅ रेतन नोंद जतन झाली! आठवणी आपोआप तयार झाल्या 🔔"
      );
      window.setTimeout(() => router.push(`/gayi/${selectedCow.id}`), 1000);
    } catch (saveError) {
      setError(saveError.message || "रेतन नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="💉 कृत्रिम रेतन नोंद" subtitle="गाय आणि रेतन माहिती भरा" />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="mb-3 text-[24px] font-extrabold text-slate-950">गाय निवडा</h2>
        <CowSelector
          selectedCow={selectedCow}
          onSelect={setSelectedCow}
          initialCowId={initialCowId}
          placeholder="गायीचे नाव शोधा..."
        />
      </section>

      {selectedCow ? (
        <form onSubmit={saveRecord} className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="space-y-5">
              <FormField label="रेतन तारीख" required>
                <input
                  type="date"
                  value={form.ai_date}
                  onChange={(event) => updateField("ai_date", event.target.value)}
                  required
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <FormField label="सिमेन / बैल कोड">
                <input
                  type="text"
                  value={form.bull_code}
                  onChange={(event) => updateField("bull_code", event.target.value)}
                  placeholder="उदा. एच एफ-२३४१"
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <FormField label="बैलाची जात">
                <select
                  value={form.bull_breed}
                  onChange={(event) => updateField("bull_breed", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                >
                  <option value="">जात निवडा</option>
                  {breedOptions.map((breed) => (
                    <option key={breed.value} value={breed.value}>
                      {breed.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="पशुवैद्यकाचे नाव">
                <input
                  type="text"
                  value={form.doctor_name}
                  onChange={(event) => updateField("doctor_name", event.target.value)}
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
                  placeholder="०"
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <FormField label="इतर नोंद">
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={4}
                  className="min-h-[132px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
            <p className="text-[20px] font-extrabold leading-relaxed text-yellow-900">
              📅 या तारखांच्या आठवणी आपोआप तयार होतील
            </p>
            <p className="mt-3 text-[19px] font-bold text-slate-800">
              गर्भधारणा तपासणी: {formatMarathiDate(calculatedDates.pregnancyCheckDate)}
            </p>
            <p className="mt-2 text-[19px] font-bold text-slate-800">
              अपेक्षित व्यायण: {formatMarathiDate(calculatedDates.expectedCalvingDate)}
            </p>
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
            {saving ? "⏳ नोंद जतन होत आहे..." : "💉 रेतन नोंद जतन करा"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
