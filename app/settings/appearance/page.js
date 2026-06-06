"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { applyAppearancePreferences } from "@/components/settings/AppearanceBoot";
import { getClientAuthHeaders } from "@/lib/clientStorage";

const themeOptions = [
  ["light", "☀️ Light"],
  ["dark", "🌙 Dark"],
  ["system", "📱 System"]
];

const fontOptions = [
  ["small", "लहान"],
  ["medium", "मध्यम"],
  ["large", "मोठा"]
];

const languageOptions = [
  ["mr", "मराठी"],
  ["en", "English"]
];

const defaultPageOptions = [
  ["dashboard", "मुख्यपृष्ठ"],
  ["ai_assistant", "AI सहाय्यक"],
  ["milk_reports", "दूध अहवाल"],
  ["slip_scanner", "स्लिप स्कॅनर"],
  ["analytics", "Analytics"]
];

function OptionGrid({ options, value, onChange, disabled = false, columns = "grid-cols-3" }) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`min-h-[54px] rounded-xl border px-3 text-[16px] font-black disabled:opacity-60 ${
            value === key ? "border-green-500 bg-green-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ title, subtitle, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${title}: ${checked ? "सुरू" : "बंद"}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-h-[78px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left shadow-sm disabled:opacity-60 ${
        checked ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
      }`}
    >
      <span>
        <span className="block text-[18px] font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-[14px] font-bold leading-snug text-slate-600">{subtitle}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className={`text-[12px] font-black ${checked ? "text-green-700" : "text-slate-500"}`}>
          {checked ? "सुरू" : "बंद"}
        </span>
        <span className={`flex h-8 w-14 items-center rounded-full p-1 transition ${checked ? "bg-green-600" : "bg-slate-300"}`}>
          <span className={`h-6 w-6 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : ""}`} />
        </span>
      </span>
    </button>
  );
}

export default function AppearanceSettingsPage() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/appearance", {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Appearance settings मिळाल्या नाहीत.");
      setPreferences(result.preferences);
      applyAppearancePreferences(result.preferences);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update(key, value) {
    setNotice({ type: "", text: "" });
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      applyAppearancePreferences(next);
      return next;
    });
  }

  async function save() {
    if (saving || !preferences) return;
    setSaving(true);
    setNotice({ type: "", text: "" });
    try {
      const response = await fetch("/api/settings/appearance", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify(preferences)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Appearance settings जतन झाल्या नाहीत.");
      setPreferences(result.preferences);
      applyAppearancePreferences(result.preferences);
      setNotice({ type: "success", text: "दिसणे आणि भाषा सेटिंग्ज जतन झाल्या." });
    } catch (saveError) {
      setNotice({ type: "error", text: saveError.message || "Appearance settings जतन झाल्या नाहीत." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="दिसणे सेटिंग्ज लोड होत आहेत..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader title="🎨 दिसणे आणि भाषा" subtitle="App तुमच्या वापराप्रमाणे सोयीचे करा." />

      {notice.text ? (
        <div className={`rounded-xl border p-4 text-[18px] font-extrabold shadow-sm ${
          notice.type === "error"
            ? "border-red-200 bg-red-50 text-red-900"
            : "border-green-200 bg-green-50 text-green-900"
        }`}>
          {notice.text}
        </div>
      ) : null}

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Theme Mode</h2>
        <p className="mt-1 text-[16px] font-bold text-slate-600">Light, Dark किंवा phone च्या system प्रमाणे.</p>
        <div className="mt-4">
          <OptionGrid options={themeOptions} value={preferences?.theme_mode} disabled={saving} onChange={(value) => update("theme_mode", value)} />
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Font Size</h2>
        <div className="mt-4">
          <OptionGrid options={fontOptions} value={preferences?.font_size} disabled={saving} onChange={(value) => update("font_size", value)} />
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Language</h2>
        <div className="mt-4">
          <OptionGrid options={languageOptions} value={preferences?.language} disabled={saving} onChange={(value) => update("language", value)} columns="grid-cols-2" />
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Default Page</h2>
        <p className="mt-1 text-[16px] font-bold text-slate-600">Login नंतर कोणते page आधी उघडावे.</p>
        <div className="mt-4">
          <OptionGrid options={defaultPageOptions} value={preferences?.default_page} disabled={saving} onChange={(value) => update("default_page", value)} columns="grid-cols-2" />
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Accessibility</h2>
        <div className="mt-4 grid gap-3">
          <ToggleRow title="Compact Mode" subtitle="Spacing कमी करून जास्त माहिती दिसेल." checked={Boolean(preferences?.compact_mode)} disabled={saving} onChange={(value) => update("compact_mode", value)} />
          <ToggleRow title="High Contrast" subtitle="Text आणि background अधिक स्पष्ट." checked={Boolean(preferences?.high_contrast)} disabled={saving} onChange={(value) => update("high_contrast", value)} />
          <ToggleRow title="Large Touch Targets" subtitle="Buttons मोठे, phone वर tap करायला सोपे." checked={Boolean(preferences?.large_touch_targets)} disabled={saving} onChange={(value) => update("large_touch_targets", value)} />
          <ToggleRow title="Reduce Animations" subtitle="Animation कमी करून app शांत आणि जलद वाटेल." checked={Boolean(preferences?.reduce_animations)} disabled={saving} onChange={(value) => update("reduce_animations", value)} />
        </div>
      </section>

      <button type="button" onClick={save} disabled={saving} className="min-h-[58px] w-full rounded-xl bg-green-600 px-5 text-[19px] font-black text-white shadow-sm disabled:opacity-60">
        {saving ? "जतन करत आहे..." : "✅ सेटिंग्ज जतन करा"}
      </button>
    </div>
  );
}
