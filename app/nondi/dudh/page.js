"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  formatCurrency,
  formatLitres,
  formatMarathiDate,
  getTodayISODate
} from "@/lib/marathiUtils";
import { fetchMilkByDate, saveMilkRecord } from "@/lib/offlineActions";

const inputClass =
  "min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100";

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function inputValue(value, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function emptyForm(defaultRate = "") {
  return {
    id: null,
    morning_litres: "",
    evening_litres: "",
    morning_price_per_litre: defaultRate,
    evening_price_per_litre: defaultRate,
    morning_fat_percentage: "",
    evening_fat_percentage: "",
    morning_snf_value: "",
    evening_snf_value: "",
    morning_degree_reading: "",
    evening_degree_reading: "",
    notes: ""
  };
}

function recordToForm(record, defaultRate = "") {
  if (!record) {
    return emptyForm(defaultRate);
  }

  return {
    id: record.id || null,
    morning_litres: inputValue(record.morning_litres),
    evening_litres: inputValue(record.evening_litres),
    morning_price_per_litre: inputValue(
      record.morning_price_per_litre ?? record.price_per_litre,
      defaultRate
    ),
    evening_price_per_litre: inputValue(
      record.evening_price_per_litre ?? record.price_per_litre,
      defaultRate
    ),
    morning_fat_percentage: inputValue(
      record.morning_fat_percentage ?? record.fat_percentage
    ),
    evening_fat_percentage: inputValue(
      record.evening_fat_percentage ?? record.fat_percentage
    ),
    morning_snf_value: inputValue(record.morning_snf_value ?? record.snf_value),
    evening_snf_value: inputValue(record.evening_snf_value ?? record.snf_value),
    morning_degree_reading: inputValue(
      record.morning_degree_reading ?? record.degree_reading
    ),
    evening_degree_reading: inputValue(
      record.evening_degree_reading ?? record.degree_reading
    ),
    notes: record.notes || ""
  };
}

function getAmount(form) {
  return (
    toNumber(form.morning_litres) * toNumber(form.morning_price_per_litre) +
    toNumber(form.evening_litres) * toNumber(form.evening_price_per_litre)
  );
}

function MilkSessionFields({ title, litresField, rateField, fatField, snfField, degreeField, form, updateField }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-[23px] font-extrabold text-slate-950">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <FormField label="दूध लिटर" required>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="5000"
            step="0.5"
            value={form[litresField]}
            onChange={(event) => updateField(litresField, event.target.value)}
            placeholder="०.०"
            className={inputClass}
          />
        </FormField>
        <FormField label="दर/लि.">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="200"
            step="0.5"
            value={form[rateField]}
            onChange={(event) => updateField(rateField, event.target.value)}
            placeholder="३२"
            className={inputClass}
          />
        </FormField>
        <FormField label="फॅट %">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="20"
            step="0.1"
            value={form[fatField]}
            onChange={(event) => updateField(fatField, event.target.value)}
            placeholder="४.०"
            className={inputClass}
          />
        </FormField>
        <FormField label="SNF">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="20"
            step="0.1"
            value={form[snfField]}
            onChange={(event) => updateField(snfField, event.target.value)}
            placeholder="८.५"
            className={inputClass}
          />
        </FormField>
        <FormField label="डिग्री">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="0.1"
            value={form[degreeField]}
            onChange={(event) => updateField(degreeField, event.target.value)}
            placeholder="२८"
            className={inputClass}
          />
        </FormField>
      </div>
    </section>
  );
}

export default function DudhNondPage() {
  const { farm } = useAuth();
  const today = getTodayISODate();
  const defaultRate = inputValue(farm?.milkRateDefault, "32");
  const previousDefaultRate = useRef(defaultRate);
  const [selectedDate, setSelectedDate] = useState(today);
  const [form, setForm] = useState(() => emptyForm(defaultRate));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");

    if (dateParam === "today") {
      setSelectedDate(today);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam || "")) {
      setSelectedDate(dateParam);
    }
  }, [today]);

  useEffect(() => {
    setForm((currentForm) => ({
      ...currentForm,
      morning_price_per_litre:
        !currentForm.morning_price_per_litre ||
        currentForm.morning_price_per_litre === previousDefaultRate.current
          ? defaultRate
          : currentForm.morning_price_per_litre,
      evening_price_per_litre:
        !currentForm.evening_price_per_litre ||
        currentForm.evening_price_per_litre === previousDefaultRate.current
          ? defaultRate
          : currentForm.evening_price_per_litre
    }));
    previousDefaultRate.current = defaultRate;
  }, [defaultRate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await fetchMilkByDate(selectedDate);
      const overallRecord =
        (result.data || []).find((record) => !record.cow_id) || (result.data || [])[0] || null;

      setForm(recordToForm(overallRecord, defaultRate));
    } catch (fetchError) {
      setError(fetchError.message || "दूध नोंद मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [defaultRate, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
    setError("");
    setSuccess("");
  }

  const morningAmount = useMemo(
    () => toNumber(form.morning_litres) * toNumber(form.morning_price_per_litre),
    [form.morning_litres, form.morning_price_per_litre]
  );
  const eveningAmount = useMemo(
    () => toNumber(form.evening_litres) * toNumber(form.evening_price_per_litre),
    [form.evening_litres, form.evening_price_per_litre]
  );
  const totalMilk = toNumber(form.morning_litres) + toNumber(form.evening_litres);
  const totalAmount = getAmount(form);
  const offlineSuccess = success.startsWith("⏳");

  async function saveRecord(event) {
    event.preventDefault();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      setError("तारीख चुकीची आहे.");
      return;
    }

    if (selectedDate > today) {
      setError("भविष्यातील तारीख वापरता येणार नाही.");
      return;
    }

    if (totalMilk <= 0) {
      setError("दूधाचे एकूण लिटर भरा.");
      return;
    }

    if (totalMilk > 10000) {
      setError("दूधाचे लिटर असामान्य आहे. कृपया तपासा.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await saveMilkRecord({
        id: form.id,
        cow_id: null,
        date: selectedDate,
        morning_litres: toNumber(form.morning_litres),
        evening_litres: toNumber(form.evening_litres),
        price_per_litre: null,
        morning_price_per_litre: toOptionalNumber(form.morning_price_per_litre),
        evening_price_per_litre: toOptionalNumber(form.evening_price_per_litre),
        fat_percentage: null,
        morning_fat_percentage: toOptionalNumber(form.morning_fat_percentage),
        evening_fat_percentage: toOptionalNumber(form.evening_fat_percentage),
        snf_value: null,
        morning_snf_value: toOptionalNumber(form.morning_snf_value),
        evening_snf_value: toOptionalNumber(form.evening_snf_value),
        degree_reading: null,
        morning_degree_reading: toOptionalNumber(form.morning_degree_reading),
        evening_degree_reading: toOptionalNumber(form.evening_degree_reading),
        notes: form.notes.trim() || null
      });

      setForm(recordToForm(result.data, defaultRate));
      setSuccess(
        result.offline
          ? `⏳ दूध नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल. एकूण ${formatLitres(totalMilk)} लिटर.`
          : `✅ दूध नोंद जतन झाली! एकूण ${formatLitres(totalMilk)} लिटर, रक्कम ${formatCurrency(totalAmount)}`
      );
    } catch (saveError) {
      setError(saveError.message || "दूध नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState text="दूध नोंद लोड होत आहे..." />;
  }

  return (
    <form onSubmit={saveRecord} className="space-y-5 pb-24">
      <PageHeader title="🥛 दूध नोंद" subtitle="सर्व गायींचे एकत्रित दैनिक दूध" />

      {error ? <ErrorState message={error} onRetry={fetchData} /> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <FormField label="तारीख" required>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              required
              max={today}
              className={inputClass}
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

      <section className="grid grid-cols-2 gap-3" aria-label="दूध सारांश">
        <article className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-[18px] font-extrabold text-blue-900">एकूण दूध</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-blue-950">
            {formatLitres(totalMilk)} लि.
          </p>
        </article>
        <article className="rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="text-[18px] font-extrabold text-green-900">एकूण रक्कम</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-green-950">
            {formatCurrency(totalAmount)}
          </p>
        </article>
      </section>

      <MilkSessionFields
        title={`सकाळचे दूध - ${formatCurrency(morningAmount)}`}
        litresField="morning_litres"
        rateField="morning_price_per_litre"
        fatField="morning_fat_percentage"
        snfField="morning_snf_value"
        degreeField="morning_degree_reading"
        form={form}
        updateField={updateField}
      />

      <MilkSessionFields
        title={`संध्याकाळचे दूध - ${formatCurrency(eveningAmount)}`}
        litresField="evening_litres"
        rateField="evening_price_per_litre"
        fatField="evening_fat_percentage"
        snfField="evening_snf_value"
        degreeField="evening_degree_reading"
        form={form}
        updateField={updateField}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <FormField label="नोंद">
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            className="min-h-[96px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
          />
        </FormField>
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

      <button
        type="submit"
        disabled={saving}
        className="min-h-[58px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
      >
        {saving ? "दूध नोंद जतन होत आहे..." : "दैनिक दूध जतन करा"}
      </button>
    </form>
  );
}
