"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const goalInputs = [
  ["daily_milk_goal", "दैनिक दूध लक्ष्य", "लिटर", "३००"],
  ["weekly_milk_goal", "साप्ताहिक दूध लक्ष्य", "लिटर", "२१००"],
  ["monthly_milk_goal", "मासिक दूध लक्ष्य", "लिटर", "९०००"],
  ["fat_goal", "फॅट लक्ष्य", "%", "४.५"],
  ["snf_goal", "SNF लक्ष्य", "", "८.८"]
];

const statusLabels = {
  completed: "पूर्ण",
  missed: "चुकले",
  in_progress: "चालू",
  no_goal: "लक्ष्य नाही"
};

const statusTone = {
  completed: "bg-green-100 text-green-800",
  missed: "bg-red-100 text-red-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  no_goal: "bg-slate-100 text-slate-700"
};

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function formatNumber(value, decimals = 2) {
  const numberValue = Number(value || 0);
  const fixed = Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(decimals);
  return toMarathiNumerals(fixed.replace(/\.00$/, ""));
}

function formatValue(value, unit = "") {
  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
}

function formatDate(value) {
  if (!value) return "-";
  return toMarathiNumerals(new Date(`${value}T00:00:00`).toLocaleDateString("mr-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }));
}

function ToggleRow({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-[78px] w-full items-center justify-between gap-4 rounded-xl border p-4 text-left shadow-sm ${
        checked ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
      }`}
    >
      <span>
        <span className="block text-[18px] font-black text-slate-950">लक्ष्य ट्रॅकिंग सुरू ठेवा</span>
        <span className="mt-1 block text-[14px] font-bold text-slate-600">
          बंद केल्यास progress दिसेल, पण लक्ष्य पूर्ण झाल्याची सूचना पाठवणार नाही.
        </span>
      </span>
      <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-green-600" : "bg-slate-300"}`}>
        <span className={`h-6 w-6 rounded-full bg-white shadow transition ${checked ? "translate-x-6" : ""}`} />
      </span>
    </button>
  );
}

function ProgressCard({ item }) {
  const percent = Math.max(0, Math.min(100, Number(item.percentage || 0)));

  return (
    <article className="rounded-xl border border-white/80 bg-white/90 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[21px] font-black text-slate-950">{item.label}</h3>
          <p className="mt-1 text-[14px] font-bold text-slate-500">
            {formatDate(item.periodStart)} ते {formatDate(item.periodEnd)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[13px] font-black ${statusTone[item.status] || statusTone.in_progress}`}>
          {statusLabels[item.status] || item.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric label="सध्या" value={formatValue(item.currentValue, item.unit)} />
        <Metric label="लक्ष्य" value={formatValue(item.target, item.unit)} />
        <Metric label="बाकी" value={formatValue(item.remaining, item.unit)} />
        <Metric label="टक्केवारी" value={`${formatNumber(item.percentage, 1)}%`} />
      </div>

      <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${item.status === "completed" ? "bg-green-600" : "bg-gradient-to-r from-yellow-400 to-green-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[13px] font-black text-slate-500">{label}</p>
      <p className="mt-1 text-[18px] font-black text-slate-950">{value}</p>
    </div>
  );
}

export default function GoalsSettingsPage() {
  const [goals, setGoals] = useState(null);
  const [progress, setProgress] = useState([]);
  const [history, setHistory] = useState([]);
  const [recommendation, setRecommendation] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/goals", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "लक्ष्य माहिती मिळाली नाही.");
      setGoals(result.goals);
      setProgress(result.progress || []);
      setHistory(result.history || []);
      setRecommendation(result.recommendation || "");
      setNotifications(result.notifications || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateGoal(key, value) {
    setGoals((current) => ({ ...current, [key]: value }));
    setMessage("");
    setSaveError("");
  }

  async function saveGoals() {
    setSaving(true);
    setMessage("");
    setSaveError("");
    try {
      const response = await fetch("/api/settings/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(goals)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "लक्ष्य जतन झाले नाही.");
      setGoals(result.goals);
      setProgress(result.progress || []);
      setHistory(result.history || []);
      setRecommendation(result.recommendation || "");
      setNotifications(result.notifications || []);
      setMessage(result.message || "लक्ष्य जतन झाले.");
    } catch (saveError) {
      setSaveError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="लक्ष्य माहिती लोड होत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader title="🎯 दूध लक्ष्य" subtitle="दैनिक, साप्ताहिक, मासिक आणि गुणवत्ता लक्ष्य सेट करा." />

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-[18px] font-extrabold text-green-900 shadow-sm">
          {message}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[18px] font-extrabold text-red-900 shadow-sm">
          {saveError}
        </div>
      ) : null}

      {notifications.length ? (
        <section className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-soft">
          <h2 className="text-[22px] font-black text-green-950">🎉 नवीन Achievement</h2>
          <div className="mt-2 grid gap-2">
            {notifications.map((item) => (
              <p key={item.id || item.title} className="text-[16px] font-bold text-green-900">
                {item.title}: {item.message}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">लक्ष्य सेट करा</h2>
        <div className="mt-4">
          <ToggleRow checked={Boolean(goals?.enabled)} onChange={(value) => updateGoal("enabled", value)} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {goalInputs.map(([key, label, unit, placeholder]) => (
            <label key={key} className="block">
              <span className="text-[16px] font-black text-slate-700">{label}</span>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-green-500">
                <input
                  type="number"
                  min="0"
                  step={key.includes("milk") ? "1" : "0.1"}
                  value={goals?.[key] ?? ""}
                  onChange={(event) => updateGoal(key, event.target.value)}
                  placeholder={placeholder}
                  className="min-h-[54px] min-w-0 flex-1 border-0 bg-transparent px-4 text-[18px] font-bold text-slate-950 outline-none"
                />
                {unit ? (
                  <span className="flex min-h-[54px] items-center bg-slate-50 px-4 text-[16px] font-black text-slate-600">
                    {unit}
                  </span>
                ) : null}
              </div>
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={saveGoals}
          disabled={saving}
          className="mt-5 min-h-[58px] w-full rounded-xl bg-green-600 px-5 text-[19px] font-black text-white shadow-sm disabled:opacity-60"
        >
          {saving ? "जतन करत आहे..." : "✅ लक्ष्य जतन करा"}
        </button>
      </section>

      <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">🤖 AI शिफारस</h2>
        <p className="mt-2 text-[19px] font-extrabold leading-relaxed text-emerald-900">
          {recommendation || "लक्ष्य सेट केल्यावर AI शिफारस येथे दिसेल."}
        </p>
      </section>

      <section className="grid gap-3">
        <h2 className="text-[24px] font-black text-slate-950">प्रगती तपशील</h2>
        {progress.map((item) => (
          <ProgressCard key={`${item.goalType}-${item.periodStart}`} item={item} />
        ))}
      </section>

      <section className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">मागील लक्ष्य</h2>
        <div className="mt-4 grid gap-3">
          {history.length ? history.map((item) => (
            <article key={`${item.goalType}-${item.periodStart}-${item.periodEnd}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[19px] font-black text-slate-950">{item.label}</p>
                  <p className="mt-1 text-[14px] font-bold text-slate-500">
                    {formatDate(item.periodStart)} ते {formatDate(item.periodEnd)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[13px] font-black ${statusTone[item.status] || statusTone.in_progress}`}>
                  {statusLabels[item.status] || item.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="लक्ष्य" value={formatValue(item.target, item.unit)} />
                <Metric label="साध्य" value={formatValue(item.currentValue, item.unit)} />
                <Metric label="%" value={`${formatNumber(item.percentage, 1)}%`} />
              </div>
            </article>
          )) : (
            <p className="rounded-lg bg-slate-50 p-4 text-[17px] font-bold text-slate-600">मागील लक्ष्य उपलब्ध नाहीत.</p>
          )}
        </div>
      </section>
    </div>
  );
}
