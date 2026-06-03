"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const categoryOrder = [
  "all",
  "milk_production",
  "income",
  "data_entry",
  "ocr_usage",
  "ai_usage",
  "consistency",
  "farm_growth",
  "subscription_loyalty",
  "community",
  "hidden"
];

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function formatNumber(value, decimals = 0) {
  const number = Number(value || 0);
  const text = decimals > 0 ? number.toFixed(decimals) : Math.round(number).toString();
  return toMarathiNumerals(text);
}

function formatMetric(key, value) {
  if (key === "total_income") return toMarathiCurrency(value);
  if (key.includes("milk") || key.includes("liters")) return `${formatNumber(value, 1)} लि.`;
  if (key.includes("score") || key.includes("completion")) return `${formatNumber(value, 1)}%`;
  return formatNumber(value);
}

function rarityTone(rarity) {
  if (rarity === "legendary") return "from-purple-100 to-yellow-50 border-purple-200";
  if (rarity === "epic") return "from-indigo-50 to-purple-50 border-indigo-200";
  if (rarity === "rare") return "from-blue-50 to-white border-blue-200";
  if (rarity === "secret") return "from-slate-100 to-white border-slate-300";
  return "from-green-50 to-white border-green-100";
}

export default function AchievementsClient({ profileMode = false, scoreMode = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [celebration, setCelebration] = useState(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/achievements", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Achievements मिळाले नाहीत.");
      setData(result);
      if (result.newlyUnlocked?.length) {
        setCelebration(result.newlyUnlocked[0]);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const categories = useMemo(() => {
    if (!data?.categories) return [];
    return categoryOrder
      .filter((key) => key === "all" || data.achievements?.some((item) => item.category === key))
      .map((key) => ({ id: key, label: key === "all" ? "सर्व" : data.categories[key] || key }));
  }, [data]);

  const achievements = useMemo(() => {
    const rows = data?.achievements || [];
    return category === "all" ? rows : rows.filter((item) => item.category === category);
  }, [data, category]);

  async function downloadPdf(achievement) {
    const response = await fetch("/api/achievements/share", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ achievementId: achievement.id })
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `achievement-${achievement.code}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadImage(achievement) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ecfdf5";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#14532d";
    context.font = "bold 58px sans-serif";
    context.textAlign = "center";
    context.fillText("माझी डेअरी Achievement", 540, 130);
    context.font = "130px sans-serif";
    context.fillText(achievement.icon, 540, 330);
    context.fillStyle = "#052e16";
    context.font = "bold 64px sans-serif";
    context.fillText(achievement.title, 540, 470);
    context.fillStyle = "#334155";
    context.font = "36px sans-serif";
    context.fillText(`${achievement.points} points · ${achievement.rarity}`, 540, 560);
    context.fillStyle = "#166534";
    context.font = "bold 42px sans-serif";
    context.fillText("स्मार्ट डेअरी व्यवस्थापन", 540, 890);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `achievement-${achievement.code}.png`;
    link.click();
  }

  function shareWhatsApp(achievement) {
    const text = encodeURIComponent(`मी माझी डेअरी app मध्ये "${achievement.title}" achievement unlock केले! ${achievement.icon}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  if (loading) return <LoadingState text="Achievements तपासत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={() => load(false)} />;

  if (scoreMode) {
    return <ScoreView data={data} refreshing={refreshing} onRefresh={() => load(true)} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={profileMode ? "🏆 माझे Achievements" : "🏆 Achievements"}
        subtitle="दूध, OCR, AI, सातत्य आणि farm growth साठी rewards."
        action={
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-xl bg-green-600 px-4 py-3 text-[15px] font-black text-white shadow-sm disabled:opacity-60"
          >
            {refreshing ? "Update..." : "Refresh"}
          </button>
        }
      />

      {celebration ? (
        <CelebrationPopup achievement={celebration} onClose={() => setCelebration(null)} />
      ) : null}

      <DashboardSummary data={data} />

      <section className="grid gap-3 md:grid-cols-3">
        <Link href="/profile/score" className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft active:scale-[0.98]">
          <span className="text-[34px]">⭐</span>
          <span className="mt-2 block text-[20px] font-black text-slate-950">Dairy Score</span>
          <span className="text-[14px] font-bold text-slate-500">Score आणि rank details</span>
        </Link>
        <Link href="/leaderboard" className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft active:scale-[0.98]">
          <span className="text-[34px]">📊</span>
          <span className="mt-2 block text-[20px] font-black text-slate-950">Leaderboard</span>
          <span className="text-[14px] font-bold text-slate-500">Farm ranking बघा</span>
        </Link>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-soft">
          <span className="text-[34px]">🎁</span>
          <span className="mt-2 block text-[20px] font-black text-yellow-950">Next Reward</span>
          <span className="text-[14px] font-bold text-yellow-800">
            {data.stats?.nextReward ? `${data.stats.nextReward.icon} ${data.stats.nextReward.title}` : "सर्व visible rewards पूर्ण"}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/95 p-3 shadow-soft">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-black ${
                category === item.id ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onPdf={downloadPdf}
            onImage={downloadImage}
            onWhatsApp={shareWhatsApp}
          />
        ))}
      </section>

      {data.hiddenLockedCount ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[16px] font-bold text-slate-700">
          🔒 {toMarathiNumerals(data.hiddenLockedCount)} गुप्त achievements अजून unlock व्हायची आहेत.
        </div>
      ) : null}
    </div>
  );
}

function DashboardSummary({ data }) {
  const stats = data.stats || {};
  const score = data.score || {};
  return (
    <section className="grid gap-3 md:grid-cols-4">
      <SummaryCard label="Total" value={stats.totalAchievements || 0} icon="🏅" />
      <SummaryCard label="Unlocked" value={stats.unlockedAchievements || 0} icon="✅" tone="border-green-200 bg-green-50 text-green-950" />
      <SummaryCard label="Locked" value={stats.lockedAchievements || 0} icon="🔒" tone="border-slate-200 bg-slate-50 text-slate-950" />
      <SummaryCard label="Dairy Score" value={`${formatNumber(score.dairyScore, 1)}%`} icon="⭐" tone="border-yellow-200 bg-yellow-50 text-yellow-950" raw />
      <div className="md:col-span-4 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[18px] font-black text-slate-500">Current Rank</p>
            <h2 className="mt-1 text-[30px] font-black text-slate-950">
              {score.rank?.icon} {score.rank?.label}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[18px] font-black text-slate-500">Progress</p>
            <p className="text-[28px] font-black text-green-700">{formatNumber(stats.progressPercent, 1)}%</p>
          </div>
        </div>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-yellow-400" style={{ width: `${Math.min(100, stats.progressPercent || 0)}%` }} />
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, icon, tone = "border-white/80 bg-white/95 text-slate-950", raw = false }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-soft ${tone}`}>
      <p className="text-[30px]">{icon}</p>
      <p className="mt-2 text-[13px] font-black uppercase opacity-70">{label}</p>
      <p className="mt-1 text-[30px] font-black">{raw ? value : toMarathiNumerals(value)}</p>
    </div>
  );
}

function AchievementCard({ achievement, onPdf, onImage, onWhatsApp }) {
  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-4 shadow-soft ${rarityTone(achievement.rarity)} ${achievement.isUnlocked ? "" : "opacity-85"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[44px]">{achievement.icon}</div>
          <h3 className="mt-2 text-[22px] font-black text-slate-950">{achievement.title}</h3>
          <p className="mt-1 text-[14px] font-bold leading-snug text-slate-600">{achievement.description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[12px] font-black ${achievement.isUnlocked ? "bg-green-600 text-white" : "bg-white text-slate-700"}`}>
          {achievement.isUnlocked ? "Unlocked" : "Locked"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniMetric label="Progress" value={`${formatNumber(achievement.progressPercent, 1)}%`} />
        <MiniMetric label="Points" value={formatNumber(achievement.points)} />
        <MiniMetric label="Current" value={formatMetric(achievement.metricKey, achievement.currentValue)} />
        <MiniMetric label="Target" value={formatMetric(achievement.metricKey, achievement.targetValue)} />
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70">
        <div className={`h-full rounded-full ${achievement.isUnlocked ? "bg-green-600" : "bg-yellow-500"}`} style={{ width: `${Math.min(100, achievement.progressPercent)}%` }} />
      </div>

      {!achievement.isUnlocked ? (
        <p className="mt-2 text-[13px] font-black text-slate-600">
          बाकी: {formatMetric(achievement.metricKey, achievement.remainingValue)}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => onImage(achievement)} className="rounded-xl bg-white px-3 py-2 text-[13px] font-black text-slate-800">
            Image
          </button>
          <button onClick={() => onPdf(achievement)} className="rounded-xl bg-white px-3 py-2 text-[13px] font-black text-slate-800">
            PDF
          </button>
          <button onClick={() => onWhatsApp(achievement)} className="rounded-xl bg-green-600 px-3 py-2 text-[13px] font-black text-white">
            WhatsApp
          </button>
        </div>
      )}
    </article>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-white/75 p-3">
      <p className="text-[12px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-[16px] font-black text-slate-950">{value}</p>
    </div>
  );
}

function CelebrationPopup({ achievement, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-yellow-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-50 text-[56px] shadow-inner">
          {achievement.icon}
        </div>
        <h2 className="mt-4 text-[30px] font-black text-slate-950">🎉 अभिनंदन!</h2>
        <p className="mt-2 text-[18px] font-bold text-slate-700">
          तुम्ही &quot;{achievement.title}&quot; Achievement पूर्ण केले आहे.
        </p>
        <p className="mt-2 text-[16px] font-black text-green-700">+{toMarathiNumerals(achievement.points)} points</p>
        <button onClick={onClose} className="mt-5 min-h-[52px] w-full rounded-xl bg-green-600 text-[18px] font-black text-white">
          पुढे चला
        </button>
      </div>
    </div>
  );
}

function ScoreView({ data, refreshing, onRefresh }) {
  const score = data.score || {};
  const metrics = data.metrics || {};
  const components = score.components || {};
  const componentRows = [
    ["दूध", components.milkScore],
    ["सातत्य", components.consistencyScore],
    ["OCR", components.ocrScore],
    ["AI", components.aiScore],
    ["Activity", components.activityScore],
    ["Profile", components.profileScore],
    ["Data Quality", components.dataQualityScore]
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="⭐ Dairy Score"
        subtitle="तुमच्या farm activity, data quality आणि consistency वर आधारित score."
        action={<button onClick={onRefresh} disabled={refreshing} className="rounded-xl bg-green-600 px-4 py-3 text-[15px] font-black text-white">{refreshing ? "..." : "Refresh"}</button>}
      />

      <section className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-6 text-center shadow-soft">
        <p className="text-[54px]">{score.rank?.icon}</p>
        <h2 className="mt-2 text-[42px] font-black text-slate-950">{formatNumber(score.dairyScore, 1)}%</h2>
        <p className="mt-1 text-[24px] font-black text-yellow-800">{score.rank?.label}</p>
        {score.nextRank ? (
          <p className="mt-2 text-[15px] font-bold text-slate-600">
            पुढचा rank: {score.nextRank.icon} {score.nextRank.label} ({formatNumber(score.nextRank.minScore - score.dairyScore, 1)}% बाकी)
          </p>
        ) : (
          <p className="mt-2 text-[15px] font-bold text-green-700">तुम्ही सर्वोच्च rank वर आहात.</p>
        )}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {componentRows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-[18px] font-black text-slate-950">{label}</p>
              <p className="text-[18px] font-black text-green-700">{formatNumber(value, 1)}%</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.min(100, value || 0)}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="दूध" value={`${formatNumber(metrics.total_milk_liters, 1)} लि.`} icon="🥛" raw />
        <SummaryCard label="AI प्रश्न" value={metrics.ai_questions || 0} icon="🤖" />
        <SummaryCard label="Slips" value={metrics.slips_uploaded || 0} icon="📸" />
        <SummaryCard label="Streak" value={`${formatNumber(metrics.current_streak_days)} दिवस`} icon="📅" raw />
      </section>
    </div>
  );
}
