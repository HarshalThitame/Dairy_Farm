"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MonthSelector from "@/components/accounting/MonthSelector";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { fetchAccountingSummary } from "@/lib/offlineActions";
import { formatLitres, getTodayISODate, toMarathiCurrency } from "@/lib/marathiUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

const actions = [
  {
    href: "/nondi/dudh?date=today",
    emoji: "🥛",
    title: "दूध नोंद",
    text: "आजचे दूध नोंदवा"
  },
  {
    href: "/accounting/settlements/new",
    emoji: "📋",
    title: "१५ दिवसांचे पेमेंट",
    text: "डेअरी सेटलमेंट नोंद करा"
  },
  {
    href: "/accounting/expenses/new",
    emoji: "💸",
    title: "खर्च नोंद",
    text: "चारा, औषध, इतर खर्च"
  },
  {
    href: "/accounting/dairy-slips",
    emoji: "📊",
    title: "दूध रेकॉर्ड्स बघा",
    text: "या महिन्याच्या सर्व दूध नोंदी"
  },
  {
    href: "/accounting/settlements",
    emoji: "📋",
    title: "सेटलमेंट्स बघा",
    text: "१५ दिवसांचे पेमेंट रेकॉर्ड्स"
  },
  {
    href: "/accounting/profit",
    emoji: "📈",
    title: "नफा/तोटा बघा",
    text: "महिन्याचा analysis"
  },
  {
    href: "/accounting/anamat",
    emoji: "🏦",
    title: "अनामत खाते",
    text: "साठवलेली रक्कम आणि क्लेम"
  }
];

function getInitialMonth() {
  return getIndiaMonthParts();
}

export default function AccountingHubPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchAccountingSummary(monthValue.month, monthValue.year);
      setData(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "हिशोब माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const todayMilk = useMemo(() => {
    const today = getTodayISODate();
    return (data?.report?.slips || [])
      .filter((slip) => slip.slip_date === today)
      .reduce((sum, slip) => sum + Number(slip.liters || 0), 0);
  }, [data?.report?.slips]);

  const summary = data?.summary || {};
  const netProfit = Number(summary.net_profit || 0);
  const anamat = Number(summary.total_anamat_accumulated || 0);

  return (
    <div className="space-y-6">
      <PageHeader title="💰 गोशाळा हिशोब" subtitle="दूध, खर्च, नफा - सर्व एकाठिकाणी" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="हिशोब लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchSummary} /> : null}

      {!loading && !error ? (
        <>
          <Link
            href="/accounting/slip-scan"
            className="flex min-h-[104px] items-center gap-4 rounded-lg border-2 border-green-200 bg-green-50 p-4 shadow-soft active:bg-green-100"
          >
            <span className="text-[42px]" aria-hidden="true">📷</span>
            <span>
              <span className="block text-[24px] font-extrabold text-green-950">स्लिप स्कॅन करा</span>
              <span className="mt-1 block text-[18px] font-bold leading-snug text-green-800">
                दूध किंवा देयक स्लिप फोटोमधून वाचा
              </span>
            </span>
          </Link>

          <section className="grid grid-cols-2 gap-3">
            <SummaryCard emoji="🥛" title="आजचे दूध" value={`${formatLitres(todayMilk)} लिटर`} subtext="आज" color="blue" />
            <SummaryCard emoji="📊" title="या महिन्याचे दूध" value={`${formatLitres(summary.total_liters || 0)} लिटर`} subtext="एकूण" color="blue" />
            <SummaryCard emoji="💰" title="या महिन्याचा उत्पन्न" value={toMarathiCurrency(summary.total_milk_income || 0)} subtext="दूध विक्री" color="green" />
            <SummaryCard emoji="🏦" title="या महिन्याची अनामत" value={toMarathiCurrency(anamat)} subtext="साठवलेली बचत" color="yellow" />
          </section>

          <section className="grid gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex min-h-[92px] items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft active:bg-green-50"
              >
                <span className="text-[34px]" aria-hidden="true">{action.emoji}</span>
                <span>
                  <span className="block text-[22px] font-extrabold text-slate-950">{action.title}</span>
                  <span className="mt-1 block text-[18px] font-bold text-slate-600">{action.text}</span>
                </span>
              </Link>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">मासिक सारांश</h2>
            <div className="mt-4 space-y-3 text-[20px] font-bold">
              <div className="flex justify-between gap-3"><span>दूध</span><span>{formatLitres(summary.total_liters || 0)} लि. | {toMarathiCurrency(summary.total_milk_income || 0)}</span></div>
              <div className="flex justify-between gap-3"><span>खर्च</span><span className="text-red-700">{toMarathiCurrency(summary.total_all_expenses || 0)}</span></div>
              <div className="flex justify-between gap-3"><span>खाद्य + इतर कपात</span><span className="text-red-700">{toMarathiCurrency(summary.total_dairy_deductions || 0)}</span></div>
              <div className="flex justify-between gap-3"><span>अनामत</span><span className="text-yellow-800">{toMarathiCurrency(anamat)}</span></div>
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-[22px] font-extrabold">
                <span>नफा</span>
                <span className={netProfit >= 0 ? "text-green-700" : "text-red-700"}>{toMarathiCurrency(netProfit)}</span>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
