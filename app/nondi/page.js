"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import {
  formatLitres,
  formatMarathiDate,
  getTodayISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson, fetchMilkByDate } from "@/lib/offlineActions";

const recordActions = [
  {
    href: "/nondi/dudh",
    title: "दूध नोंद",
    description: "रोजचे दूध नोंदवा",
    emoji: "🥛",
    tone: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-950",
    accent: "from-blue-500 to-cyan-400"
  },
  {
    href: "/nondi/chara",
    title: "चारा खर्च",
    description: "खाद्य माहिती, मुरघास/भुसा वार्षिक",
    emoji: "🌾",
    tone: "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-amber-950",
    accent: "from-amber-500 to-yellow-400"
  },
  {
    href: "/nondi/ai",
    title: "कृत्रिम रेतन",
    description: "रेतन तारीख आणि माहिती",
    emoji: "💉",
    tone: "border-purple-100 bg-gradient-to-br from-purple-50 via-white to-pink-50 text-purple-950",
    accent: "from-purple-500 to-pink-400"
  },
  {
    href: "/nondi/arogya",
    title: "आरोग्य नोंद",
    description: "आजारपण / उपचार नोंद",
    emoji: "🏥",
    tone: "border-red-100 bg-gradient-to-br from-red-50 via-white to-rose-50 text-red-950",
    accent: "from-red-500 to-rose-400"
  },
  {
    href: "/nondi/lasikaran",
    title: "लसीकरण",
    description: "लस आणि जंतनाशक",
    emoji: "💊",
    tone: "border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 text-green-950",
    accent: "from-green-500 to-emerald-400"
  },
  {
    href: "/vasare",
    title: "वासरे",
    description: "जन्म, दूध आणि वाढ",
    emoji: "🐮",
    tone: "border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 text-orange-950",
    accent: "from-orange-500 to-amber-400"
  }
];

const tabs = [
  { id: "dudh", label: "दूध", url: "/api/milk", dateField: "date" },
  { id: "retan", label: "रेतन", url: "/api/ai", dateField: "ai_date" },
  { id: "arogya", label: "आरोग्य", url: "/api/health", dateField: "date" }
];

function getRecordInfo(tabId, record) {
  if (tabId === "dudh") {
    const totalLitres =
      record.total_litres ?? Number(record.morning_litres || 0) + Number(record.evening_litres || 0);
    return `एकूण ${formatLitres(totalLitres)} लिटर`;
  }

  if (tabId === "retan") {
    return record.bull_code ? `बैल कोड: ${record.bull_code}` : "कृत्रिम रेतन नोंद";
  }

  return record.description || record.type || "आरोग्य नोंद";
}

function QuickMetric({ label, value, subtext, tone = "green" }) {
  const tones = {
    green: "bg-green-50 text-green-950 ring-green-100",
    blue: "bg-blue-50 text-blue-950 ring-blue-100",
    slate: "bg-white text-slate-950 ring-white/60"
  };

  return (
    <article className={`rounded-lg p-3 shadow-sm ring-1 ${tones[tone] || tones.green}`}>
      <p className="text-[13px] font-extrabold leading-tight opacity-70">{label}</p>
      <p className="mt-1 text-[23px] font-black leading-tight">{value}</p>
      {subtext ? <p className="mt-1 text-[13px] font-bold leading-tight opacity-70">{subtext}</p> : null}
    </article>
  );
}

function tabButtonClass(active) {
  return active
    ? "border-green-300 bg-green-100 text-sheti ring-2 ring-green-100"
    : "border-slate-200 bg-white text-slate-700 active:bg-green-50";
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
        const data = await fetchJson(currentTab.url);
        setRecentRecords((data || []).slice(0, 5));
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
      (total, record) =>
        total + Number(record.total_litres ?? Number(record.morning_litres || 0) + Number(record.evening_litres || 0)),
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
      <header className="dashboard-hero overflow-hidden rounded-lg px-4 pb-4 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-extrabold text-green-100">
                माझी डेअरी
              </p>
              <h1 className="mt-1 text-[34px] font-black leading-tight">
                📋 नोंदी
              </h1>
              <p className="mt-1 text-[18px] font-bold leading-snug text-green-50">
                {formatMarathiDate(today)}
              </p>
            </div>
            <Link
              href="/accounting/slip-scan"
              className="flex min-h-[52px] shrink-0 items-center justify-center rounded-lg bg-white px-4 text-[18px] font-extrabold text-green-800 shadow-sm active:bg-green-50"
            >
              📷 स्कॅन
            </Link>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-3 gap-2 rounded-lg p-2">
            <QuickMetric
              label="आज दूध"
              value={formatLitres(todayMilkTotal)}
              subtext="लिटर"
              tone="slate"
            />
            <QuickMetric
              label="आज नोंदी"
              value={toMarathiNumerals(todayMilkRecords.length)}
              subtext="दूध रेकॉर्ड"
              tone="green"
            />
            <QuickMetric
              label="प्रकार"
              value={toMarathiNumerals(recordActions.length)}
              subtext="नोंदी"
              tone="blue"
            />
          </div>
        </div>
      </header>

      <section className="dashboard-scan rounded-lg border border-green-200 bg-gradient-to-r from-green-50 via-white to-blue-50 p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="dashboard-scan-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-sheti text-[34px] text-white shadow-soft">
            🥛
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[24px] font-extrabold leading-tight text-slate-950">आजची दूध नोंद</h2>
            <p className="mt-1 text-[19px] font-extrabold leading-snug text-sheti">
              एकूण {formatLitres(todayMilkTotal)} लिटर
            </p>
          </div>
        </div>
        <Link
          href="/nondi/dudh"
          className="relative z-10 mt-4 flex min-h-[56px] items-center justify-center rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm active:bg-green-700"
        >
          🥛 आजचे दूध नोंदवा
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="नोंदीचे प्रकार">
        {recordActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`dashboard-card dashboard-action-tile relative flex min-h-[148px] flex-col items-center justify-center overflow-hidden rounded-lg border p-3 text-center shadow-soft ${action.tone}`}
          >
            <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${action.accent}`} aria-hidden="true" />
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

      <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="relative z-10">
          <h2 className="text-[24px] font-extrabold text-slate-950">अलीकडील नोंदी</h2>
          <p className="mt-1 text-[17px] font-bold text-slate-500">
            नवीन नोंदी पटकन तपासा
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[52px] rounded-full border-2 px-3 text-[18px] font-extrabold shadow-sm ${tabButtonClass(
                activeTab === tab.id
              )}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {recentLoading ? (
            <p className="rounded-lg bg-slate-50 p-4 text-[19px] font-bold text-slate-700 ring-1 ring-slate-100">
              नोंदी लोड होत आहेत...
            </p>
          ) : null}

          {!recentLoading && recentRecords.length > 0
            ? recentRecords.map((record) => (
                <article
                  key={record.id}
                  className="dashboard-card rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-green-50 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[20px] font-extrabold text-slate-950">
                        {activeTab === "dudh" ? "दैनिक दूध" : record.cows?.name || "गाय"}
                      </p>
                      <p className="mt-1 text-[18px] font-bold text-slate-700">
                        {getRecordInfo(activeTab, record)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[15px] font-extrabold text-slate-700 shadow-sm ring-1 ring-slate-100">
                      {formatMarathiDate(record[currentTab.dateField])}
                    </span>
                  </div>
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
