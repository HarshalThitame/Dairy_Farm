"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/FormField";
import MarathiTextInput from "@/components/MarathiTextInput";
import { useAuth } from "@/context/AuthContext";
import { saveDairySlip } from "@/lib/offlineActions";
import { getTodayISODate, toMarathiCurrency } from "@/lib/marathiUtils";
import { getMilkTypeLabel } from "@/lib/marathiLabels";

const inputClass = "min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100";

export default function DairySlipForm({ initialData = null }) {
  const router = useRouter();
  const { farm } = useAuth();
  const [form, setForm] = useState({
    slip_date: initialData?.slip_date || getTodayISODate(),
    slip_time: initialData?.slip_time || "",
    session: initialData?.session || "सकाळ",
    milk_type: initialData?.milk_type || "cow",
    dairy_name: initialData?.dairy_name || farm?.dairyName || "",
    dairy_member_number: initialData?.dairy_member_number || farm?.dairyMemberNumber || "",
    dairy_member_code: initialData?.dairy_member_code || initialData?.dairy_member_number || farm?.dairyMemberNumber || "",
    liters: initialData?.liters || "",
    fat_percentage: initialData?.fat_percentage || "",
    snf_percentage: initialData?.snf_percentage || "",
    clr_degree: initialData?.clr_degree || "",
    clr_score: initialData?.clr_score || initialData?.clr_degree || "",
    rate_per_liter: initialData?.rate_per_liter || farm?.milkRateDefault || "",
    notes: initialData?.notes || "",
    slip_image_url: initialData?.slip_image_url || ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalAmount = useMemo(
    () => Number(form.liters || 0) * Number(form.rate_per_liter || 0),
    [form.liters, form.rate_per_liter]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function validate() {
    if (!form.slip_date) return "तारीख आवश्यक आहे.";
    if (!form.session) return "सत्र निवडा.";
    if (Number(form.liters || 0) <= 0) return "दूधाचे लिटर शून्यापेक्षा जास्त असावे.";
    if (Number(form.rate_per_liter || 0) <= 0) return "दर शून्यापेक्षा जास्त असावा.";
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
      const result = await saveDairySlip(form, initialData?.id || null);
      setSuccess(result.offline ? "⏳ दूध नोंद फोनवर साठवली." : "✅ दूध नोंद जतन झाली!");
      window.setTimeout(() => router.push("/accounting/dairy-slips"), 700);
    } catch (saveError) {
      setError(saveError.message || "दूध नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submitForm} className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="तारीख" required>
            <input type="date" value={form.slip_date} onChange={(event) => updateField("slip_date", event.target.value)} className={inputClass} required />
          </FormField>
          <FormField label="वेळ">
            <input type="time" step="1" value={form.slip_time} onChange={(event) => updateField("slip_time", event.target.value)} className={inputClass} />
          </FormField>

          <div>
            <p className="mb-2 text-[20px] font-extrabold text-slate-900">सत्र <span className="text-tatkal">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              {["सकाळ", "संध्याकाळ"].map((session) => (
                <button
                  key={session}
                  type="button"
                  onClick={() => updateField("session", session)}
                  className={`min-h-[58px] rounded-lg border-2 px-3 text-[20px] font-extrabold ${
                    form.session === session ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
                  }`}
                >
                  {session === "सकाळ" ? "🌅 सकाळ" : "🌆 संध्याकाळ"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="डेअरीचे नाव">
            <MarathiTextInput value={form.dairy_name} onValueChange={(value) => updateField("dairy_name", value)} placeholder="नांदूर डेअरी" className={inputClass} />
          </FormField>
          <FormField label="सदस्य नंबर">
            <input value={form.dairy_member_number} onChange={(event) => updateField("dairy_member_number", event.target.value)} placeholder="ND-1042" className={inputClass} />
          </FormField>
          <FormField label="डेअरी कोड">
            <input value={form.dairy_member_code} onChange={(event) => updateField("dairy_member_code", event.target.value)} placeholder="52" className={inputClass} />
          </FormField>
          <div>
            <p className="mb-2 text-[20px] font-extrabold text-slate-900">दुधाचा प्रकार</p>
            <div className="grid grid-cols-2 gap-3">
              {["cow", "buffalo"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField("milk_type", type)}
                  className={`min-h-[56px] rounded-lg border-2 px-3 text-[19px] font-extrabold ${
                    form.milk_type === type ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
                  }`}
                >
                  {getMilkTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="दूधाचे लिटर" required>
            <input autoFocus type="number" inputMode="decimal" min="0" step="0.25" value={form.liters} onChange={(event) => updateField("liters", event.target.value)} placeholder="०.००" className={`${inputClass} text-[26px] font-extrabold`} required />
          </FormField>
          <div className="grid grid-cols-3 gap-2">
            <FormField label="फॅट %">
              <input type="number" inputMode="decimal" min="0" step="0.1" value={form.fat_percentage} onChange={(event) => updateField("fat_percentage", event.target.value)} placeholder="३.५" className={inputClass} />
            </FormField>
            <FormField label="SNF %">
              <input type="number" inputMode="decimal" min="0" step="0.1" value={form.snf_percentage} onChange={(event) => updateField("snf_percentage", event.target.value)} placeholder="८.२" className={inputClass} />
            </FormField>
            <FormField label="CLR">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.1"
                value={form.clr_score || form.clr_degree}
                onChange={(event) => {
                  updateField("clr_score", event.target.value);
                  updateField("clr_degree", event.target.value);
                }}
                placeholder="३०.०"
                className={inputClass}
              />
            </FormField>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-5">
          <FormField label="दर (₹/लिटर)" required>
            <input type="number" inputMode="decimal" min="0" step="0.5" value={form.rate_per_liter} onChange={(event) => updateField("rate_per_liter", event.target.value)} placeholder="३२.००" className={inputClass} required />
          </FormField>
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-green-900">
            <p className="text-[18px] font-extrabold">एकूण रक्कम</p>
            <p className="mt-1 text-[32px] font-extrabold">{toMarathiCurrency(totalAmount)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <FormField label="नोंद">
          <MarathiTextInput multiline rows={4} value={form.notes} onValueChange={(value) => updateField("notes", value)} placeholder="कोणतीही अतिरिक्त माहिती..." className="min-h-[120px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100" />
        </FormField>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">{error}</p> : null}
      {success ? <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-[20px] font-extrabold text-green-800">{success}</p> : null}

      <div className="sticky bottom-24 z-20 grid gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur">
        <button type="submit" disabled={saving} className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white disabled:opacity-70 active:bg-green-700">
          {saving ? "⏳ जतन होत आहे..." : "✅ दूध नोंद जतन करा"}
        </button>
        <button type="button" onClick={() => router.back()} className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[19px] font-extrabold text-slate-700 active:bg-slate-100">
          ← मागे जा
        </button>
      </div>
    </form>
  );
}
