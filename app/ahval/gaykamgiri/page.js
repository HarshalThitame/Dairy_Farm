"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  calculateAgeMarathi,
  formatCowBreed,
  formatLitres,
  toISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";
import { getIndiaMonthParts, getMonthRange, getReportMonthFromSearchParams } from "@/lib/reportUtils";

const MiniSparkline = dynamic(() => import("@/components/MiniSparkline"), {
  ssr: false,
  loading: () => <div className="h-16 rounded-lg bg-slate-50" />
});

const filters = ["सर्व गायी", "फक्त दुधाळ गायी", "गाभण गायी", "कमी उत्पादन गायी"];

function getInitialMonth() {
  const current = getIndiaMonthParts();
  if (typeof window === "undefined") {
    return current;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return getReportMonthFromSearchParams(searchParams, current);
}

function getLastSevenDates() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return toISODate(date);
  });
}

function addDaysISO(dateString, days) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getMonthDateQuery(monthValue) {
  const range = getMonthRange(monthValue.month, monthValue.year);
  const endInclusive = addDaysISO(range.end, -1);
  return `from=${range.start}&to=${endInclusive}`;
}

function getBorderClass(cow, index, totalCount) {
  if (cow.totalMilk <= 0) {
    return "border-slate-300";
  }

  const topCutoff = Math.max(1, Math.ceil(totalCount * 0.25));
  const bottomStart = Math.max(0, totalCount - topCutoff);

  if (index < topCutoff) {
    return "border-green-300";
  }

  if (index >= bottomStart) {
    return "border-yellow-300";
  }

  return "border-blue-200";
}

export default function CowPerformancePage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [cows, setCows] = useState([]);
  const [milkReport, setMilkReport] = useState(null);
  const [aiRecords, setAiRecords] = useState([]);
  const [calvingRecords, setCalvingRecords] = useState([]);
  const [recentMilk, setRecentMilk] = useState([]);
  const [activeFilter, setActiveFilter] = useState("सर्व गायी");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const dates = getLastSevenDates();
      const monthDateQuery = getMonthDateQuery(monthValue);
      const [cowsResult, milkResult, aiResult, calvingResult, recentMilkResult] =
        await Promise.all([
          fetchJson("/api/cows"),
          fetchJson(`/api/reports/milk?month=${monthValue.month}&year=${monthValue.year}`),
          fetchJson(`/api/ai?${monthDateQuery}`),
          fetchJson(`/api/calving?${monthDateQuery}`),
          fetchJson(`/api/milk?from=${dates[0]}&to=${dates[6]}`)
        ]);

      setCows(cowsResult || []);
      setMilkReport(milkResult);
      setAiRecords(aiResult || []);
      setCalvingRecords(calvingResult || []);
      setRecentMilk(recentMilkResult || []);
    } catch (fetchError) {
      setError(fetchError.message || "अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const performance = useMemo(() => {
    const milkByCow = new Map((milkReport?.perCow || []).map((cow) => [cow.cow_id, cow]));
    const aiCountByCow = aiRecords.reduce((map, record) => {
      map.set(record.cow_id, (map.get(record.cow_id) || 0) + 1);
      return map;
    }, new Map());
    const calvingCountByCow = calvingRecords.reduce((map, record) => {
      map.set(record.cow_id, (map.get(record.cow_id) || 0) + 1);
      return map;
    }, new Map());
    const lastSevenDates = getLastSevenDates();

    return cows
      .map((cow) => {
        const milk = milkByCow.get(cow.id) || { total: 0, average: 0 };
        const trend = lastSevenDates.map((date) =>
          recentMilk
            .filter((record) => record.cow_id === cow.id && record.date === date)
            .reduce((sum, record) => sum + Number(record.total_litres || 0), 0)
        );

        return {
          ...cow,
          totalMilk: Number(milk.total || 0),
          averageMilk: Number(milk.average || 0),
          aiCount: aiCountByCow.get(cow.id) || 0,
          calvingCount: calvingCountByCow.get(cow.id) || 0,
          trend
        };
      })
      .sort((first, second) => second.totalMilk - first.totalMilk || first.name.localeCompare(second.name, "mr-IN"));
  }, [aiRecords, calvingRecords, cows, milkReport, recentMilk]);

  const filteredPerformance = useMemo(() => {
    if (activeFilter === "फक्त दुधाळ गायी") {
      return performance.filter((cow) => cow.totalMilk > 0);
    }

    if (activeFilter === "गाभण गायी") {
      return performance.filter((cow) => cow.status === "गाभण");
    }

    if (activeFilter === "कमी उत्पादन गायी") {
      const productive = performance.filter((cow) => cow.totalMilk > 0);
      const cutoff = productive.length > 0 ? productive[Math.max(0, Math.floor(productive.length * 0.75))]?.totalMilk || 0 : 0;
      return performance.filter((cow) => cow.totalMilk <= cutoff);
    }

    return performance;
  }, [activeFilter, performance]);

  return (
    <div className="space-y-6">
      <PageHeader title="🐄 गाय कामगिरी अहवाल" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="गाय कामगिरी लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReport} /> : null}

      {!loading && !error ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`min-h-[52px] shrink-0 rounded-lg border-2 px-4 text-[18px] font-extrabold ${
                  activeFilter === filter
                    ? "border-green-300 bg-green-100 text-sheti"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <section className="space-y-4">
            {filteredPerformance.map((cow, index) => (
              <article
                key={cow.id}
                className={`rounded-lg border-2 bg-white p-4 shadow-soft ${getBorderClass(cow, index, performance.length)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/gayi/${cow.id}`}
                      className="text-[24px] font-extrabold leading-tight text-sheti"
                    >
                      {cow.name}
                    </Link>
                    <p className="mt-1 text-[18px] font-bold text-slate-700">
                      जात: {formatCowBreed(cow.breed)} | वय: {calculateAgeMarathi(cow.date_of_birth)}
                    </p>
                  </div>
                  <StatusBadge status={cow.status} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-blue-50 p-3 text-center text-blue-900">
                    <p className="text-[18px] font-extrabold">🥛 दूध</p>
                    <p className="mt-1 text-[20px] font-extrabold">
                      {formatLitres(cow.totalMilk)} लिटर
                    </p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 text-center text-purple-900">
                    <p className="text-[18px] font-extrabold">💉 रेतन</p>
                    <p className="mt-1 text-[20px] font-extrabold">
                      {toMarathiNumerals(cow.aiCount)} वेळा
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center text-green-900">
                    <p className="text-[18px] font-extrabold">🐄 व्यायण</p>
                    <p className="mt-1 text-[20px] font-extrabold">
                      {toMarathiNumerals(cow.calvingCount)} वेळा
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-2">
                  <MiniSparkline data={cow.trend} color={cow.totalMilk > 0 ? "#2563eb" : "#94a3b8"} />
                </div>
              </article>
            ))}

            {filteredPerformance.length === 0 ? (
              <p className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-5 text-center text-[20px] font-extrabold text-slate-600">
                या प्रकारात गायी नाहीत.
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
