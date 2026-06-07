"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import MarathiTextInput from "@/components/MarathiTextInput";
import { accountingExpenseCategories, expenseCategoryMeta } from "@/lib/accountingUtils";
import { saveAccountingExpense } from "@/lib/offlineActions";
import { getTodayISODate } from "@/lib/marathiUtils";

const inputClass = "min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100";

function isISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function parseAmount(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

export default function ExpenseForm({ initialData = null }) {
  const router = useRouter();
  const today = getTodayISODate();
  const [form, setForm] = useState({
    expense_date: initialData?.expense_date || today,
    category: initialData?.category || "औषध",
    amount: initialData?.amount || "",
    description: initialData?.description || "",
    vendor_name: initialData?.vendor_name || ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.expense_date) return "तारीख आवश्यक आहे.";
    if (!isISODate(form.expense_date)) return "तारीख चुकीची आहे.";
    if (form.expense_date > today) return "भविष्यातील तारीख वापरता येणार नाही.";
    if (!form.category) return "खर्चाचा वर्ग निवडा.";
    const amount = parseAmount(form.amount);
    if (amount === null || amount <= 0) return "रक्कम शून्यापेक्षा जास्त असावी.";
    if (amount > 10000000) return "रक्कम असामान्य आहे. कृपया तपासा.";
    return "";
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
      const result = await saveAccountingExpense(form, initialData?.id || null);
      setSuccess(result.offline ? "⏳ खर्च फोनवर साठवला." : "✅ खर्च जतन झाला!");
      window.setTimeout(() => router.push("/accounting/expenses"), 700);
    } catch (saveError) {
      setError(saveError.message || "खर्च जतन झाला नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submitForm} className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="तारीख" required>
            <input type="date" value={form.expense_date} max={today} onChange={(event) => updateField("expense_date", event.target.value)} className={inputClass} required />
          </FormField>
          <div>
            <p className="mb-2 text-[20px] font-extrabold text-slate-900">वर्ग <span className="text-tatkal">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              {accountingExpenseCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => updateField("category", category)}
                  className={`min-h-[58px] rounded-lg border-2 px-3 text-[19px] font-extrabold ${
                    form.category === category ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
                  }`}
                >
                  {expenseCategoryMeta[category]?.emoji} {expenseCategoryMeta[category]?.label || category}
                </button>
              ))}
            </div>
            {form.category === "चारा" ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[17px] font-extrabold leading-snug text-amber-900">
                खाद्य रक्कम इथे नोंदवल्यावर ती मासिक खर्च आणि नफा-तोट्यात धरली जाईल.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="रक्कम" required>
            <input autoFocus type="number" inputMode="decimal" min="0" max="10000000" step="1" value={form.amount} onChange={(event) => updateField("amount", event.target.value)} placeholder="०" className={`${inputClass} text-[26px] font-extrabold`} required />
          </FormField>
          <FormField label="विवरण">
            <MarathiTextInput value={form.description} onValueChange={(value) => updateField("description", value)} placeholder="उदा. अमचूर चारा" className={inputClass} />
          </FormField>
          <FormField label="विक्रेता नाव">
            <MarathiTextInput value={form.vendor_name} onValueChange={(value) => updateField("vendor_name", value)} placeholder="उदा. राज सप्लाई" className={inputClass} />
          </FormField>
        </div>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">{error}</p> : null}
      {success ? <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-[20px] font-extrabold text-green-800">{success}</p> : null}

      <div className="sticky bottom-24 z-20 grid gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur">
        <button type="submit" disabled={saving} className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white disabled:opacity-70 active:bg-green-700">
          {saving ? "⏳ जतन होत आहे..." : "✅ खर्च जतन करा"}
        </button>
        <button type="button" onClick={() => router.back()} className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[19px] font-extrabold text-slate-700 active:bg-slate-100">
          ← मागे जा
        </button>
      </div>
    </form>
  );
}
