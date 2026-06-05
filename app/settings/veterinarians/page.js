"use client";

import { useCallback, useEffect, useState } from "react";
import FormField from "@/components/FormField";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";

const emptyForm = {
  name: "",
  mobile: "",
  village: "",
  notes: "",
  is_active: true
};

export default function VeterinariansSettingsPage() {
  const [veterinarians, setVeterinarians] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadVeterinarians = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/settings/veterinarians", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "पशुवैद्यकांची यादी मिळाली नाही.");
      }

      setVeterinarians(result.data || []);
    } catch (loadError) {
      setError(loadError.message || "पशुवैद्यकांची यादी मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVeterinarians();
  }, [loadVeterinarians]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
    setError("");
  }

  function startEdit(doctor) {
    setEditingId(doctor.id);
    setForm({
      name: doctor.name || "",
      mobile: doctor.mobile || "",
      village: doctor.village || "",
      notes: doctor.notes || "",
      is_active: doctor.isActive
    });
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveVeterinarian(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = editingId
        ? `/api/settings/veterinarians/${editingId}`
        : "/api/settings/veterinarians";
      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "पशुवैद्यक जतन झाले नाहीत.");
      }

      setSuccess(editingId ? "✅ पशुवैद्यकाची माहिती बदलली." : "✅ पशुवैद्यक जोडले.");
      resetForm();
      await loadVeterinarians();
    } catch (saveError) {
      setError(saveError.message || "पशुवैद्यक जतन झाले नाहीत.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVeterinarian(doctor) {
    if (!window.confirm(`${doctor.name} काढायचे का? जुन्या नोंदींवर परिणाम होणार नाही.`)) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/settings/veterinarians/${doctor.id}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "पशुवैद्यक delete झाले नाहीत.");
      }

      setSuccess("✅ पशुवैद्यक यादीतून काढले.");
      await loadVeterinarians();
    } catch (deleteError) {
      setError(deleteError.message || "पशुवैद्यक delete झाले नाहीत.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(doctor) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/settings/veterinarians/${doctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !doctor.isActive })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "स्थिती बदलली नाही.");
      }

      setSuccess(!doctor.isActive ? "✅ पशुवैद्यक active केले." : "✅ पशुवैद्यक inactive केले.");
      await loadVeterinarians();
    } catch (toggleError) {
      setError(toggleError.message || "स्थिती बदलली नाही.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="🩺 पशुवैद्यक सेटिंग्ज"
        subtitle="तुमच्या डेअरीसाठी पशुवैद्यकांची नावे जोडा. नोंदी करताना dropdown मधून निवडता येईल."
      />

      <form onSubmit={saveVeterinarian} className="rounded-2xl border border-green-100 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-black text-slate-950">
              {editingId ? "माहिती बदला" : "नवीन पशुवैद्यक जोडा"}
            </h2>
            <p className="mt-1 text-[16px] font-bold text-slate-600">
              नाव आवश्यक आहे. मोबाईल, गाव आणि नोंद optional आहेत.
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[15px] font-black text-slate-700"
            >
              रद्द
            </button>
          ) : null}
        </div>

        <div className="space-y-4">
          <FormField label="पशुवैद्यकाचे नाव" required>
            <MarathiTextInput
              value={form.name}
              onValueChange={(value) => updateField("name", value)}
              required
              placeholder="उदा. डॉ. पाटील"
              className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="मोबाईल नंबर">
              <input
                type="tel"
                value={form.mobile}
                onChange={(event) => updateField("mobile", event.target.value)}
                placeholder="९८७६५४३२१०"
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>

            <FormField label="गाव / ठिकाण">
              <MarathiTextInput
                value={form.village}
                onValueChange={(value) => updateField("village", value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
              />
            </FormField>
          </div>

          <FormField label="नोंद">
            <MarathiTextInput
              multiline
              value={form.notes}
              onValueChange={(value) => updateField("notes", value)}
              rows={3}
              placeholder="उदा. गर्भ तपासणीसाठी उपलब्ध"
              className="min-h-[112px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
            />
          </FormField>

          <label className="flex min-h-[56px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">
            <span className="text-[18px] font-black text-slate-800">Dropdown मध्ये दाखवा</span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => updateField("is_active", event.target.checked)}
              className="h-6 w-6 accent-green-600"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[17px] font-extrabold text-red-800">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-[17px] font-extrabold text-green-800">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 min-h-[58px] w-full rounded-xl bg-sheti px-5 text-[20px] font-black text-white shadow-sm disabled:opacity-70"
        >
          {saving ? "⏳ जतन होत आहे..." : editingId ? "✅ बदल जतन करा" : "➕ पशुवैद्यक जोडा"}
        </button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-black text-slate-950">जोडलेले पशुवैद्यक</h2>
            <p className="mt-1 text-[16px] font-bold text-slate-600">
              Active नावे लसीकरण, आरोग्य आणि रेतन forms मध्ये दिसतील.
            </p>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-[15px] font-black text-sheti">
            {veterinarians.length}
          </span>
        </div>

        {loading ? (
          <p className="rounded-xl bg-slate-50 p-4 text-[18px] font-bold text-slate-600">
            यादी लोड होत आहे...
          </p>
        ) : null}

        {!loading && veterinarians.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-[18px] font-bold text-slate-600">
            अजून कोणतेही पशुवैद्यक जोडलेले नाहीत.
          </p>
        ) : null}

        <div className="space-y-3">
          {veterinarians.map((doctor) => (
            <article
              key={doctor.id}
              className={`rounded-xl border p-4 ${
                doctor.isActive
                  ? "border-green-100 bg-green-50/60"
                  : "border-slate-200 bg-slate-50 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-[21px] font-black text-slate-950">{doctor.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-[15px] font-extrabold">
                    {doctor.mobile ? (
                      <span className="rounded-full bg-white px-3 py-1 text-slate-700">📞 {doctor.mobile}</span>
                    ) : null}
                    {doctor.village ? (
                      <span className="rounded-full bg-white px-3 py-1 text-slate-700">📍 {doctor.village}</span>
                    ) : null}
                    <span
                      className={`rounded-full px-3 py-1 ${
                        doctor.isActive ? "bg-green-600 text-white" : "bg-slate-300 text-slate-800"
                      }`}
                    >
                      {doctor.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {doctor.notes ? (
                    <p className="mt-3 whitespace-pre-line text-[16px] font-bold text-slate-600">
                      {doctor.notes}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(doctor)}
                  disabled={saving}
                  className="min-h-[46px] rounded-xl border border-slate-200 bg-white text-[15px] font-black text-slate-800"
                >
                  संपादित
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(doctor)}
                  disabled={saving}
                  className="min-h-[46px] rounded-xl border border-yellow-200 bg-yellow-50 text-[15px] font-black text-yellow-900"
                >
                  {doctor.isActive ? "लपवा" : "दाखवा"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteVeterinarian(doctor)}
                  disabled={saving}
                  className="min-h-[46px] rounded-xl border border-red-200 bg-red-50 text-[15px] font-black text-red-700"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
