"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const leaderboardTypes = [
  { value: "farm", label: "दूध उत्पादक Score", short: "Score", icon: "⭐", color: "from-emerald-500 to-teal-500" },
  { value: "milk", label: "दूध उत्पादन", short: "दूध", icon: "🥛", color: "from-sky-500 to-cyan-500" },
  { value: "activity", label: "सक्रियता", short: "Active", icon: "🔥", color: "from-orange-500 to-amber-500" },
  { value: "ocr_usage", label: "स्लिप स्कॅन", short: "Scan", icon: "📸", color: "from-violet-500 to-fuchsia-500" },
  { value: "ai_usage", label: "AI वापर", short: "AI", icon: "🤖", color: "from-slate-700 to-slate-950" }
];

const scopeOptions = [
  { value: "all", title: "सर्व दूध उत्पादक", subtitle: "संपूर्ण platform ranking", icon: "🌍" },
  { value: "taluka", title: "माझा तालुका", subtitle: "तुमच्या तालुक्यातील ranking", icon: "📍" }
];

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function numberText(value, digits = 0) {
  const number = Number(value || 0);
  return toMarathiNumerals(digits > 0 ? number.toFixed(digits) : Math.round(number));
}

function formatScore(type, row) {
  if (type === "milk") return `${numberText(row.metrics?.total_milk_liters || 0, 1)} लि.`;
  if (type === "ai_usage") return `${toMarathiNumerals(row.metrics?.ai_questions || 0)} प्रश्न`;
  if (type === "ocr_usage") return `${toMarathiNumerals(row.metrics?.slips_uploaded || 0)} स्लिप`;
  if (type === "activity") return `${toMarathiNumerals(row.metrics?.recent_activity_days || 0)} दिवस`;
  return `${numberText(row.dairyScore || 0, 1)}%`;
}

function scoreCaption(type) {
  if (type === "milk") return "एकूण दूध";
  if (type === "ai_usage") return "AI प्रश्न";
  if (type === "ocr_usage") return "अपलोड स्लिप";
  if (type === "activity") return "सक्रिय दिवस";
  return "दूध उत्पादक Score";
}

function rankBadge(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${toMarathiNumerals(rank)}`;
}

function rankTone(rank) {
  if (rank === 1) return "border-amber-200 bg-amber-50 text-amber-950";
  if (rank === 2) return "border-slate-200 bg-slate-50 text-slate-950";
  if (rank === 3) return "border-orange-200 bg-orange-50 text-orange-950";
  return "border-white/80 bg-white/95 text-slate-950";
}

function RowMeta({ row }) {
  const parts = [row.talukaName, row.districtName].filter(Boolean);
  return (
    <p className="mt-1 line-clamp-1 text-[13px] font-extrabold text-slate-500">
      {parts.length ? parts.join(" · ") : "स्थान माहिती नाही"} · {row.rankLabel || "दूध उत्पादक"}
    </p>
  );
}

function PodiumCard({ row, type }) {
  return (
    <article className={`min-w-0 rounded-3xl border p-4 shadow-soft ${rankTone(row.rank)}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 px-3 py-2 text-[28px] shadow-sm">
          {rankBadge(row.rank)}
        </span>
        {row.isCurrentFarm ? (
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-[12px] font-black text-white">तुम्ही</span>
        ) : null}
      </div>
      <h3 className="mt-4 line-clamp-2 text-[20px] font-black leading-tight">{row.farmName}</h3>
      <RowMeta row={row} />
      <div className="mt-4 rounded-2xl bg-white/75 p-3">
        <p className="text-[12px] font-black uppercase text-slate-500">{scoreCaption(type)}</p>
        <p className="mt-1 text-[24px] font-black leading-tight text-emerald-700">{formatScore(type, row)}</p>
      </div>
    </article>
  );
}

function RankingRow({ row, type }) {
  return (
    <article
      className={`group min-w-0 rounded-3xl border p-4 shadow-sm transition active:scale-[0.99] ${
        row.isCurrentFarm
          ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-white ring-2 ring-emerald-100"
          : "border-white/80 bg-white/95 hover:border-emerald-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[20px] font-black shadow-sm ${
            row.rank <= 3 ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-800"
          }`}
        >
          {rankBadge(row.rank)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="line-clamp-1 text-[18px] font-black leading-tight text-slate-950">{row.farmName}</p>
            {row.isCurrentFarm ? (
              <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white">तुम्ही</span>
            ) : null}
          </div>
          <RowMeta row={row} />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[19px] font-black leading-tight text-emerald-700">{formatScore(type, row)}</p>
          <p className="mt-1 text-[11px] font-black text-slate-400">{scoreCaption(type)}</p>
        </div>
      </div>
    </article>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
      </div>
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
      ))}
    </div>
  );
}

function FilterGroup({ title, badge, helper, children }) {
  return (
    <div className="min-w-0 rounded-3xl border border-white/80 bg-white/95 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="flex min-h-[32px] items-center justify-between gap-3">
        <p className="min-w-0 text-[16px] font-black leading-tight text-slate-800">{title}</p>
        {badge ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>
      {helper ? <p className="mt-1 text-[13px] font-bold text-slate-500">{helper}</p> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MetricScrollCard({ active, icon, title, onClick }) {
  const activeClass = active
    ? "border-slate-950 bg-slate-950 text-white ring-2 ring-slate-200"
    : "border-slate-200 bg-white text-slate-950 hover:border-slate-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[116px] w-[174px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-soft active:scale-[0.98] ${activeClass}`}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[24px] ${active ? "bg-white/15 text-white" : "bg-slate-50 text-slate-950"}`}>
        {icon}
      </span>
      <span className={`block w-full whitespace-normal break-words text-[15px] font-black leading-snug ${active ? "text-white" : "text-slate-950"}`}>
        {title}
      </span>
    </button>
  );
}

function ScopeCard({ active, icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[104px] min-w-0 items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-soft active:scale-[0.98] ${
        active
          ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] shadow-sm">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block whitespace-normal break-words text-[16px] font-black leading-snug text-slate-950">{title}</span>
        <span className="mt-1 block whitespace-normal break-words text-[12px] font-bold leading-snug text-slate-600">{subtitle}</span>
      </span>
    </button>
  );
}

export default function LeaderboardPage() {
  const [type, setType] = useState("farm");
  const [scope, setScope] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeType = useMemo(
    () => leaderboardTypes.find((item) => item.value === type) || leaderboardTypes[0],
    [type]
  );
  const topRows = (data?.rows || []).slice(0, 3);
  const remainingRows = (data?.rows || []).slice(3);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ type, scope });
      const response = await fetch(`/api/leaderboard?${params.toString()}`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Leaderboard मिळाला नाही.");
      setData(result);
    } catch (loadError) {
      setError(loadError.message || "Leaderboard मिळाला नाही.");
    } finally {
      setLoading(false);
    }
  }, [type, scope]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="mx-auto w-full max-w-5xl pb-24">
        <LoadingState text="Leaderboard update होत आहे..." />
        <LeaderboardSkeleton />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-24">
      <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${activeType.color} p-5 text-white shadow-soft sm:p-6`}>
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15" />
        <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-black text-white/80">दूध उत्पादक स्पर्धा</p>
              <h1 className="mt-1 text-[34px] font-black leading-tight sm:text-[40px]">🏆 Leaderboard</h1>
              <p className="mt-2 max-w-2xl text-[17px] font-bold leading-snug text-white/85">
                सर्व दूध उत्पादक किंवा तुमच्या तालुक्यातील ranking बघा. Ranking वास्तविक app data वरून ठरते.
              </p>
            </div>
            <Link
              href="/achievements"
              className="shrink-0 rounded-2xl bg-white/95 px-4 py-3 text-[14px] font-black text-slate-950 shadow-sm active:scale-[0.98]"
            >
              🏅 Badges
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
              <p className="text-[12px] font-black text-white/75">Ranking Type</p>
              <p className="mt-1 text-[18px] font-black">{activeType.icon} {activeType.short}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
              <p className="text-[12px] font-black text-white/75">Scope</p>
              <p className="mt-1 text-[18px] font-black">{scope === "taluka" ? "माझा तालुका" : "सर्व दूध उत्पादक"}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
              <p className="text-[12px] font-black text-white/75">दूध उत्पादक</p>
              <p className="mt-1 text-[18px] font-black">{toMarathiNumerals(data?.rows?.length || 0)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 ring-1 ring-white/20">
              <p className="text-[12px] font-black text-white/75">तुमची Rank</p>
              <p className="mt-1 text-[18px] font-black">
                {data?.currentFarm?.rank ? `#${toMarathiNumerals(data.currentFarm.rank)}` : "-"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <FilterGroup
        title="काय मोजायचे?"
        badge={`${activeType.icon} ${activeType.short}`}
        helper="उजवीकडे swipe करून बाकी ranking प्रकार निवडा."
      >
        <div className="-mx-1 overflow-x-auto pb-2">
          <div className="flex w-max gap-3 px-1">
            {leaderboardTypes.map((item) => (
              <MetricScrollCard
                key={item.value}
                active={type === item.value}
                icon={item.icon}
                title={item.label}
                onClick={() => setType(item.value)}
              />
            ))}
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Ranking कुठली?" badge={scope === "taluka" ? "तालुका" : "सर्व"}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {scopeOptions.map((item) => (
            <ScopeCard
              key={item.value}
              active={scope === item.value}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onClick={() => setScope(item.value)}
            />
          ))}
        </div>
      </FilterGroup>

      {scope === "taluka" && !data?.currentTaluka ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[18px] font-black text-amber-950">तालुका माहिती अपूर्ण आहे</p>
          <p className="mt-1 text-[15px] font-bold leading-snug text-amber-800">
            माझा तालुका ranking दाखवण्यासाठी profile मध्ये तालुका निवडा.
          </p>
          <Link href="/profile" className="mt-3 inline-flex min-h-[44px] items-center rounded-2xl bg-amber-600 px-4 text-[15px] font-black text-white">
            Profile अपडेट करा
          </Link>
        </section>
      ) : null}

      {data?.currentFarm ? (
        <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[15px] font-black text-emerald-700">तुमची position</p>
              <h2 className="mt-1 break-words text-[30px] font-black leading-tight text-slate-950">
                #{toMarathiNumerals(data.currentFarm.rank)} {data.currentFarm.farmName}
              </h2>
              <p className="mt-1 text-[15px] font-bold text-slate-500">
                {scope === "taluka" ? `${data.currentTaluka || "तालुका"} ranking` : "सर्व दूध उत्पादक ranking"} · {data.currentFarm.rankLabel}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-left shadow-sm sm:text-right">
              <p className="text-[13px] font-black text-slate-500">{scoreCaption(type)}</p>
              <p className="mt-1 text-[30px] font-black leading-tight text-emerald-700">{formatScore(type, data.currentFarm)}</p>
            </div>
          </div>
        </section>
      ) : null}

      {topRows.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[25px] font-black leading-tight text-slate-950">Top दूध उत्पादक</h2>
              <p className="mt-1 text-[15px] font-bold text-slate-500">
                {scope === "taluka" ? `${data?.currentTaluka || "माझा तालुका"} मधील ranking` : "सर्व दूध उत्पादक मधील ranking"}
              </p>
            </div>
            {loading ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-500">अपडेट...</span> : null}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {topRows.map((row) => <PodiumCard key={row.farmId} row={row} type={type} />)}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-black text-slate-950">पूर्ण Ranking</h2>
            <p className="mt-1 text-[15px] font-bold text-slate-500">
              {toMarathiNumerals(data?.rows?.length || 0)} दूध उत्पादक दिसत आहेत.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-black text-slate-700 shadow-sm disabled:opacity-60"
          >
            {loading ? "अपडेट..." : "🔄 Refresh"}
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {[...topRows, ...remainingRows].map((row) => (
            <RankingRow key={row.farmId} row={row} type={type} />
          ))}
          {!data?.rows?.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div className="text-[44px]">🏆</div>
              <h3 className="mt-3 text-[22px] font-black text-slate-950">अजून ranking data नाही</h3>
              <p className="mt-1 text-[16px] font-bold text-slate-500">Achievements evaluate झाल्यावर दूध उत्पादक इथे दिसतील.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
