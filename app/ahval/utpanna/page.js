"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AmountBarChart from "@/components/AmountBarChart";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import {
  formatCurrency,
  formatLitres,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";
import { displayFinanceCategory, getIndiaMonthParts } from "@/lib/reportUtils";

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

function formatRate(value) {
  const numberValue = Number(value || 0);
  const rounded = Number.isInteger(numberValue) ? numberValue : Number(numberValue.toFixed(2));
  return `₹ ${toMarathiNumerals(rounded)}`;
}

function buildDailyIncome(transactions) {
  const totals = new Map();

  transactions.forEach((transaction) => {
    totals.set(transaction.date, (totals.get(transaction.date) || 0) + Number(transaction.amount || 0));
  });

  return Array.from(totals.entries())
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, amount]) => ({
      label: formatMarathiDate(date).slice(0, 6),
      date,
      amount: Number(amount.toFixed(2))
    }));
}

function IncomeTransaction({ transaction }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[20px] font-extrabold text-slate-950">
            {displayFinanceCategory(transaction.category)}
          </p>
          <p className="mt-1 text-[18px] font-bold text-slate-600">
            {formatMarathiDate(transaction.date)}
          </p>
          {transaction.description ? (
            <p className="mt-1 text-[18px] font-semibold text-slate-600">{transaction.description}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-[21px] font-extrabold text-green-700">
          + {formatCurrency(transaction.amount)}
        </p>
      </div>
    </article>
  );
}

export default function IncomeAnalyticsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [financeReport, setFinanceReport] = useState(null);
  const [milkReport, setMilkReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = `month=${monthValue.month}&year=${monthValue.year}`;
      const [finance, milk] = await Promise.all([
        fetchJson(`/api/reports/finance?${query}`),
        fetchJson(`/api/reports/milk?${query}`)
      ]);

      setFinanceReport(finance);
      setMilkReport(milk);
    } catch (fetchError) {
      setError(fetchError.message || "उत्पन्न अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const incomeTransactions = useMemo(
    () => (financeReport?.transactions || []).filter((transaction) => transaction.type === "उत्पन्न"),
    [financeReport?.transactions]
  );
  const dailyIncome = useMemo(() => buildDailyIncome(incomeTransactions), [incomeTransactions]);
  const milkIncome = Number(financeReport?.milkIncome || 0);
  const otherIncome = Math.max(0, Number(financeReport?.totalIncome || 0) - milkIncome);
  const rateRows = (milkReport?.dailyRecords || []).filter((record) => Number(record.total || 0) > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="💰 उत्पन्न सविस्तर" subtitle="दूध विक्री, दर आणि रोजचे उत्पन्न" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="उत्पन्न अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReports} /> : null}

      {!loading && !error && financeReport && milkReport ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              emoji="💰"
              title="एकूण उत्पन्न"
              value={formatCurrency(financeReport.totalIncome || 0)}
              subtext="या महिन्यात"
              color="green"
            />
            <SummaryCard
              emoji="🥛"
              title="दूध विक्री"
              value={formatCurrency(milkIncome)}
              subtext={`${formatLitres(milkReport.totalLitres || 0)} लिटर`}
              color="blue"
            />
            <SummaryCard
              emoji="📈"
              title="सरासरी दूध दर"
              value={formatRate(milkReport.sessionSummary?.averageRate || 0)}
              subtext="प्रति लिटर"
              color="yellow"
            />
            <SummaryCard
              emoji="🧾"
              title="इतर उत्पन्न"
              value={formatCurrency(otherIncome)}
              subtext="पेमेंट / इतर"
              color="purple"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">रोजचे उत्पन्न</h2>
            <div className="mt-4">
              <AmountBarChart data={dailyIncome} height={260} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">उत्पन्न प्रकार</h2>
            <div className="mt-4 space-y-3">
              {(financeReport.incomeByCategory || []).map((item) => (
                <div key={item.category} className="rounded-lg bg-green-50 p-3 text-green-900">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[19px] font-extrabold">{item.category}</p>
                    <p className="text-[20px] font-extrabold">{formatCurrency(item.amount)}</p>
                  </div>
                </div>
              ))}
              {(financeReport.incomeByCategory || []).length === 0 ? (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                  उत्पन्न नोंदी नाहीत.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">दूध दर इतिहास</h2>
            <div className="mt-4 space-y-3">
              {rateRows.slice().reverse().map((record) => (
                <div key={record.id || record.date} className="rounded-lg bg-blue-50 p-3 text-blue-900">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[19px] font-extrabold">{formatMarathiDate(record.date)}</p>
                      <p className="mt-1 text-[17px] font-bold">
                        {formatLitres(record.total)} लिटर
                      </p>
                    </div>
                    <p className="shrink-0 text-[20px] font-extrabold">
                      {formatRate(record.averageRate || 0)}
                    </p>
                  </div>
                </div>
              ))}
              {rateRows.length === 0 ? (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                  दूध दर नोंदी नाहीत.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">बाकी पेमेंट</h2>
            <p className="mt-3 rounded-lg bg-slate-50 p-4 text-[19px] font-bold leading-relaxed text-slate-700">
              ग्राहकनिहाय बाकी पेमेंटसाठी स्वतंत्र नोंद उपलब्ध नाही. सध्या सर्व उत्पन्न व्यवहार म्हणून दाखवले आहे.
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">उत्पन्न व्यवहार</h2>
            <div className="mt-4 space-y-3">
              {incomeTransactions.length > 0 ? (
                incomeTransactions.map((transaction) => (
                  <IncomeTransaction key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                  उत्पन्न व्यवहार नाहीत.
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
