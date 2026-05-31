"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import MarathiTextInput from "@/components/MarathiTextInput";
import ReconciliationViewer from "@/components/accounting/ReconciliationViewer";
import { useAuth } from "@/context/AuthContext";
import { saveSettlement } from "@/lib/offlineActions";
import { getTodayISODate, toMarathiCurrency } from "@/lib/marathiUtils";

const inputClass = "min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100";

function addDays(dateString, days) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function SettlementForm({ initialData = null, initialReconciliation = null }) {
  const router = useRouter();
  const { farm } = useAuth();
  const today = getTodayISODate();
  const [form, setForm] = useState({
    settlement_date: initialData?.settlement_date || today,
    period_start: initialData?.period_start || addDays(today, -14),
    period_end: initialData?.period_end || today,
    dairy_name: initialData?.dairy_name || farm?.dairyName || "",
    dairy_member_number: initialData?.dairy_member_number || farm?.dairyMemberNumber || "",
    total_liters: initialData?.total_liters || "",
    total_milk_income: initialData?.total_milk_income || "",
    cattle_feed_deduction: initialData?.cattle_feed_deduction || "",
    other_deductions: initialData?.other_deductions || "",
    payment_received: Boolean(initialData?.payment_received),
    payment_received_date: initialData?.payment_received_date || today,
    payment_received_amount: initialData?.payment_received_amount || "",
    discrepancy_notes: initialData?.discrepancy_notes || "",
    settlement_notes: initialData?.settlement_notes || "",
    settlement_image_url: initialData?.settlement_image_url || ""
  });
  const [reconciliation, setReconciliation] = useState(initialReconciliation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totals = useMemo(() => {
    const deductions =
      Number(form.cattle_feed_deduction || 0) +
      Number(form.other_deductions || 0);
    const netPayable = Number(form.total_milk_income || 0) - deductions;
    return { deductions, netPayable };
  }, [form.cattle_feed_deduction, form.other_deductions, form.total_milk_income]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.settlement_date || !form.period_start || !form.period_end) return "सेटलमेंट तारीख आणि पीरियड आवश्यक आहे.";
    if (form.period_end < form.period_start) return "पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा.";
    if (form.total_milk_income === "" || Number(form.total_milk_income || 0) <= 0) return "एकूण उत्पन्न लिहा.";
    if (Number(form.cattle_feed_deduction || 0) < 0 || Number(form.other_deductions || 0) < 0) {
      return "कपात शून्य किंवा त्यापेक्षा जास्त असावी.";
    }
    return "";
  }

  function readPhoto(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField("settlement_image_url", String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function submitForm(event) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await saveSettlement(form, initialData?.id || null);
      setReconciliation(result.result?.reconciliation || null);
      setSuccess(result.offline ? "⏳ सेटलमेंट फोनवर साठवले." : "✅ सेटलमेंट जतन झाले!");
      window.setTimeout(() => router.push("/accounting/settlements"), 1000);
    } catch (saveError) {
      setError(saveError.message || "सेटलमेंट जतन झाले नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submitForm} className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="सेटलमेंट तारीख" required>
            <input type="date" value={form.settlement_date} onChange={(event) => updateField("settlement_date", event.target.value)} className={inputClass} required />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="पीरियड सुरू" required>
              <input type="date" value={form.period_start} onChange={(event) => updateField("period_start", event.target.value)} className={inputClass} required />
            </FormField>
            <FormField label="पीरियड शेवट" required hint="साधारणपणे १५ दिवस">
              <input type="date" value={form.period_end} onChange={(event) => updateField("period_end", event.target.value)} className={inputClass} required />
            </FormField>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="डेअरीचे नाव">
            <MarathiTextInput value={form.dairy_name} onValueChange={(value) => updateField("dairy_name", value)} className={inputClass} />
          </FormField>
          <FormField label="सदस्य नंबर">
            <input value={form.dairy_member_number} onChange={(event) => updateField("dairy_member_number", event.target.value)} className={inputClass} />
          </FormField>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="एकूण दूध (लिटर)">
            <input type="number" inputMode="decimal" min="0" step="0.25" value={form.total_liters} onChange={(event) => updateField("total_liters", event.target.value)} className={inputClass} />
          </FormField>
          <FormField label="दूध उत्पन्न" required>
            <input autoFocus type="number" inputMode="decimal" min="0" step="1" value={form.total_milk_income} onChange={(event) => updateField("total_milk_income", event.target.value)} className={`${inputClass} text-[26px] font-extrabold`} required />
          </FormField>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="खाद्य कपात" hint="डेअरी द्वारा खाद्यासाठी कपात">
            <input type="number" inputMode="decimal" min="0" step="1" value={form.cattle_feed_deduction} onChange={(event) => updateField("cattle_feed_deduction", event.target.value)} className={inputClass} />
          </FormField>
          <FormField label="इतर कपात" hint="परिवहन, सरासुवाई, अन्य खर्च">
            <input type="number" inputMode="decimal" min="0" step="1" value={form.other_deductions} onChange={(event) => updateField("other_deductions", event.target.value)} className={inputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-red-50 p-4 text-red-900">
              <p className="text-[17px] font-extrabold">एकूण कपात</p>
              <p className="mt-1 text-[24px] font-extrabold">{toMarathiCurrency(totals.deductions)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-green-900">
              <p className="text-[17px] font-extrabold">शुद्ध देय</p>
              <p className="mt-1 text-[24px] font-extrabold">{toMarathiCurrency(totals.netPayable)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <p className="mb-2 text-[20px] font-extrabold text-slate-900">पेमेंट प्राप्त झाली?</p>
        <div className="grid grid-cols-2 gap-3">
          {[false, true].map((value) => (
            <button key={String(value)} type="button" onClick={() => updateField("payment_received", value)} className={`min-h-[56px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${form.payment_received === value ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700"}`}>
              {value ? "हो" : "नाही"}
            </button>
          ))}
        </div>
        {form.payment_received ? (
          <div className="mt-4 grid gap-4">
            <FormField label="पेमेंट तारीख">
              <input type="date" value={form.payment_received_date} onChange={(event) => updateField("payment_received_date", event.target.value)} className={inputClass} />
            </FormField>
            <FormField label="प्राप्त रक्कम">
              <input type="number" inputMode="decimal" min="0" value={form.payment_received_amount} onChange={(event) => updateField("payment_received_amount", event.target.value)} placeholder={String(totals.netPayable)} className={inputClass} />
            </FormField>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="फरकाचे कारण">
            <MarathiTextInput multiline rows={3} value={form.discrepancy_notes} onValueChange={(value) => updateField("discrepancy_notes", value)} className="min-h-[100px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100" />
          </FormField>
          <FormField label="अतिरिक्त नोंद">
            <MarathiTextInput multiline rows={3} value={form.settlement_notes} onValueChange={(value) => updateField("settlement_notes", value)} className="min-h-[100px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100" />
          </FormField>
          <FormField label="सेटलमेंट स्लिप फोटो">
            <input type="file" accept="image/*" onChange={readPhoto} className="block w-full text-[18px] font-bold text-slate-700 file:mr-3 file:min-h-[48px] file:rounded-lg file:border-0 file:bg-green-100 file:px-4 file:text-[18px] file:font-extrabold file:text-sheti" />
          </FormField>
        </div>
      </section>

      <ReconciliationViewer reconciliation={reconciliation} />

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">{error}</p> : null}
      {success ? <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-[20px] font-extrabold text-green-800">{success}</p> : null}

      <div className="sticky bottom-24 z-20 grid gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur">
        <button type="submit" disabled={saving} className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white disabled:opacity-70 active:bg-green-700">
          {saving ? "⏳ जतन होत आहे..." : "✅ सेटलमेंट जतन करा"}
        </button>
        <button type="button" onClick={() => router.back()} className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[19px] font-extrabold text-slate-700 active:bg-slate-100">
          ← मागे जा
        </button>
      </div>
    </form>
  );
}
