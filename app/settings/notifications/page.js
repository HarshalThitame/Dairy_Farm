"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const categoryLabels = [
  ["daily_reminder", "दैनंदिन आठवण", "रोजच्या कामांसाठी सूचना"],
  ["milk_entry_reminder", "दूध नोंद आठवण", "सकाळ/संध्याकाळ दूध नोंद"],
  ["slip_upload_reminder", "स्लिप अपलोड आठवण", "15 दिवसांची देयक स्लिप बाकी"],
  ["subscription_reminder", "Subscription आठवण", "Plan expiry आणि payment सूचना"],
  ["system_updates", "System Updates", "App update, maintenance आणि महत्वाच्या सूचना"],
  ["ai_assistant_updates", "AI सहाय्यक Updates", "AI सुविधा आणि सुधारणा"],
  ["promotional_notifications", "ऑफर्स", "Marketing आणि promotional messages"],
  ["support_messages", "Support Messages", "मदत, मार्गदर्शन आणि support"]
];

const channelLabels = [
  ["in_app", "App मध्ये सूचना", "Inbox आणि bell मध्ये दिसेल"],
  ["push", "Mobile Notification", "Phone notification panel मध्ये येईल"],
  ["email", "Email", "भविष्यात email वर पाठवता येईल"],
  ["whatsapp", "WhatsApp", "भविष्यात WhatsApp support"],
  ["sms", "SMS", "भविष्यात SMS support"]
];

const frequencyOptions = [
  ["instant", "ताबडतोब"],
  ["daily", "दैनिक सारांश"],
  ["weekly", "साप्ताहिक सारांश"]
];

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function ToggleRow({ title, subtitle, checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`flex min-h-[78px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left shadow-sm ${
        checked ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span className="min-w-0">
        <span className="block text-[18px] font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-[14px] font-bold leading-snug text-slate-600">{subtitle}</span>
      </span>
      <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-green-600" : "bg-slate-300"}`}>
        <span className={`h-6 w-6 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : ""}`} />
      </span>
    </button>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return toMarathiNumerals(new Date(value).toLocaleString("mr-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }));
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/notifications", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "सूचना सेटिंग्ज मिळाल्या नाहीत.");
      setPreferences(result.preferences);
      setHistory(result.history || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateCategory(key, value) {
    setPreferences((current) => ({
      ...current,
      categories: { ...(current?.categories || {}), [key]: value }
    }));
  }

  function updateChannel(key, value) {
    setPreferences((current) => ({
      ...current,
      channels: { ...(current?.channels || {}), [key]: value }
    }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(preferences)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "सूचना सेटिंग्ज जतन झाल्या नाहीत.");
      setPreferences(result.preferences);
      setMessage("सूचना सेटिंग्ज जतन झाल्या.");
    } catch (saveError) {
      setMessage(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function sendTestNotification() {
    setTesting(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings/notifications/test", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "चाचणी सूचना पाठवता आली नाही.");
      setMessage(result.message || "चाचणी सूचना पाठवली.");
    } catch (testError) {
      setMessage(testError.message);
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <LoadingState text="सूचना सेटिंग्ज लोड होत आहेत..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader title="🔔 सूचना सेटिंग्ज" subtitle="कुठल्या सूचना कशा मिळाव्यात ते ठरवा." />

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-[18px] font-extrabold text-green-900 shadow-sm">
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">📂 सूचना प्रकार</h2>
        <div className="mt-4 grid gap-3">
          {categoryLabels.map(([key, title, subtitle]) => (
            <ToggleRow
              key={key}
              title={title}
              subtitle={subtitle}
              checked={Boolean(preferences?.categories?.[key])}
              onChange={(value) => updateCategory(key, value)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">📡 Channel</h2>
        <div className="mt-4 grid gap-3">
          {channelLabels.map(([key, title, subtitle]) => (
            <ToggleRow
              key={key}
              title={title}
              subtitle={subtitle}
              checked={Boolean(preferences?.channels?.[key])}
              onChange={(value) => updateChannel(key, value)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🌙 शांत वेळ</h2>
        <p className="mt-1 text-[16px] font-bold text-slate-600">या वेळेत साध्या सूचना थांबतील. खूप महत्वाच्या सूचना थांबणार नाहीत.</p>
        <div className="mt-4">
          <ToggleRow
            title="शांत वेळ सुरू करा"
            subtitle="रात्री notification आवाज/alert कमी करण्यासाठी"
            checked={Boolean(preferences?.quiet_hours_enabled)}
            onChange={(value) => setPreferences((current) => ({ ...current, quiet_hours_enabled: value }))}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[16px] font-black text-slate-700">सुरू</span>
            <input type="time" value={preferences?.quiet_hours_start || "22:00"} onChange={(event) => setPreferences((current) => ({ ...current, quiet_hours_start: event.target.value }))} className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[18px] font-bold" />
          </label>
          <label className="block">
            <span className="text-[16px] font-black text-slate-700">शेवट</span>
            <input type="time" value={preferences?.quiet_hours_end || "06:00"} onChange={(event) => setPreferences((current) => ({ ...current, quiet_hours_end: event.target.value }))} className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[18px] font-bold" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">⏱️ वारंवारता</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {frequencyOptions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreferences((current) => ({ ...current, frequency: value }))}
              className={`min-h-[54px] rounded-xl border px-2 text-[15px] font-black ${
                preferences?.frequency === value ? "border-green-500 bg-green-600 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" onClick={save} disabled={saving} className="min-h-[58px] rounded-xl bg-green-600 px-5 text-[19px] font-black text-white shadow-sm disabled:opacity-60">
          {saving ? "जतन करत आहे..." : "✅ सेटिंग्ज जतन करा"}
        </button>
        <button type="button" onClick={sendTestNotification} disabled={testing} className="min-h-[58px] rounded-xl bg-yellow-500 px-5 text-[19px] font-black text-slate-950 shadow-sm disabled:opacity-60">
          {testing ? "पाठवत आहे..." : "📢 चाचणी सूचना पाठवा"}
        </button>
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🧾 सूचना इतिहास</h2>
        <div className="mt-4 grid gap-3">
          {history.length ? history.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[18px] font-black text-slate-950">{item.notifications?.title || "सूचना"}</p>
                  <p className="mt-1 text-[15px] font-bold leading-snug text-slate-600">{item.notifications?.message || ""}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[12px] font-black ${item.opened_at ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {item.opened_at ? "वाचले" : "नवीन"}
                </span>
              </div>
              <p className="mt-2 text-[14px] font-bold text-slate-500">{formatDate(item.delivered_at)}</p>
            </article>
          )) : (
            <p className="rounded-lg bg-slate-50 p-4 text-[17px] font-bold text-slate-600">सूचना इतिहास उपलब्ध नाही.</p>
          )}
        </div>
      </section>
    </div>
  );
}
