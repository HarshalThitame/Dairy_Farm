"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import MonthSelector from "@/components/accounting/MonthSelector";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import { fetchAccountingSummary } from "@/lib/offlineActions";
import { formatLitres, getTodayISODate, toMarathiCurrency } from "@/lib/marathiUtils";
import { getIndiaMonthParts, getMonthLabel } from "@/lib/reportUtils";

const actions = [
  {
    href: "/nondi/dudh?date=today",
    emoji: "🥛",
    title: "दूध नोंद",
    badge: "हाताने नोंद",
    text: "स्कॅन न करता स्वतः दूध भरा",
    tone: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-950",
    accent: "from-blue-500 to-cyan-400"
  },
  {
    href: "/accounting/settlements/new",
    emoji: "📋",
    title: "१५ दिवसांचे पेमेंट",
    badge: "हाताने नोंद",
    text: "स्कॅन न करता सेटलमेंट भरा",
    tone: "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 text-emerald-950",
    accent: "from-emerald-500 to-green-400"
  },
  {
    href: "/accounting/dairy-slips",
    emoji: "📊",
    title: "दूध रेकॉर्ड्स बघा",
    text: "या महिन्याच्या सर्व दूध नोंदी",
    tone: "border-sky-100 bg-gradient-to-br from-sky-50 via-white to-blue-50 text-sky-950",
    accent: "from-sky-500 to-blue-400"
  },
  {
    href: "/accounting/settlements",
    emoji: "📋",
    title: "सेटलमेंट्स बघा",
    text: "१५ दिवसांचे पेमेंट रेकॉर्ड्स",
    tone: "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-amber-950",
    accent: "from-amber-500 to-yellow-400"
  },
  {
    href: "/accounting/profit",
    emoji: "📈",
    title: "नफा/तोटा बघा",
    text: "महिन्याचा analysis",
    tone: "border-purple-100 bg-gradient-to-br from-purple-50 via-white to-pink-50 text-purple-950",
    accent: "from-purple-500 to-pink-400"
  },
];

function MetricCard({ emoji, title, value, subtext, tone = "green" }) {
  const tones = {
    green: "border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 text-green-950",
    blue: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 text-blue-950",
    red: "border-red-100 bg-gradient-to-br from-red-50 via-white to-rose-50 text-red-950"
  };

  return (
    <article className={`dashboard-card dashboard-summary-tile min-h-[146px] overflow-hidden rounded-lg border p-4 shadow-soft ${tones[tone] || tones.green}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[34px] leading-none" aria-hidden="true">{emoji}</span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-extrabold shadow-sm ring-1 ring-white/70">
          हिशोब
        </span>
      </div>
      <p className="mt-3 text-[16px] font-extrabold leading-tight opacity-75">{title}</p>
      <p className="mt-2 break-words text-[24px] font-black leading-tight">{value}</p>
      <p className="mt-2 text-[15px] font-bold leading-snug opacity-75">{subtext}</p>
    </article>
  );
}

function ActionTile({ action }) {
  return (
    <Link
      href={action.href}
      className={`dashboard-card dashboard-action-tile relative flex min-h-[118px] items-center gap-4 overflow-hidden rounded-lg border p-4 shadow-soft ${action.tone}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${action.accent}`} aria-hidden="true" />
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/85 text-[34px] shadow-sm ring-1 ring-white/70" aria-hidden="true">
        {action.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block text-[21px] font-extrabold leading-tight">{action.title}</span>
          {action.badge ? (
            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[12px] font-black text-slate-700 shadow-sm ring-1 ring-white/70">
              {action.badge}
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-[16px] font-bold leading-snug opacity-75">{action.text}</span>
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[20px] font-extrabold text-white">
        →
      </span>
    </Link>
  );
}

function SummaryRow({ label, value, valueClass = "text-slate-950" }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3 ring-1 ring-slate-100">
      <span className="text-[18px] font-extrabold text-slate-700">{label}</span>
      <span className={`text-right text-[18px] font-black leading-snug ${valueClass}`}>{value}</span>
    </div>
  );
}

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
  const totalIncome = Number(summary.total_all_income ?? summary.total_milk_income ?? 0);
  const otherIncome = Number(summary.total_other_income || 0);
  const selectedMonthLabel = getMonthLabel(monthValue.month, monthValue.year);

  return (
    <div className="dashboard-enter space-y-5 pb-2">
      <header className="dashboard-hero overflow-hidden rounded-lg px-4 pb-4 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-extrabold text-green-100">माझी डेअरी</p>
              <h1 className="mt-1 text-[34px] font-black leading-tight">💰 हिशोब</h1>
              <p className="mt-2 max-w-[32rem] text-[18px] font-bold leading-snug text-green-50">
                {selectedMonthLabel} - दूध, खर्च, कपात आणि नफा एका ठिकाणी
              </p>
            </div>
            <Link
              href="/accounting/slip-scan"
              className="dashboard-card shrink-0 rounded-lg bg-white px-3 py-2 text-center text-[16px] font-black text-green-950 shadow-sm ring-1 ring-white/40 active:bg-green-50"
            >
              📷<span className="mt-1 block text-[13px]">स्कॅन</span>
            </Link>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-3 gap-2 rounded-lg p-2">
            <div className="rounded-lg px-2 py-3 text-center">
              <p className="text-[12px] font-bold text-green-100">आज दूध</p>
              <p className="mt-1 break-words text-[20px] font-black">{formatLitres(todayMilk)}</p>
            </div>
            <div className="rounded-lg px-2 py-3 text-center">
              <p className="text-[12px] font-bold text-green-100">उत्पन्न</p>
              <p className="mt-1 break-words text-[20px] font-black">{toMarathiCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-lg px-2 py-3 text-center">
              <p className="text-[12px] font-bold text-green-100">नफा</p>
              <p className="mt-1 break-words text-[20px] font-black">{toMarathiCurrency(netProfit)}</p>
            </div>
          </div>
        </div>
      </header>

      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="हिशोब लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchSummary} /> : null}

      {!loading && !error ? (
        <>
          <Link
            href="/accounting/slip-scan"
            className="dashboard-card dashboard-scan block rounded-lg border border-emerald-200 bg-gradient-to-r from-green-50 via-white to-blue-50 p-4 shadow-soft active:bg-green-100"
          >
            <span className="flex items-center gap-4">
              <span className="dashboard-scan-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-sheti text-[34px] text-white shadow-soft" aria-hidden="true">
                📷
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[24px] font-black leading-tight text-green-950">स्लिप स्कॅन करा</span>
                <span className="mt-1 block text-[17px] font-bold leading-snug text-green-800">
                  दूध किंवा १५ दिवसांची देयक स्लिप फोटोवरून वाचा
                </span>
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[20px] font-extrabold text-white">
                →
              </span>
            </span>
          </Link>

          <section className="dashboard-stagger grid grid-cols-2 gap-3" aria-label="हिशोब सारांश">
            <MetricCard emoji="🥛" title="आजचे दूध" value={`${formatLitres(todayMilk)} लिटर`} subtext="आजची नोंद" tone="blue" />
            <MetricCard emoji="📊" title="महिन्याचे दूध" value={`${formatLitres(summary.total_liters || 0)} लिटर`} subtext={selectedMonthLabel} tone="blue" />
            <MetricCard
              emoji="💰"
              title="उत्पन्न"
              value={toMarathiCurrency(totalIncome)}
              subtext={otherIncome > 0 ? "दूध + इतर उत्पन्न" : "दूध विक्रीतून"}
              tone="green"
            />
            <MetricCard emoji="📈" title="नफा" value={toMarathiCurrency(netProfit)} subtext={netProfit >= 0 ? "महिन्याचा नफा" : "महिन्याचा तोटा"} tone={netProfit >= 0 ? "green" : "red"} />
          </section>

          <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="mb-4">
              <h2 className="text-[24px] font-black text-slate-950">हिशोब कामे</h2>
              <p className="mt-1 text-[17px] font-bold leading-snug text-slate-600">
                हाताने दूध/सेटलमेंट भरा किंवा हिशोबाचे तपशील लवकर उघडा.
              </p>
            </div>
            <div className="space-y-3">
              {actions.map((action) => (
                <ActionTile key={action.href} action={action} />
              ))}
            </div>
          </section>

          <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[24px] font-black text-slate-950">मासिक सारांश</h2>
                <p className="mt-1 text-[17px] font-bold text-slate-600">{selectedMonthLabel}</p>
              </div>
              <Link
                href="/accounting/profit"
                className="dashboard-card shrink-0 rounded-full bg-green-50 px-3 py-2 text-[15px] font-extrabold text-sheti ring-1 ring-green-200 active:bg-green-100"
              >
                तपशील
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <SummaryRow
                label="दूध"
                value={`${formatLitres(summary.total_liters || 0)} लि. | ${toMarathiCurrency(summary.total_milk_income || 0)}`}
              />
              {otherIncome > 0 ? (
                <SummaryRow
                  label="इतर उत्पन्न"
                  value={toMarathiCurrency(otherIncome)}
                  valueClass="text-green-700"
                />
              ) : null}
              <SummaryRow
                label="इतर खर्च"
                value={toMarathiCurrency(summary.total_all_expenses || 0)}
                valueClass="text-red-700"
              />
              <SummaryRow
                label="डेअरी खाद्य/इतर कपात"
                value={toMarathiCurrency(summary.total_dairy_deductions || 0)}
                valueClass="text-red-700"
              />
              <div
                className={`rounded-lg border-2 p-4 ${
                  netProfit >= 0
                    ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 text-green-900"
                    : "border-red-200 bg-gradient-to-br from-red-50 to-rose-50 text-red-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[20px] font-black">निव्वळ नफा</span>
                  <span className="text-right text-[24px] font-black leading-tight">{toMarathiCurrency(netProfit)}</span>
                </div>
                <p className="mt-2 text-[15px] font-bold opacity-75">
                  एकूण उत्पन्नातून खर्च आणि डेअरी कपात वजा करून.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
