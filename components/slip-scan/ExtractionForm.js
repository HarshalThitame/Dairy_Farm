"use client";

import { useEffect, useMemo, useState } from "react";
import FormField from "@/components/FormField";
import MarathiTextInput from "@/components/MarathiTextInput";
import ConfidenceIndicator from "@/components/slip-scan/ConfidenceIndicator";
import { getTodayISODate, toMarathiCurrency } from "@/lib/marathiUtils";

const inputClass =
  "min-h-[56px] w-full rounded-lg border-2 bg-white px-4 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100";

const missingMap = {
  dairy_name: ["dairy_name", "डेअरीचे नाव"],
  member_number: ["member_number", "dairy_member_number", "सदस्य नंबर"],
  slip_date: ["slip_date", "date", "तारीख"],
  session: ["session", "सत्र"],
  liters: ["liters", "litres", "दूध", "milk"],
  fat_percentage: ["fat_percentage", "fat", "फॅट"],
  snf_percentage: ["snf_percentage", "snf", "SNF"],
  clr_degree: ["clr_degree", "clr", "degree", "डिग्री"],
  rate_per_liter: ["rate_per_liter", "rate", "दर"],
  period_start: ["period_start", "पीरियड सुरू"],
  period_end: ["period_end", "पीरियड शेवट"],
  total_liters: ["total_liters", "total milk", "एकूण दूध"],
  total_milk_income: ["total_milk_income", "income", "उत्पन्न"],
  cattle_feed_deduction: ["cattle_feed_deduction", "खाद्य"],
  other_deductions: ["other_deductions", "कपात"],
  settlement_date: ["settlement_date", "सेटलमेंट तारीख"]
};

function text(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isMissingField(missingFields, field) {
  const aliases = missingMap[field] || [field];
  const normalized = (missingFields || []).map((item) => String(item).toLowerCase());
  return aliases.some((alias) => normalized.some((item) => item.includes(String(alias).toLowerCase())));
}

function buildInitialForm(data = {}) {
  const slipType = data.slip_type === "settlement" ? "settlement" : "daily";
  return {
    slip_type: slipType,
    dairy_name: text(data.dairy_name),
    member_number: text(data.member_number || data.dairy_member_number),
    slip_date: text(data.slip_date),
    session: text(data.session || "सकाळ"),
    liters: text(data.liters),
    fat_percentage: text(data.fat_percentage),
    snf_percentage: text(data.snf_percentage),
    clr_degree: text(data.clr_degree),
    rate_per_liter: text(data.rate_per_liter),
    settlement_date: text(data.settlement_date || getTodayISODate()),
    period_start: text(data.period_start),
    period_end: text(data.period_end),
    total_liters: text(data.total_liters),
    total_milk_income: text(data.total_milk_income),
    cattle_feed_deduction: text(data.cattle_feed_deduction || 0),
    other_deductions: text(data.other_deductions || 0),
    notes: text(data.notes || data.settlement_notes)
  };
}

export default function ExtractionForm({ extractedData, upload, onSave, onRetry, saving = false }) {
  const [form, setForm] = useState(() => buildInitialForm(extractedData));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildInitialForm(extractedData));
    setError("");
  }, [extractedData]);

  const missingFields = extractedData?.missing_fields || [];
  const confidence = Number(extractedData?.confidence_score ?? upload?.ai_confidence ?? 0);
  const totalAmount = useMemo(
    () => numberValue(form.liters) * numberValue(form.rate_per_liter),
    [form.liters, form.rate_per_liter]
  );
  const netPayable = useMemo(
    () =>
      numberValue(form.total_milk_income) -
      numberValue(form.cattle_feed_deduction) -
      numberValue(form.other_deductions),
    [form.total_milk_income, form.cattle_feed_deduction, form.other_deductions]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function fieldClass(field, required = false) {
    const missing = isMissingField(missingFields, field) || (required && !String(form[field] || "").trim());
    if (missing) return `${inputClass} border-red-300 bg-red-50`;
    if (confidence > 0 && confidence < 0.8) return `${inputClass} border-yellow-300 bg-yellow-50`;
    return `${inputClass} border-slate-200`;
  }

  function validate() {
    if (form.slip_type === "daily") {
      if (!form.slip_date) return "तारीख भरा.";
      if (!form.session) return "सत्र निवडा.";
      if (numberValue(form.liters) <= 0) return "दूध लिटर नीट भरा.";
      if (numberValue(form.rate_per_liter) <= 0) return "दर नीट भरा.";
      return "";
    }

    if (!form.period_start || !form.period_end) return "पीरियड तारीख भरा.";
    if (form.period_end < form.period_start) return "पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा.";
    if (numberValue(form.total_milk_income) < 0 || form.total_milk_income === "") return "एकूण उत्पन्न भरा.";
    return "";
  }

  async function submit(event) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    await onSave?.({
      slip_type: form.slip_type,
      extractedData,
      userEdits: form
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-extrabold text-slate-950">AI ने वाचलेली माहिती</h2>
            <p className="mt-1 text-[17px] font-bold text-slate-600">प्रत्येक आकडा तपासूनच जतन करा.</p>
            {upload?.retried ? (
              <p className="mt-2 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[14px] font-extrabold text-blue-800">
                GPT fallback वापरला
              </p>
            ) : null}
          </div>
          <ConfidenceIndicator score={confidence} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["daily", "🥛 दूध स्लिप"],
            ["settlement", "📋 देयक स्लिप"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateField("slip_type", value)}
              className={`min-h-[54px] rounded-lg border-2 px-3 text-[18px] font-extrabold ${
                form.slip_type === value ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-4">
          <FormField label="डेअरीचे नाव">
            <MarathiTextInput value={form.dairy_name} onValueChange={(value) => updateField("dairy_name", value)} className={fieldClass("dairy_name")} />
          </FormField>
          <FormField label="सदस्य नंबर">
            <input value={form.member_number} onChange={(event) => updateField("member_number", event.target.value)} className={fieldClass("member_number")} />
          </FormField>
        </div>
      </section>

      {form.slip_type === "daily" ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="तारीख" required>
                <input type="date" value={form.slip_date} onChange={(event) => updateField("slip_date", event.target.value)} className={fieldClass("slip_date", true)} />
              </FormField>
              <div>
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">सत्र</p>
                <div className="grid grid-cols-2 gap-2">
                  {["सकाळ", "संध्याकाळ"].map((session) => (
                    <button
                      key={session}
                      type="button"
                      onClick={() => updateField("session", session)}
                      className={`min-h-[56px] rounded-lg border-2 px-2 text-[17px] font-extrabold ${
                        form.session === session ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {session}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="दूध लिटर" required>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.liters} onChange={(event) => updateField("liters", event.target.value)} className={`${fieldClass("liters", true)} text-[26px]`} />
              </FormField>
              <FormField label="दर ₹/लि." required>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.rate_per_liter} onChange={(event) => updateField("rate_per_liter", event.target.value)} className={fieldClass("rate_per_liter", true)} />
              </FormField>
              <FormField label="फॅट %">
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.fat_percentage} onChange={(event) => updateField("fat_percentage", event.target.value)} className={fieldClass("fat_percentage")} />
              </FormField>
              <FormField label="SNF %">
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.snf_percentage} onChange={(event) => updateField("snf_percentage", event.target.value)} className={fieldClass("snf_percentage")} />
              </FormField>
              <FormField label="CLR">
                <input value={form.clr_degree} onChange={(event) => updateField("clr_degree", event.target.value)} className={fieldClass("clr_degree")} />
              </FormField>
              <FormField label="एकूण रक्कम">
                <div className="flex min-h-[56px] items-center rounded-lg border-2 border-slate-200 bg-slate-50 px-4 text-[22px] font-extrabold text-green-800">
                  {toMarathiCurrency(totalAmount)}
                </div>
              </FormField>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="सेटलमेंट तारीख">
                <input type="date" value={form.settlement_date} onChange={(event) => updateField("settlement_date", event.target.value)} className={fieldClass("settlement_date")} />
              </FormField>
              <FormField label="पीरियड सुरू" required>
                <input type="date" value={form.period_start} onChange={(event) => updateField("period_start", event.target.value)} className={fieldClass("period_start", true)} />
              </FormField>
              <FormField label="पीरियड शेवट" required>
                <input type="date" value={form.period_end} onChange={(event) => updateField("period_end", event.target.value)} className={fieldClass("period_end", true)} />
              </FormField>
              <FormField label="एकूण दूध">
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.total_liters} onChange={(event) => updateField("total_liters", event.target.value)} className={fieldClass("total_liters")} />
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="space-y-3">
              <FormField label="एकूण उत्पन्न" required>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.total_milk_income} onChange={(event) => updateField("total_milk_income", event.target.value)} className={`${fieldClass("total_milk_income", true)} text-[26px]`} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="खाद्य कपात">
                  <input type="number" inputMode="decimal" min="0" step="0.01" value={form.cattle_feed_deduction} onChange={(event) => updateField("cattle_feed_deduction", event.target.value)} className={fieldClass("cattle_feed_deduction")} />
                </FormField>
                <FormField label="इतर कपात">
                  <input type="number" inputMode="decimal" min="0" step="0.01" value={form.other_deductions} onChange={(event) => updateField("other_deductions", event.target.value)} className={fieldClass("other_deductions")} />
                </FormField>
              </div>
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-green-900">
                <p className="text-[18px] font-extrabold">शुद्ध देय</p>
                <p className="mt-1 text-[30px] font-extrabold">{toMarathiCurrency(netPayable)}</p>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <FormField label="नोंद">
          <MarathiTextInput multiline rows={3} value={form.notes} onValueChange={(value) => updateField("notes", value)} className="min-h-[100px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100" />
        </FormField>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[19px] font-extrabold text-red-800">{error}</p> : null}

      <div className="sticky bottom-24 z-20 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur">
        <button type="button" onClick={onRetry} disabled={saving} className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[18px] font-extrabold text-slate-700 active:bg-slate-100">
          🔄 पुन्हा स्कॅन
        </button>
        <button type="submit" disabled={saving} className="min-h-[56px] rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white disabled:opacity-70 active:bg-green-700">
          {saving ? "जतन होत आहे..." : "✅ तपासले, जतन करा"}
        </button>
      </div>
    </form>
  );
}
