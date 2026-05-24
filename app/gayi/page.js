"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import CowCard from "@/components/CowCard";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import {
  cowStatuses,
  getStatusFilterClass,
  getStatusMeta
} from "@/components/StatusBadge";
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

  if (loading) {
    return <LoadingState text="गायी लोड होत आहेत..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCows} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="🐄 माझ्या गायी"
        subtitle={`एकूण ${toMarathiNumerals(cows.length)} गायी`}
      />

      {fromCache ? (
        <p className="rounded-lg bg-slate-100 px-4 py-3 text-[18px] font-bold text-slate-600">
          शेवटचे अपडेट: {fetchedAt ? new Date(fetchedAt).toLocaleTimeString("mr-IN", { hour: "2-digit", minute: "2-digit" }) : "माहिती नाही"}
        </p>
      ) : null}

      <section
        className="-mx-4 overflow-x-auto px-4"
        aria-label="स्थितीनुसार गायी"
      >
        <div className="flex gap-3 pb-1">
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
      </section>

      <label className="block">
        <span className="sr-only">गायीचे नाव शोधा</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="गायीचे नाव शोधा..."
          autoComplete="off"
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        />
      </label>

      {filteredCows.length > 0 ? (
        <section className="space-y-3" aria-label="गायींची यादी">
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
