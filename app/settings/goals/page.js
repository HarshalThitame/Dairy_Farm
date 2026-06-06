"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const goalInputs = [
  ["daily_milk_goal", "दैनिक दूध लक्ष्य", "लिटर", "३००", "🥛", "आजचे उत्पादन"],
  ["weekly_milk_goal", "साप्ताहिक दूध लक्ष्य", "लिटर", "२१००", "📅", "७ दिवसांचे लक्ष्य"],
  ["monthly_milk_goal", "मासिक दूध लक्ष्य", "लिटर", "९०००", "📆", "महिन्याचे उत्पादन"],
  ["fat_goal", "फॅट लक्ष्य", "%", "४.५", "🧈", "दुधाची गुणवत्ता"],
  ["snf_goal", "SNF लक्ष्य", "", "८.८", "🧪", "SNF गुणवत्ता"]
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

function formatNumber(value, decimals = 2) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return "०";
  const fixed = Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(decimals);
  return toMarathiNumerals(fixed.replace(/\.00$/, ""));
}

function formatValue(value, unit = "") {
  return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return toMarathiNumerals(date.toLocaleDateString("mr-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }));
}

function ToggleRow({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`dashboard-card flex min-h-[88px] w-full min-w-0 items-center justify-between gap-4 rounded-3xl border p-4 text-left shadow-soft transition active:scale-[0.99] disabled:opacity-60 ${
        checked ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50" : "border-slate-200 bg-white"
      }`}
    >
      <span>
        <span className="block text-[20px] font-black text-slate-950">लक्ष्य ट्रॅकिंग सुरू ठेवा</span>
        <span className="mt-1 block text-[15px] font-bold leading-snug text-slate-600">
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
  const completed = item.status === "completed";

  return (
    <article className="dashboard-card min-w-0 rounded-3xl border border-white/80 bg-white/95 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[22px] font-black leading-tight text-slate-950">{item.label}</h3>
          <p className="mt-1 text-[14px] font-bold leading-snug text-slate-500">
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

      <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100 p-1">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            completed ? "bg-green-600" : "bg-gradient-to-r from-yellow-400 via-lime-400 to-green-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-[13px] font-black text-slate-500">{label}</p>
      <p className="mt-1 break-words text-[18px] font-black text-slate-950">{value}</p>
    </div>
  );
}

function getGoalIcon(goalType = "") {
  if (goalType.includes("daily")) return "🥛";
  if (goalType.includes("weekly")) return "📅";
  if (goalType.includes("monthly")) return "📆";
  if (goalType.includes("fat")) return "🧈";
  if (goalType.includes("snf")) return "🧪";
  return "🎯";
}

function HeroStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-center backdrop-blur">
      <p className="text-[12px] font-black uppercase leading-tight text-white/65">{label}</p>
      <p className="mt-1 break-words text-[18px] font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function GoalInputCard({ config, value, saving, onChange }) {
  const [key, label, unit, placeholder, icon, helper] = config;

  return (
    <label className="dashboard-card block w-full min-w-0 rounded-3xl border border-white/80 bg-white/95 p-4 shadow-soft">
      <span className="flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[30px] shadow-inner">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[19px] font-black leading-tight text-slate-950">{label}</span>
          <span className="mt-1 block text-[14px] font-bold leading-snug text-slate-500">{helper}</span>
        </span>
      </span>

      <div className="mt-4 flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
        <input
          type="number"
          min="0"
          step={key.includes("milk") ? "1" : "0.1"}
          inputMode="decimal"
          value={value ?? ""}
          disabled={saving}
          onChange={(event) => onChange(key, event.target.value)}
          placeholder={placeholder}
          className="min-h-[58px] min-w-0 flex-1 border-0 bg-transparent px-4 text-[21px] font-black text-slate-950 outline-none disabled:opacity-60"
        />
        {unit ? (
          <span className="flex min-h-[58px] items-center bg-slate-50 px-4 text-[16px] font-black text-slate-600">
            {unit}
          </span>
        ) : null}
      </div>
    </label>
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

  function validateLocalGoals(nextGoals) {
    const fields = [
      ["daily_milk_goal", "दैनिक दूध लक्ष्य", 100000],
      ["weekly_milk_goal", "साप्ताहिक दूध लक्ष्य", 700000],
      ["monthly_milk_goal", "मासिक दूध लक्ष्य", 3000000],
      ["fat_goal", "फॅट लक्ष्य", 20],
      ["snf_goal", "SNF लक्ष्य", 20]
    ];

    for (const [key, label, max] of fields) {
      const rawValue = nextGoals?.[key];

      if (rawValue === "" || rawValue === null || rawValue === undefined) {
        continue;
      }

      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        return `${label} मध्ये योग्य आकडा भरा.`;
      }
      if (value < 0) {
        return `${label} शून्य किंवा त्यापेक्षा जास्त असावे.`;
      }
      if (value > max) {
        return `${label} खूप मोठे आहे. कृपया योग्य आकडा भरा.`;
      }
    }

    return "";
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/goals", {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "लक्ष्य माहिती मिळाली नाही.");
      setGoals(result.goals);
      setProgress(result.progress || []);
      setHistory(result.history || []);
      setRecommendation(result.recommendation || "");
      setNotifications(result.notifications || []);
    } catch (loadError) {
      setError(loadError.message || "लक्ष्य माहिती मिळाली नाही.");
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
    if (saving || !goals) return;
    setSaving(true);
    setMessage("");
    setSaveError("");
    try {
      const validationMessage = validateLocalGoals(goals);
      if (validationMessage) {
        throw new Error(validationMessage);
      }

      const response = await fetch("/api/settings/goals", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
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
      setSaveError(saveError.message || "लक्ष्य जतन झाले नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="लक्ष्य माहिती लोड होत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const primaryProgress = progress.find((item) => item.goalType === "daily_milk") || progress[0] || null;
  const primaryPercent = Math.max(0, Math.min(100, Number(primaryProgress?.percentage || 0)));
  const completedGoals = progress.filter((item) => item.status === "completed").length;
  const activeGoals = progress.filter((item) => item.status !== "no_goal").length;
  const averageProgress = activeGoals
    ? progress
        .filter((item) => item.status !== "no_goal")
        .reduce((sum, item) => sum + Math.max(0, Math.min(100, Number(item.percentage || 0))), 0) / activeGoals
    : 0;
  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference - (primaryPercent / 100) * circumference;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-slate-950 via-emerald-950 to-green-700 p-5 text-white shadow-soft sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/25 to-transparent" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] font-black text-green-50 backdrop-blur">
                🎯 दूध लक्ष्य
              </span>
              <span className={`rounded-full border px-3 py-1 text-[13px] font-black ${
                goals?.enabled
                  ? "border-green-200/40 bg-green-300/15 text-green-50"
                  : "border-slate-200/30 bg-white/10 text-white/75"
              }`}>
                {goals?.enabled ? "ट्रॅकिंग सुरू" : "ट्रॅकिंग बंद"}
              </span>
            </div>
            <h1 className="mt-4 text-[34px] font-black leading-tight sm:text-[44px]">
              दूध उत्पादनाचे लक्ष्य ठरवा
            </h1>
            <p className="mt-2 max-w-3xl text-[18px] font-bold leading-relaxed text-white/85">
              दैनिक, साप्ताहिक, मासिक आणि गुणवत्ता लक्ष्य ठेवून farm performance नियमित तपासा.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-2xl">
              <HeroStat label="सक्रिय लक्ष्य" value={toMarathiNumerals(activeGoals)} />
              <HeroStat label="पूर्ण" value={toMarathiNumerals(completedGoals)} />
              <HeroStat label="सरासरी प्रगती" value={`${formatNumber(averageProgress, 1)}%`} />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-4 backdrop-blur sm:min-w-[330px]">
            <div className="flex items-center justify-center">
              <div className="relative h-48 w-48">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="13" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="url(#goalGradient)"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                  <defs>
                    <linearGradient id="goalGradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="55%" stopColor="#86efac" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[42px] font-black leading-none">{formatNumber(primaryPercent, 1)}%</span>
                  <span className="mt-1 text-[14px] font-black text-white/70">
                    {primaryProgress?.label || "मुख्य लक्ष्य"}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 rounded-2xl bg-white/10 px-4 py-3 text-center text-[16px] font-black text-white">
              {primaryProgress
                ? `${formatValue(primaryProgress.currentValue, primaryProgress.unit)} / ${formatValue(primaryProgress.target, primaryProgress.unit)}`
                : "लक्ष्य सेट करा"}
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-[18px] font-extrabold text-green-900 shadow-sm">
          {message}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[18px] font-extrabold text-red-900 shadow-sm">
          {saveError}
        </div>
      ) : null}

      {notifications.length ? (
        <section className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-soft">
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

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[30px] shadow-inner">⚙️</span>
          <span>
            <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">Goal Settings</p>
            <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">लक्ष्य सेट करा</h2>
            <p className="mt-1 text-[15px] font-bold leading-snug text-slate-600">
              दूध आणि गुणवत्ता लक्ष्य मोठ्या आकड्यांत भरा. नंतर progress automatic update होईल.
            </p>
          </span>
        </div>
        <div className="mt-4">
          <ToggleRow checked={Boolean(goals?.enabled)} disabled={saving} onChange={(value) => updateGoal("enabled", value)} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {goalInputs.map((config) => (
            <GoalInputCard
              key={config[0]}
              config={config}
              value={goals?.[config[0]]}
              saving={saving}
              onChange={updateGoal}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={saveGoals}
          disabled={saving}
          className="mt-5 min-h-[60px] w-full rounded-2xl bg-green-600 px-5 text-[20px] font-black text-white shadow-soft transition active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "जतन करत आहे..." : "✅ लक्ष्य जतन करा"}
        </button>
      </section>

      <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[30px] shadow-sm">🤖</span>
          <span className="min-w-0">
            <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">AI Recommendation</p>
            <h2 className="mt-1 text-[26px] font-black leading-tight text-slate-950">AI शिफारस</h2>
            <p className="mt-2 text-[19px] font-extrabold leading-relaxed text-emerald-900">
              {recommendation || "लक्ष्य सेट केल्यावर AI शिफारस येथे दिसेल."}
            </p>
          </span>
        </div>
      </section>

      <section className="grid gap-3">
        <div>
          <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">Live Progress</p>
          <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">प्रगती तपशील</h2>
        </div>
        {progress.length ? progress.map((item) => (
          <ProgressCard key={`${item.goalType}-${item.periodStart}`} item={item} />
        )) : (
          <EmptyState text="अजून प्रगती माहिती उपलब्ध नाही." />
        )}
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[30px] shadow-inner">🗂️</span>
          <span>
            <p className="text-[14px] font-black uppercase tracking-wide text-slate-500">History</p>
            <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">मागील लक्ष्य</h2>
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {history.length ? history.map((item) => (
            <article key={`${item.goalType}-${item.periodStart}-${item.periodEnd}`} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[26px] shadow-sm">
                    {getGoalIcon(item.goalType)}
                  </span>
                  <span className="min-w-0">
                    <p className="text-[20px] font-black leading-tight text-slate-950">{item.label}</p>
                    <p className="mt-1 text-[14px] font-bold leading-snug text-slate-500">
                      {formatDate(item.periodStart)} ते {formatDate(item.periodEnd)}
                    </p>
                  </span>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-black ${statusTone[item.status] || statusTone.in_progress}`}>
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
            <EmptyState text="मागील लक्ष्य उपलब्ध नाहीत." />
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 text-center shadow-soft">
      <p className="text-[38px]">📭</p>
      <p className="mt-2 text-[17px] font-bold text-slate-600">{text}</p>
    </div>
  );
}
