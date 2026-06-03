"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const leaderboardTypes = [
  ["farm", "Farm Ranking", "⭐"],
  ["milk", "Milk Ranking", "🥛"],
  ["ai_usage", "AI Ranking", "🤖"],
  ["ocr_usage", "OCR Ranking", "📸"],
  ["activity", "Activity", "🔥"],
  ["district", "District", "📍"]
];

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function formatScore(type, row) {
  if (type === "milk") return `${toMarathiNumerals(Number(row.metrics?.total_milk_liters || 0).toFixed(1))} लि.`;
  if (type === "ai_usage") return `${toMarathiNumerals(row.metrics?.ai_questions || 0)} प्रश्न`;
  if (type === "ocr_usage") return `${toMarathiNumerals(row.metrics?.slips_uploaded || 0)} slips`;
  if (type === "activity") return `${toMarathiNumerals(row.metrics?.recent_activity_days || 0)} दिवस`;
  return `${toMarathiNumerals(Number(row.dairyScore || 0).toFixed(1))}%`;
}

export default function LeaderboardPage() {
  const [type, setType] = useState("farm");
  const [scope, setScope] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [type, scope]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState text="Leaderboard update होत आहे..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="📊 Leaderboard"
        subtitle="Farm ranking, milk ranking, AI/OCR usage आणि district comparison."
        action={<Link href="/achievements" className="rounded-xl bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-sm">Achievements</Link>}
      />

      <section className="rounded-2xl border border-white/80 bg-white/95 p-3 shadow-soft">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {leaderboardTypes.map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-black ${
                type === value ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`min-h-[46px] rounded-xl text-[15px] font-black ${scope === "all" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            सर्व Farms
          </button>
          <button
            type="button"
            onClick={() => setScope("district")}
            className={`min-h-[46px] rounded-xl text-[15px] font-black ${scope === "district" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            माझा जिल्हा
          </button>
        </div>
      </section>

      {data.currentFarm ? (
        <section className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 shadow-soft">
          <p className="text-[15px] font-black text-yellow-800">तुमची position</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[30px] font-black text-yellow-950">#{toMarathiNumerals(data.currentFarm.rank)} {data.currentFarm.farmName}</h2>
              <p className="text-[15px] font-bold text-yellow-800">{data.currentFarm.rankLabel}</p>
            </div>
            <p className="text-[28px] font-black text-yellow-950">{formatScore(type, data.currentFarm)}</p>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Ranking</h2>
        <div className="mt-3 grid gap-2">
          {(data.rows || []).map((row) => (
            <article
              key={row.farmId}
              className={`flex items-center gap-3 rounded-2xl p-4 ${
                row.isCurrentFarm ? "border-2 border-green-300 bg-green-50" : "bg-slate-50"
              }`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[18px] font-black ${
                row.rank <= 3 ? "bg-yellow-400 text-yellow-950" : "bg-white text-slate-700"
              }`}>
                {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : toMarathiNumerals(row.rank)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[18px] font-black text-slate-950">{row.farmName}</p>
                <p className="text-[13px] font-bold text-slate-500">{row.districtName || "जिल्हा नाही"} · {row.rankLabel}</p>
              </div>
              <p className="text-right text-[18px] font-black text-green-700">{formatScore(type, row)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

