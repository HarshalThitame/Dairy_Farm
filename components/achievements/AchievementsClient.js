"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

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
  if (rarity === "legendary") return "from-amber-50 via-yellow-50 to-purple-50 border-amber-200";
  if (rarity === "epic") return "from-indigo-50 via-violet-50 to-white border-indigo-200";
  if (rarity === "rare") return "from-sky-50 via-blue-50 to-white border-sky-200";
  if (rarity === "secret") return "from-slate-100 via-slate-50 to-white border-slate-300";
  return "from-emerald-50 via-green-50 to-white border-green-100";
}

function rarityLabel(rarity) {
  return {
    common: "सामान्य",
    rare: "दुर्मिळ",
    epic: "विशेष",
    legendary: "महान",
    secret: "गुप्त"
  }[rarity] || rarity;
}

function categoryIcon(category) {
  return {
    all: "🏆",
    milk_production: "🥛",
    income: "💰",
    data_entry: "📝",
    ocr_usage: "📸",
    ai_usage: "🤖",
    consistency: "📅",
    farm_growth: "🐄",
    subscription_loyalty: "💎",
    community: "🤝",
    hidden: "🔒"
  }[category] || "🏅";
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, Number(value || 0)));
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
      const endpoint = scoreMode ? "/api/achievements?notify=false" : "/api/achievements";
      const response = await fetch(endpoint, {
        cache: "no-store",
        credentials: "same-origin",
        headers: getClientAuthHeaders()
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
  }, [scoreMode]);

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
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
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
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-24">
      <AchievementHero
        title={profileMode ? "माझे Achievements" : "Achievements"}
        data={data}
        refreshing={refreshing}
        onRefresh={() => load(true)}
      />

      {celebration ? (
        <CelebrationPopup achievement={celebration} onClose={() => setCelebration(null)} />
      ) : null}

      <DashboardSummary data={data} />

      <section className="grid gap-3 md:grid-cols-3">
        <Link href="/profile/score" className="group overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft active:scale-[0.98]">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-50 text-[32px] shadow-inner group-active:scale-95">⭐</span>
            <span className="min-w-0">
              <span className="block text-[20px] font-black leading-tight text-slate-950">Dairy Score</span>
              <span className="mt-1 block text-[14px] font-bold leading-snug text-slate-500">Score आणि rank details</span>
            </span>
          </div>
        </Link>
        <Link href="/leaderboard" className="group overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft active:scale-[0.98]">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[32px] shadow-inner group-active:scale-95">📊</span>
            <span className="min-w-0">
              <span className="block text-[20px] font-black leading-tight text-slate-950">Leaderboard</span>
              <span className="mt-1 block text-[14px] font-bold leading-snug text-slate-500">Farm ranking बघा</span>
            </span>
          </div>
        </Link>
        <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[32px] shadow-inner">🎁</span>
            <span className="min-w-0">
              <span className="block text-[20px] font-black leading-tight text-amber-950">पुढचे Reward</span>
              <span className="mt-1 block break-words text-[14px] font-bold leading-snug text-amber-800">
                {data.stats?.nextReward ? `${data.stats.nextReward.icon} ${data.stats.nextReward.title}` : "सर्व visible rewards पूर्ण"}
              </span>
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-3 shadow-soft">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`shrink-0 rounded-2xl px-4 py-3 text-[14px] font-black shadow-sm ${
                category === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {categoryIcon(item.id)} {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-black uppercase tracking-wide text-green-700">Achievement Showcase</p>
          <h2 className="mt-1 text-[27px] font-black leading-tight text-slate-950">
            {category === "all" ? "सर्व Badges" : categories.find((item) => item.id === category)?.label}
          </h2>
        </div>
        <p className="rounded-full bg-white/90 px-4 py-2 text-[14px] font-black text-slate-600 shadow-sm">
          {toMarathiNumerals(achievements.length)} badges
        </p>
      </div>

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
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-[16px] font-bold text-slate-700 shadow-sm">
          🔒 {toMarathiNumerals(data.hiddenLockedCount)} गुप्त achievements अजून unlock व्हायची आहेत.
        </div>
      ) : null}
    </div>
  );
}

function AchievementHero({ title, data, refreshing, onRefresh }) {
  const score = data.score || {};
  const stats = data.stats || {};
  const progress = clampPercent(stats.progressPercent);
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-slate-950 via-emerald-950 to-green-700 p-5 text-white shadow-soft sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-4 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] font-black text-white/90">
            🏆 Reward Center
          </div>
          <h1 className="mt-4 break-words text-[34px] font-black leading-tight sm:text-[42px]">{title}</h1>
          <p className="mt-2 max-w-2xl text-[17px] font-bold leading-relaxed text-white/80">
            दूध, OCR, AI, सातत्य आणि farm growth साठी मिळालेले badges इथे बघा.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-2xl bg-white/10 px-4 py-2 text-[14px] font-black text-white">
              {score.rank?.icon} {score.rank?.label || "Rank"}
            </span>
            <span className="rounded-2xl bg-white/10 px-4 py-2 text-[14px] font-black text-white">
              ✅ {toMarathiNumerals(stats.unlockedAchievements || 0)} unlock
            </span>
            <span className="rounded-2xl bg-white/10 px-4 py-2 text-[14px] font-black text-white">
              ⭐ {formatNumber(score.dairyScore, 1)}% score
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur sm:min-w-[300px]">
          <div>
            <p className="text-[14px] font-black uppercase tracking-wide text-white/70">Progress</p>
            <p className="mt-1 text-[30px] font-black leading-none">{formatNumber(progress, 1)}%</p>
            <p className="mt-2 text-[13px] font-bold text-white/70">
              {toMarathiNumerals(stats.unlockedAchievements || 0)} / {toMarathiNumerals(stats.totalAchievements || 0)} badges
            </p>
          </div>
          <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#fde68a"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[30px]">🏅</div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="relative mt-5 min-h-[52px] w-full rounded-2xl bg-white px-5 text-[17px] font-black text-green-800 shadow-lg disabled:opacity-60 sm:w-auto"
      >
        {refreshing ? "अपडेट होत आहे..." : "🔄 Achievements अपडेट करा"}
      </button>
    </section>
  );
}

function DashboardSummary({ data }) {
  const stats = data.stats || {};
  const score = data.score || {};
  return (
    <section className="grid gap-3 md:grid-cols-4">
      <SummaryCard label="एकूण Badges" value={stats.totalAchievements || 0} icon="🏅" />
      <SummaryCard label="Unlock झाले" value={stats.unlockedAchievements || 0} icon="✅" tone="border-green-200 bg-green-50 text-green-950" />
      <SummaryCard label="बाकी Badges" value={stats.lockedAchievements || 0} icon="🔒" tone="border-slate-200 bg-slate-50 text-slate-950" />
      <SummaryCard label="Dairy Score" value={`${formatNumber(score.dairyScore, 1)}%`} icon="⭐" tone="border-yellow-200 bg-yellow-50 text-yellow-950" raw />
      <div className="md:col-span-4 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-black uppercase tracking-wide text-slate-500">Current Rank</p>
            <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950 sm:text-[32px]">
              {score.rank?.icon} {score.rank?.label}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-black uppercase tracking-wide text-slate-500">Badge Progress</p>
            <p className="text-[28px] font-black text-green-700">{formatNumber(stats.progressPercent, 1)}%</p>
          </div>
        </div>
        <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100 p-1">
          <div className="h-full rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-yellow-400" style={{ width: `${clampPercent(stats.progressPercent)}%` }} />
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, icon, tone = "border-white/80 bg-white/95 text-slate-950", raw = false }) {
  return (
    <div className={`min-w-0 rounded-3xl border p-4 shadow-soft ${tone}`}>
      <div className="flex items-center gap-3 md:block">
        <p className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[28px] shadow-sm md:h-auto md:w-auto md:bg-transparent md:shadow-none">{icon}</p>
        <div className="min-w-0 md:mt-2">
          <p className="text-[13px] font-black uppercase leading-tight opacity-70">{label}</p>
          <p className="mt-1 break-words text-[28px] font-black leading-none">{raw ? value : toMarathiNumerals(value)}</p>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, onPdf, onImage, onWhatsApp }) {
  const progress = clampPercent(achievement.progressPercent);
  return (
    <article className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-soft ${rarityTone(achievement.rarity)} ${achievement.isUnlocked ? "" : "opacity-90"}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/60 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`flex h-16 w-16 items-center justify-center rounded-3xl text-[38px] shadow-inner ${achievement.isUnlocked ? "bg-white" : "bg-white/70 grayscale"}`}>
            {achievement.icon}
          </div>
          <h3 className="mt-4 break-words text-[22px] font-black leading-tight text-slate-950">{achievement.title}</h3>
          <p className="mt-2 text-[14px] font-bold leading-relaxed text-slate-600">{achievement.description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-black shadow-sm ${achievement.isUnlocked ? "bg-green-600 text-white" : "bg-white text-slate-700"}`}>
          {achievement.isUnlocked ? "पूर्ण" : "बाकी"}
        </span>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/75 px-3 py-1 text-[12px] font-black text-slate-700">
          {rarityLabel(achievement.rarity)}
        </span>
        <span className="rounded-full bg-white/75 px-3 py-1 text-[12px] font-black text-slate-700">
          +{formatNumber(achievement.points)} points
        </span>
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[13px] font-black text-slate-600">Progress</p>
          <p className="text-[14px] font-black text-slate-950">{formatNumber(progress, 1)}%</p>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-white/80 p-1 shadow-inner">
          <div className={`h-full rounded-full ${achievement.isUnlocked ? "bg-green-600" : "bg-amber-500"}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <MiniMetric label="सध्याचे" value={formatMetric(achievement.metricKey, achievement.currentValue)} />
        <MiniMetric label="लक्ष्य" value={formatMetric(achievement.metricKey, achievement.targetValue)} />
      </div>

      {!achievement.isUnlocked ? (
        <p className="relative mt-3 rounded-2xl bg-white/65 px-3 py-2 text-[13px] font-black text-slate-600">
          बाकी: {formatMetric(achievement.metricKey, achievement.remainingValue)}
        </p>
      ) : (
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <button onClick={() => onImage(achievement)} className="min-h-[42px] rounded-2xl bg-white px-3 py-2 text-[13px] font-black text-slate-800 shadow-sm">
            Image
          </button>
          <button onClick={() => onPdf(achievement)} className="min-h-[42px] rounded-2xl bg-white px-3 py-2 text-[13px] font-black text-slate-800 shadow-sm">
            PDF
          </button>
          <button onClick={() => onWhatsApp(achievement)} className="min-h-[42px] rounded-2xl bg-green-600 px-3 py-2 text-[13px] font-black text-white shadow-sm">
            WhatsApp
          </button>
        </div>
      )}
    </article>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/75 p-3 shadow-sm">
      <p className="text-[12px] font-black text-slate-500">{label}</p>
      <p className="mt-1 break-words text-[16px] font-black leading-tight text-slate-950">{value}</p>
    </div>
  );
}

function CelebrationPopup({ achievement, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-yellow-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-green-50 text-[56px] shadow-inner">
          {achievement.icon}
        </div>
        <h2 className="mt-4 text-[30px] font-black text-slate-950">🎉 अभिनंदन!</h2>
        <p className="mt-2 text-[18px] font-bold text-slate-700">
          तुम्ही &quot;{achievement.title}&quot; Achievement पूर्ण केले आहे.
        </p>
        <p className="mt-2 text-[16px] font-black text-green-700">+{toMarathiNumerals(achievement.points)} points</p>
        <button onClick={onClose} className="mt-5 min-h-[52px] w-full rounded-2xl bg-green-600 text-[18px] font-black text-white shadow-soft">
          पुढे चला
        </button>
      </div>
    </div>
  );
}

function ScoreView({ data, refreshing, onRefresh }) {
  const score = data.score || {};
  const metrics = data.metrics || {};
  const stats = data.stats || {};
  const components = score.components || {};
  const dairyScore = clampPercent(score.dairyScore);
  const rankMinScore = Number(score.rank?.minScore || 0);
  const nextRankScore = Number(score.nextRank?.minScore || 100);
  const nextRankProgress = score.nextRank
    ? clampPercent(((dairyScore - rankMinScore) / Math.max(1, nextRankScore - rankMinScore)) * 100)
    : 100;
  const remainingForNextRank = score.nextRank ? Math.max(0, nextRankScore - dairyScore) : 0;
  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference - (dairyScore / 100) * circumference;
  const componentRows = [
    {
      label: "दूध उत्पादन",
      value: components.milkScore,
      icon: "🥛",
      description: "एकूण दूध नोंदीवर आधारित",
      color: "from-blue-500 to-cyan-400"
    },
    {
      label: "सातत्य",
      value: components.consistencyScore,
      icon: "📅",
      description: "सलग नोंदी आणि record discipline",
      color: "from-emerald-500 to-green-400"
    },
    {
      label: "स्लिप स्कॅन",
      value: components.ocrScore,
      icon: "📸",
      description: "OCR/AI स्लिप वापर",
      color: "from-violet-500 to-purple-400"
    },
    {
      label: "AI वापर",
      value: components.aiScore,
      icon: "🤖",
      description: "दुग्धमित्र AI प्रश्न",
      color: "from-sky-500 to-indigo-400"
    },
    {
      label: "सक्रियता",
      value: components.activityScore,
      icon: "⚡",
      description: "मागील ३० दिवसांचा वापर",
      color: "from-orange-500 to-amber-400"
    },
    {
      label: "प्रोफाइल",
      value: components.profileScore,
      icon: "👤",
      description: "प्रोफाइल पूर्णता",
      color: "from-slate-700 to-slate-500"
    },
    {
      label: "डेटा गुणवत्ता",
      value: components.dataQualityScore,
      icon: "✅",
      description: "दूध data ची पूर्णता आणि quality",
      color: "from-lime-500 to-emerald-400"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-slate-950 via-emerald-950 to-green-700 p-5 text-white shadow-soft sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-4 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] font-black text-green-50 backdrop-blur">
                ⭐ दूध उत्पादक स्कोअर
              </span>
              <span className="rounded-full border border-yellow-200/40 bg-yellow-300/15 px-3 py-1 text-[13px] font-black text-yellow-50">
                {score.rank?.icon} {score.rank?.label || "रँक"}
              </span>
            </div>

            <h1 className="mt-4 text-[34px] font-black leading-tight sm:text-[44px]">
              तुमची दूध उत्पादक कामगिरी
            </h1>
            <p className="mt-2 max-w-2xl text-[17px] font-bold leading-relaxed text-white/80">
              दूध नोंदी, सातत्य, स्लिप स्कॅन, AI वापर आणि data quality यावरून हा स्कोअर तयार होतो.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-xl">
              <HeroMiniStat label="Badges" value={stats.unlockedAchievements || 0} />
              <HeroMiniStat label="नोंद दिवस" value={metrics.record_days || 0} />
              <HeroMiniStat label="स्ट्रीक" value={metrics.current_streak_days || 0} suffix=" दिवस" />
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
                    stroke="url(#scoreGradient)"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="55%" stopColor="#86efac" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[44px] font-black leading-none">{formatNumber(dairyScore, 1)}%</span>
                  <span className="mt-1 text-[14px] font-black text-white/70">एकूण स्कोअर</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="mt-3 min-h-[52px] w-full rounded-2xl bg-white px-5 text-[17px] font-black text-green-800 shadow-lg transition active:scale-[0.98] disabled:opacity-60"
            >
              {refreshing ? "अपडेट होत आहे..." : "🔄 स्कोअर अपडेट करा"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">Current Rank</p>
              <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">
                {score.rank?.icon} {score.rank?.label || "रँक उपलब्ध नाही"}
              </h2>
            </div>
            <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-[15px] font-black text-emerald-800 ring-1 ring-emerald-100">
              {formatNumber(dairyScore, 1)}%
            </span>
          </div>

          {score.nextRank ? (
            <>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <span className="min-w-0">
                  <span className="block text-[14px] font-black text-slate-500">पुढचा रँक</span>
                  <span className="mt-1 block text-[20px] font-black leading-tight text-slate-950">
                    {score.nextRank.icon} {score.nextRank.label}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[14px] font-black text-slate-600">
                  {formatNumber(remainingForNextRank, 1)}% बाकी
                </span>
              </div>
              <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100 p-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${nextRankProgress}%` }}
                />
              </div>
              <p className="mt-3 text-[15px] font-bold leading-snug text-slate-600">
                पुढच्या rank साठी सातत्याने दूध नोंद, स्लिप स्कॅन आणि data quality वाढवा.
              </p>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-[17px] font-black text-green-800">
              👑 तुम्ही सर्वोच्च रँकवर आहात.
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-emerald-50 p-5 shadow-soft">
          <p className="text-[14px] font-black uppercase tracking-wide text-yellow-700">AI Summary</p>
          <h2 className="mt-2 text-[25px] font-black leading-tight text-slate-950">
            {getScoreMessage(dairyScore)}
          </h2>
          <p className="mt-3 text-[15px] font-bold leading-relaxed text-slate-600">
            हा score तुमच्या farm activity वरून automatic update होतो. कमी असलेला component सुधारला की rank वेगाने वाढेल.
          </p>
          <Link
            href="/profile/achievements"
            className="mt-4 inline-flex min-h-[48px] items-center rounded-2xl bg-slate-950 px-5 text-[16px] font-black text-white shadow-sm active:scale-[0.98]"
          >
            🏆 Badges बघा
          </Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {componentRows.map((row) => (
          <ScoreComponentCard key={row.label} row={row} />
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/95 p-5 shadow-soft">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[14px] font-black uppercase tracking-wide text-slate-500">Activity Metrics</p>
            <h2 className="mt-1 text-[26px] font-black leading-tight text-slate-950">स्कोअरला आधार देणारी माहिती</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <ScoreMetricCard label="एकूण दूध" value={`${formatNumber(metrics.total_milk_liters, 1)} लि.`} icon="🥛" />
          <ScoreMetricCard label="एकूण उत्पन्न" value={toMarathiCurrency(metrics.total_income || 0)} icon="💰" />
          <ScoreMetricCard label="स्लिप स्कॅन" value={metrics.slips_uploaded || 0} icon="📸" />
          <ScoreMetricCard label="AI प्रश्न" value={metrics.ai_questions || 0} icon="🤖" />
          <ScoreMetricCard label="सध्याचा स्ट्रीक" value={`${formatNumber(metrics.current_streak_days)} दिवस`} icon="📅" />
          <ScoreMetricCard label="सर्वोत्तम स्ट्रीक" value={`${formatNumber(metrics.longest_streak_days)} दिवस`} icon="🏆" />
          <ScoreMetricCard label="गायी" value={metrics.active_cows || 0} icon="🐄" />
          <ScoreMetricCard label="प्रोफाइल पूर्णता" value={`${formatNumber(metrics.profile_completion, 1)}%`} icon="👤" />
          <ScoreMetricCard label="Data Quality" value={`${formatNumber(metrics.data_quality_score, 1)}%`} icon="✅" />
        </div>
      </section>
    </div>
  );
}

function HeroMiniStat({ label, value, suffix = "" }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-center backdrop-blur">
      <p className="text-[12px] font-black text-white/65">{label}</p>
      <p className="mt-1 break-words text-[20px] font-black leading-tight text-white">
        {toMarathiNumerals(value || 0)}{suffix}
      </p>
    </div>
  );
}

function getScoreMessage(score) {
  if (score >= 92) return "तुमची दूध उत्पादक कामगिरी सर्वोच्च पातळीवर आहे.";
  if (score >= 80) return "तुमची कामगिरी उत्कृष्ट आहे. सातत्य ठेवा.";
  if (score >= 65) return "तुमचा farm मजबूत track वर आहे.";
  if (score >= 50) return "कामगिरी चांगली आहे; data quality वाढवली तर rank वाढेल.";
  if (score >= 35) return "नियमित दूध नोंद आणि स्लिप स्कॅन केल्यास score वाढेल.";
  return "सुरुवात चांगली करा: रोजची दूध नोंद आणि प्रोफाइल पूर्ण करा.";
}

function ScoreComponentCard({ row }) {
  const value = clampPercent(row.value);
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/95 p-4 shadow-soft transition active:scale-[0.98]">
      <div className="flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[30px] shadow-inner">
          {row.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[20px] font-black leading-tight text-slate-950">{row.label}</span>
          <span className="mt-1 block text-[14px] font-bold leading-snug text-slate-500">{row.description}</span>
        </span>
        <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1 text-[14px] font-black text-white">
          {formatNumber(value, 1)}%
        </span>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100 p-1">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${row.color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </article>
  );
}

function ScoreMetricCard({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[27px]" aria-hidden="true">{icon}</span>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-100">माहिती</span>
      </div>
      <p className="mt-3 text-[13px] font-black uppercase leading-tight text-slate-500">{label}</p>
      <p className="mt-1 break-words text-[22px] font-black leading-tight text-slate-950">
        {typeof value === "number" ? toMarathiNumerals(value) : value}
      </p>
    </div>
  );
}
