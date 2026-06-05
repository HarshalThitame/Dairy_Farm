"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { formatCurrency, toMarathiNumerals } from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";
import { getIndiaMonthParts } from "@/lib/reportUtils";

const AmountBarChart = dynamic(() => import("@/components/AmountBarChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg bg-slate-50 text-[18px] font-extrabold text-slate-600">
      चार्ट लोड होत आहे...
    </div>
  )
});
const FinancePieChart = dynamic(() => import("@/components/FinancePieChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg bg-slate-50 text-[18px] font-extrabold text-slate-600">
      चार्ट लोड होत आहे...
    </div>
  )
});

function getInitialMonth() {
  const current = getIndiaMonthParts();

  if (typeof window === "undefined") {
    return current;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return {
    month: Number(searchParams.get("month") || current.month),
    year: Number(searchParams.get("year") || current.year)
  };
}

function getComparisonText(change) {
  if (change > 0) {
    return `मागील महिन्यापेक्षा ${formatCurrency(change)} जास्त`;
  }

  if (change < 0) {
    return `मागील महिन्यापेक्षा ${formatCurrency(Math.abs(change))} कमी`;
  }

  return "मागील महिन्यासारखाच निकाल";
}

function PerformanceRow({ label, value, tone }) {
  return (
    <div className={`rounded-lg p-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[19px] font-extrabold">{label}</p>
        <p className="text-[21px] font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function combineExpenseBreakdown(report) {
  const combined = new Map();

  (report?.expenseByCategory || []).forEach((item) => {
    combined.set(item.category, Number(combined.get(item.category) || 0) + Number(item.amount || 0));
  });

  const feed = Number(report?.settlementDeductions?.cattleFeedDeduction || 0);
  const other = Number(report?.settlementDeductions?.otherDeductions || 0);

  if (feed > 0) {
    combined.set("खाद्य", Number(combined.get("खाद्य") || 0) + feed);
  }

  if (other > 0) {
    combined.set("इतर", Number(combined.get("इतर") || 0) + other);
  }

  return Array.from(combined.entries()).map(([category, amount]) => ({ category, amount }));
}

export default function ProfitAnalyticsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJson(
        `/api/reports/finance?month=${monthValue.month}&year=${monthValue.year}`
      );

      setReport(result);
    } catch (fetchError) {
      setError(fetchError.message || "नफा अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const trend = report?.monthlyTrend || [];
  const currentTrend = trend.find((item) => item.current) || trend[trend.length - 1] || null;
  const currentIndex = currentTrend ? trend.findIndex((item) => item === currentTrend) : -1;
  const previousTrend = currentIndex > 0 ? trend[currentIndex - 1] : null;
  const profitChange = Number(currentTrend?.profit || 0) - Number(previousTrend?.profit || 0);
  const profitChartData = trend.map((item) => ({
    label: item.label,
    amount: item.profit
  }));
  const incomeChartData = trend.map((item) => ({
    label: item.label,
    amount: item.income
  }));
  const expenseChartData = trend.map((item) => ({
    label: item.label,
    amount: Number(item.expense || 0) + Number(item.deductionsCountedInProfit || item.deductions || 0)
  }));
  const finalMonthlyExpense =
    Number(report?.totalExpense || 0) + Number(report?.deductionsCountedInProfit || 0);
  const topExpense = useMemo(() => {
    return combineExpenseBreakdown(report).sort(
      (first, second) => Number(second.amount || 0) - Number(first.amount || 0)
    )[0];
  }, [report]);

  return (
    <div className="space-y-6">
      <PageHeader title="📈 नफा-तोटा विश्लेषण" subtitle="उत्पन्न, खर्च आणि महिन्याची कामगिरी" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="नफा अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReport} /> : null}

      {!loading && !error && report ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              emoji="💰"
              title="एकूण उत्पन्न"
              value={formatCurrency(report.totalIncome || 0)}
              subtext="मासिक"
              color="green"
            />
            <SummaryCard
              emoji="💸"
              title="मासिक खर्च"
              value={formatCurrency(finalMonthlyExpense)}
              subtext="खाद्य खर्च + इतर"
              color="red"
            />
            <SummaryCard
              emoji={Number(report.netProfit || 0) >= 0 ? "📈" : "📉"}
              title={Number(report.netProfit || 0) >= 0 ? "नफा" : "तोटा"}
              value={formatCurrency(Math.abs(report.netProfit || 0))}
              subtext="इतर कपात धरून"
              color={Number(report.netProfit || 0) >= 0 ? "green" : "red"}
            />
            <SummaryCard
              emoji="🌾"
              title="वार्षिक खर्च"
              value={formatCurrency(report.annualExpense || 0)}
              subtext="मुरघास + भुसा वेगळे"
              color="yellow"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">या महिन्याचा निकाल</h2>
            <FinancePieChart income={report.totalIncome} expense={finalMonthlyExpense} />
            <p
              className={`rounded-lg p-4 text-center text-[22px] font-extrabold ${
                Number(report.netProfit || 0) >= 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {Number(report.netProfit || 0) >= 0
                ? `या महिन्यात ${formatCurrency(report.netProfit)} नफा`
                : `या महिन्यात ${formatCurrency(Math.abs(report.netProfit || 0))} तोटा`}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">मागील महिन्याशी तुलना</h2>
            <div className="mt-4 space-y-3">
              <PerformanceRow
                label="नफा बदल"
                value={getComparisonText(profitChange)}
                tone={profitChange >= 0 ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}
              />
              <PerformanceRow
                label="मोठा खर्च"
                value={topExpense ? `${topExpense.category} ${formatCurrency(topExpense.amount)}` : "नोंद नाही"}
                tone="bg-yellow-50 text-yellow-900"
              />
              <PerformanceRow
                label="व्यवहार"
                value={`${toMarathiNumerals((report.transactions || []).length)} नोंदी`}
                tone="bg-slate-50 text-slate-900"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">नफा ट्रेंड</h2>
            <div className="mt-4">
              <AmountBarChart data={profitChartData} height={260} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">उत्पन्न ट्रेंड</h2>
            <div className="mt-4">
              <AmountBarChart data={incomeChartData} height={240} positiveColor="#16a34a" />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">खर्च ट्रेंड</h2>
            <div className="mt-4">
              <AmountBarChart data={expenseChartData} height={240} positiveColor="#dc2626" />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">मुख्य मुद्दे</h2>
            <div className="mt-4 space-y-3">
              <PerformanceRow
                label="दूध उत्पन्न"
                value={formatCurrency(report.milkIncome || 0)}
                tone="bg-blue-50 text-blue-900"
              />
              <PerformanceRow
                label="इतर उत्पन्न"
                value={formatCurrency(Math.max(0, Number(report.totalIncome || 0) - Number(report.milkIncome || 0)))}
                tone="bg-green-50 text-green-900"
              />
              <PerformanceRow
                label="खाद्य खर्च"
                value={formatCurrency(report.settlementDeductions?.cattleFeedDeduction || 0)}
                tone="bg-red-50 text-red-900"
              />
              <PerformanceRow
                label="वार्षिक खर्च वेगळा"
                value={formatCurrency(report.annualExpense || 0)}
                tone="bg-yellow-50 text-yellow-900"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
