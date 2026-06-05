"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CowSelector from "@/components/CowSelector";
import FormField from "@/components/FormField";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";
import VeterinarianSelect from "@/components/settings/VeterinarianSelect";
import { getTodayISODate } from "@/lib/marathiUtils";
import { saveHealthRecord } from "@/lib/offlineActions";

const healthTypes = [
  { value: "आजारपण", label: "🤒 आजारपण" },
  { value: "तपासणी", label: "🔬 तपासणी" },
  { value: "उपचार", label: "💊 उपचार" },
  { value: "जंतनाशक", label: "🪱 जंतनाशक" }
];

export default function ArogyaNondPage() {
  const router = useRouter();
  const [initialCowId, setInitialCowId] = useState("");
  const [selectedCow, setSelectedCow] = useState(null);
  const [form, setForm] = useState({
    date: getTodayISODate(),
    type: "आजारपण",
    description: "",
    doctor_name: "",
    medicine_name: "",
    cost: "",
    next_due_date: ""
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [reminderSuccess, setReminderSuccess] = useState("");
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
    setReminderSuccess("");
  }

  async function saveRecord(event) {
    event.preventDefault();

    if (!selectedCow) {
      setError("गाय निवडा.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    setReminderSuccess("");

    try {
      const result = await saveHealthRecord({
        cow_id: selectedCow.id,
        cowName: selectedCow.name,
        cow: selectedCow,
        date: form.date,
        type: form.type,
        description: form.description.trim(),
        doctor_name: form.doctor_name.trim() || null,
        cost: form.cost === "" ? null : Number(form.cost),
        next_due_date: form.next_due_date || null,
        vaccine_name: form.medicine_name.trim() || null,
        notes: form.medicine_name.trim()
          ? `औषधाचे नाव: ${form.medicine_name.trim()}`
          : null
      });

      setSuccess(
        result.offline
          ? "⏳ आरोग्य नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल."
          : "✅ आरोग्य नोंद जतन झाली!"
      );

      if (form.next_due_date) {
        setReminderSuccess("🔔 पुढील तपासणीची आठवण तयार झाली");
      }

      window.setTimeout(() => router.push(`/gayi/${selectedCow.id}`), 1100);
    } catch (saveError) {
      setError(saveError.message || "आरोग्य नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="🏥 आरोग्य नोंद" subtitle="आजारपण, तपासणी आणि उपचार" />

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
              <FormField label="तारीख" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateField("date", event.target.value)}
                  required
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <div>
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">
                  नोंदीचा प्रकार <span className="text-tatkal">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {healthTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateField("type", type.value)}
                      className={`min-h-[58px] rounded-lg border-2 px-3 text-[18px] font-extrabold ${
                        form.type === type.value
                          ? "border-green-300 bg-green-100 text-sheti"
                          : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <FormField label="लक्षणे / वर्णन" required>
                <MarathiTextInput
                  multiline
                  value={form.description}
                  onValueChange={(value) => updateField("description", value)}
                  placeholder="लक्षणे किंवा उपचाराची माहिती लिहा..."
                  required
                  rows={5}
                  className="min-h-[150px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <VeterinarianSelect
                value={form.doctor_name}
                onChange={(value) => updateField("doctor_name", value)}
              />

              <FormField label="औषधाचे नाव">
                <MarathiTextInput
                  value={form.medicine_name}
                  onValueChange={(value) => updateField("medicine_name", value)}
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

              <FormField label="पुढील तपासणी / उपचार तारीख">
                <input
                  type="date"
                  value={form.next_due_date}
                  onChange={(event) => updateField("next_due_date", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>
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

          {reminderSuccess ? (
            <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-[20px] font-extrabold text-yellow-900">
              {reminderSuccess}
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
            {saving ? "⏳ नोंद जतन होत आहे..." : "✅ आरोग्य नोंद जतन करा"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
