"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import MonthSelector from "@/components/accounting/MonthSelector";
import ProfitWaterfall from "@/components/accounting/ProfitWaterfall";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { accountingExpenseCategories, expenseCategoryMeta } from "@/lib/accountingUtils";
import { fetchAccountingSummary } from "@/lib/offlineActions";
import { formatLitres, toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

const ProfitTrendChart = dynamic(() => import("@/components/accounting/ProfitTrendChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-[18px] font-extrabold text-slate-600">
      चार्ट लोड होत आहे...
    </div>
  )
});

function getInitialMonth() {
  return getIndiaMonthParts();
}

export default function ProfitPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchAccountingSummary(monthValue.month, monthValue.year);
      setData(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "नफा माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const summary = data?.summary || {};
  const report = data?.report || {};
  const settlements = report.settlements || [];
  const expensesByCategory = report.expensesSummary?.byCategory || {};
  const income = Number(summary.total_milk_income || 0);
  const expenses = Number(summary.total_all_expenses || 0);
  const deductions = Number(summary.total_dairy_deductions || 0);
  const settlementFeedDeduction = Number(report.settlementsSummary?.cattleFeedDeduction || 0);
  const netProfit = Number(summary.net_profit || income - expenses - deductions);
  const trend = (data?.trend || []).map((item) => ({
    ...item,
    profit: Number(item.netProfit || 0)
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="📊 मासिक नफा/तोटा" subtitle="दूध उत्पन्न, खर्च आणि कपात" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="नफा/तोटा लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadSummary} /> : null}

      {!loading && !error ? (
        <>
          <ProfitWaterfall income={income} expenses={expenses} deductions={deductions} />

          <section className="grid grid-cols-2 gap-3">
            <SummaryCard emoji="💰" title="एकूण दूध उत्पन्न" value={toMarathiCurrency(income)} subtext={`${formatLitres(summary.total_liters || 0)} लिटर`} color="green" />
            <SummaryCard emoji="💸" title="एकूण खर्च" value={toMarathiCurrency(expenses)} subtext="फार्म खर्च" color="red" />
            <SummaryCard emoji="📉" title="नफ्यात धरलेली कपात" value={toMarathiCurrency(deductions)} subtext="इतर देयक कपात" color="red" />
            <SummaryCard emoji="📊" title="शुद्ध नफा" value={toMarathiCurrency(netProfit)} subtext={netProfit >= 0 ? "नफा" : "तोटा"} color={netProfit >= 0 ? "green" : "red"} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">सविस्तर तपशील</h2>
            <div className="mt-4 space-y-5">
              <div>
                <h3 className="text-[21px] font-extrabold text-green-800">उत्पन्न</h3>
                <p className="mt-2 text-[19px] font-bold text-slate-700">
                  दूध विक्री: {toMarathiCurrency(income)}
                </p>
                {settlements.map((settlement) => (
                  <p key={settlement.id} className="mt-1 text-[18px] font-semibold text-slate-600">
                    सेटलमेंट: {toMarathiCurrency(settlement.total_milk_income)}
                  </p>
                ))}
              </div>

              <div>
                <h3 className="text-[21px] font-extrabold text-red-800">डेअरी कपात</h3>
                <p className="mt-2 text-[19px] font-bold text-slate-700">
                  खाद्य कपात: {toMarathiCurrency(settlementFeedDeduction)}
                </p>
                {settlementFeedDeduction > 0 ? (
                  <p className="mt-1 text-[17px] font-bold text-slate-500">
                    खाद्य कपात खर्चात पुन्हा जोडलेली नाही. खाद्य खर्च खर्च नोंदीतून धरला जातो.
                  </p>
                ) : null}
                <p className="mt-1 text-[19px] font-bold text-slate-700">
                  इतर कपात: {toMarathiCurrency(report.settlementsSummary?.otherDeductions || 0)}
                </p>
              </div>

              <div>
                <h3 className="text-[21px] font-extrabold text-red-800">फार्म खर्च</h3>
                <div className="mt-2 grid gap-2">
                  {accountingExpenseCategories.map((category) => (
                    <div key={category} className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-[19px] font-bold text-slate-800">
                      <span>{expenseCategoryMeta[category]?.emoji} {expenseCategoryMeta[category]?.label || category}</span>
                      <span>{toMarathiCurrency(expensesByCategory[category] || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">६ महिन्यांचा नफा ट्रेंड</h2>
            {trend.length > 0 ? (
              <div className="mt-4 h-[260px]">
                <ProfitTrendChart trend={trend} netProfit={netProfit} />
              </div>
            ) : (
              <p className="mt-4 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-[20px] font-extrabold text-slate-600">
                ट्रेंडसाठी अजून माहिती नाही.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
