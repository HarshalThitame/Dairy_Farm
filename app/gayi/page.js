"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import CowCard from "@/components/CowCard";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import {
  cowStatuses,
  getStatusFilterClass,
  getStatusMeta
} from "@/components/StatusBadge";
import { cacheCowSnapshot } from "@/lib/cowInstantCache";
import { toMarathiNumerals } from "@/lib/marathiUtils";
import { fetchCows as fetchCowsOffline } from "@/lib/offlineActions";

const statusLabels = {
  "गाभण": "गाभण",
  "रिकामी": "रिकामी",
  "व्याललेली": "व्याललेली",
  "उपचार सुरू": "उपचार",
  "वाळलेली": "वाळलेली"
};

export default function GayiPage() {
  const router = useRouter();
  const [cows, setCows] = useState([]);
  const [fromCache, setFromCache] = useState(false);
  const [fetchedAt, setFetchedAt] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchCowsOffline();
      setCows(result.data || []);
      setFromCache(Boolean(result.fromCache));
      setFetchedAt(result.fetchedAt || "");
    } catch (fetchError) {
      setError(fetchError.message || "गायींची माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCows();
  }, [fetchCows]);

  const counts = useMemo(() => {
    return cowStatuses.reduce((summary, status) => {
      summary[status] = cows.filter((cow) => cow.status === status).length;
      return summary;
    }, {});
  }, [cows]);

  const primaryStats = useMemo(() => {
    return [
      { label: "एकूण गायी", value: cows.length, tone: "bg-slate-950 text-white" },
      { label: "गाभण", value: counts["गाभण"] || 0, tone: "bg-green-50 text-green-900 ring-green-100" },
      { label: "रिकामी", value: counts["रिकामी"] || 0, tone: "bg-blue-50 text-blue-900 ring-blue-100" }
    ];
  }, [counts, cows.length]);

  const filteredCows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("mr-IN");

    return cows.filter((cow) => {
      const matchesStatus = statusFilter ? cow.status === statusFilter : true;
      const matchesSearch = normalizedQuery
        ? cow.name.toLocaleLowerCase("mr-IN").includes(normalizedQuery)
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [cows, query, statusFilter]);

  useEffect(() => {
    if (!filteredCows.length) return;

    const warmVisibleCows = () => {
      filteredCows.slice(0, 30).forEach((cow) => {
        cacheCowSnapshot(cow);
        router.prefetch(`/gayi/${cow.id}`);
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmVisibleCows, { timeout: 800 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(warmVisibleCows, 100);
    return () => window.clearTimeout(timeoutId);
  }, [filteredCows, router]);

  if (loading) {
    return <LoadingState text="गायी लोड होत आहेत..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCows} />;
  }

  return (
    <div className="space-y-5">
      <header className="dashboard-hero rounded-lg px-4 pb-4 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-extrabold text-green-100">
                माझी डेअरी
              </p>
              <h1 className="mt-1 text-[32px] font-extrabold leading-tight">
                🐄 माझ्या गायी
              </h1>
              <p className="mt-1 text-[18px] font-bold leading-snug text-green-50">
                {toMarathiNumerals(filteredCows.length)} दाखवत आहे / एकूण {toMarathiNumerals(cows.length)}
              </p>
            </div>
            <AdminOnly>
              <Link
                href="/gayi/navi"
                className="flex min-h-[52px] shrink-0 items-center justify-center rounded-lg bg-white px-4 text-[18px] font-extrabold text-green-800 shadow-sm active:bg-green-50"
              >
                ➕ जोडा
              </Link>
            </AdminOnly>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-3 gap-2 rounded-lg p-2">
            {primaryStats.map((stat) => (
              <article
                key={stat.label}
                className={`rounded-lg px-2 py-3 text-center shadow-sm ring-1 ${stat.tone}`}
              >
                <p className="text-[13px] font-extrabold leading-tight opacity-80">
                  {stat.label}
                </p>
                <p className="mt-1 text-[26px] font-black leading-none">
                  {toMarathiNumerals(stat.value)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </header>

      {fromCache ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[18px] font-bold text-amber-900 shadow-sm">
          शेवटचे अपडेट: {fetchedAt ? new Date(fetchedAt).toLocaleTimeString("mr-IN", { hour: "2-digit", minute: "2-digit" }) : "माहिती नाही"}
        </p>
      ) : null}

      <section className="dashboard-panel space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <label className="block">
          <span className="sr-only">गायीचे नाव शोधा</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="गायीचे नाव शोधा..."
            autoComplete="off"
            className="min-h-[58px] w-full rounded-lg border-2 border-slate-200 bg-slate-50 px-4 text-[20px] font-extrabold text-slate-950 shadow-sm outline-none transition focus:border-sheti focus:bg-white focus:ring-4 focus:ring-green-100"
          />
        </label>

        <div className="-mx-4 overflow-x-auto px-4" aria-label="स्थितीनुसार गायी">
          <div className="flex gap-3 pb-1">
            <button
              type="button"
              onClick={() => setStatusFilter("")}
              className={`min-h-[52px] shrink-0 rounded-full border-2 px-4 text-[18px] font-extrabold ${
                statusFilter
                  ? "border-slate-200 bg-white text-slate-700 active:bg-slate-50"
                  : "border-slate-950 bg-slate-950 text-white ring-2 ring-slate-200"
              }`}
            >
              सर्व: {toMarathiNumerals(cows.length)}
            </button>
            {cowStatuses.map((status) => {
              const meta = getStatusMeta(status);
              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(active ? "" : status)}
                  className={`min-h-[52px] shrink-0 rounded-full border-2 px-4 text-[18px] font-extrabold ${getStatusFilterClass(
                    status,
                    active
                  )}`}
                >
                  <span aria-hidden="true">{meta.emoji}</span>{" "}
                  {statusLabels[status]}: {toMarathiNumerals(counts[status] || 0)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {filteredCows.length > 0 ? (
        <section className="space-y-4" aria-label="गायींची यादी">
          {filteredCows.map((cow) => (
            <CowCard key={cow.id} cow={cow} />
          ))}
        </section>
      ) : (
        <section className="rounded-lg border-2 border-dashed border-slate-200 bg-white px-4 py-8 text-center shadow-soft">
          <p className="text-[22px] font-extrabold leading-relaxed text-slate-700">
            अजून कोणतीही गाय जोडलेली नाही 🐄
          </p>
          <AdminOnly>
            <Link
              href="/gayi/navi"
              className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-5 text-[19px] font-extrabold text-white shadow-sm active:bg-green-700"
            >
              ➕ पहिली गाय जोडा
            </Link>
          </AdminOnly>
        </section>
      )}

      <AdminOnly>
        <Link
          href="/gayi/navi"
          className="fixed bottom-28 right-4 z-30 flex min-h-[58px] items-center justify-center rounded-full bg-sheti px-5 text-[19px] font-extrabold text-white shadow-lg active:bg-green-700 sm:right-[calc(50%-22rem)]"
        >
          ➕ नवीन गाय जोडा
        </Link>
      </AdminOnly>
    </div>
  );
}
