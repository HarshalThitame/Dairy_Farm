"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import {
  formatLitres,
  formatMarathiDate,
  getTodayISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchMilkByDate } from "@/lib/offlineActions";

const recordActions = [
  {
    href: "/nondi/dudh",
    title: "दूध नोंद",
    description: "रोजचे दूध नोंदवा",
    emoji: "🥛",
    tone: "border-blue-200 bg-blue-50 text-blue-900"
  },
  {
    href: "/nondi/ai",
    title: "कृत्रिम रेतन",
    description: "रेतन तारीख आणि माहिती",
    emoji: "💉",
    tone: "border-purple-200 bg-purple-50 text-purple-900"
  },
  {
    href: "/nondi/arogya",
    title: "आरोग्य नोंद",
    description: "आजारपण / उपचार नोंद",
    emoji: "🏥",
    tone: "border-red-200 bg-red-50 text-red-900"
  },
  {
    href: "/nondi/lasikaran",
    title: "लसीकरण",
    description: "लस आणि जंतनाशक",
    emoji: "💊",
    tone: "border-green-200 bg-green-50 text-green-900"
  }
];

const tabs = [
  { id: "dudh", label: "दूध", url: "/api/milk", dateField: "date" },
  { id: "retan", label: "रेतन", url: "/api/ai", dateField: "ai_date" },
  { id: "arogya", label: "आरोग्य", url: "/api/health", dateField: "date" }
];

function getRecordInfo(tabId, record) {
  if (tabId === "dudh") {
    return `एकूण ${formatLitres(record.total_litres)} लिटर`;
  }

  if (tabId === "retan") {
    return record.bull_code ? `बैल कोड: ${record.bull_code}` : "कृत्रिम रेतन नोंद";
  }

  return record.description || record.type || "आरोग्य नोंद";
}

export default function NondiPage() {
  const [todayMilkRecords, setTodayMilkRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("dudh");
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(false);
  const [error, setError] = useState("");
  const today = getTodayISODate();

  const fetchTodayMilk = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchMilkByDate(today);

      setTodayMilkRecords(result.data || []);
    } catch (fetchError) {
      setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTodayMilk();
  }, [fetchTodayMilk]);

  useEffect(() => {
    async function fetchRecentRecords() {
      const currentTab = tabs.find((tab) => tab.id === activeTab);
      setRecentLoading(true);

      try {
        const response = await fetch(currentTab.url, { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "नोंदी मिळाल्या नाहीत.");
        }

        setRecentRecords((result.data || []).slice(0, 5));
      } catch {
        setRecentRecords([]);
      } finally {
        setRecentLoading(false);
      }
    }

    fetchRecentRecords();
  }, [activeTab]);

  const todayMilkTotal = useMemo(() => {
    return todayMilkRecords.reduce(
      (total, record) => total + Number(record.total_litres || 0),
      0
    );
  }, [todayMilkRecords]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchTodayMilk} />;
  }

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader title="📋 नोंदी" subtitle={formatMarathiDate(today)} />

      <section className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-soft">
        <h2 className="text-[24px] font-extrabold text-slate-950">आजची नोंद</h2>
        <p className="mt-2 text-[22px] font-extrabold text-sheti">
          आज एकूण दूध: {formatLitres(todayMilkTotal)} लिटर
        </p>
        <Link
          href="/nondi/dudh"
          className="mt-4 flex min-h-[56px] items-center justify-center rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm active:bg-green-700"
        >
          🥛 आजचे दूध नोंदवा
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="नोंदीचे प्रकार">
        {recordActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex min-h-[154px] flex-col items-center justify-center rounded-lg border-2 p-3 text-center shadow-soft active:scale-[0.99] ${action.tone}`}
          >
            <span className="text-[42px] leading-none" aria-hidden="true">
              {action.emoji}
            </span>
            <span className="mt-3 text-[22px] font-extrabold leading-tight">
              {action.title}
            </span>
            <span className="mt-2 text-[18px] font-semibold leading-snug">
              {action.description}
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-[24px] font-extrabold text-slate-950">अलीकडील नोंदी</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[52px] rounded-lg border-2 px-3 text-[18px] font-extrabold ${
                activeTab === tab.id
                  ? "border-green-300 bg-green-100 text-sheti"
                  : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {recentLoading ? (
            <p className="rounded-lg bg-slate-50 p-4 text-[19px] font-bold text-slate-700">
              नोंदी लोड होत आहेत...
            </p>
          ) : null}

          {!recentLoading && recentRecords.length > 0
            ? recentRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-[20px] font-extrabold text-slate-950">
                    {record.cows?.name || "गाय"}
                  </p>
                  <p className="mt-1 text-[18px] font-semibold text-slate-700">
                    तारीख: {formatMarathiDate(record[currentTab.dateField])}
                  </p>
                  <p className="mt-1 text-[18px] font-semibold leading-snug text-slate-700">
                    {getRecordInfo(activeTab, record)}
                  </p>
                </article>
              ))
            : null}

          {!recentLoading && recentRecords.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
              अजून नोंदी नाहीत.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
