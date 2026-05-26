"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AmountBarChart from "@/components/AmountBarChart";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { getAccountingPeriodLabel } from "@/lib/accountingPeriods";
import {
  formatCurrency,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";
import { displayFinanceCategory, getIndiaMonthParts } from "@/lib/reportUtils";

const filterOptions = ["सर्व", "चारा", "औषध", "रेतन खर्च", "मजुरी", "इतर"];

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

function transactionCategory(transaction) {
  return displayFinanceCategory(transaction.category);
}

function buildExpenseChart(items) {
  return (items || []).map((item) => ({
    label: item.category,
    amount: Number(item.amount || 0)
  }));
}

function ExpenseTransaction({ transaction, annual = false }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[20px] font-extrabold text-slate-950">
            {transactionCategory(transaction)}
          </p>
          <p className="mt-1 text-[18px] font-bold text-slate-600">
            {formatMarathiDate(transaction.date)}
            {annual ? " | वार्षिक" : ""}
          </p>
          {transaction.description ? (
            <p className="mt-1 text-[18px] font-semibold text-slate-600">{transaction.description}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-[21px] font-extrabold text-red-700">
          - {formatCurrency(transaction.amount)}
        </p>
      </div>
    </article>
  );
}

function FeedRecord({ record }) {
  return (
    <article className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-yellow-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[19px] font-extrabold">{record.section} - {record.item_name}</p>
          <p className="mt-1 text-[17px] font-bold">
            {formatMarathiDate(record.date)} | {getAccountingPeriodLabel(record.accounting_period)}
          </p>
          {record.supplier_name ? (
            <p className="mt-1 text-[17px] font-bold text-yellow-800">{record.supplier_name}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-[20px] font-extrabold text-red-700">
          {formatCurrency(record.total_cost)}
        </p>
      </div>
    </article>
  );
}

export default function ExpenseAnalyticsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [financeReport, setFinanceReport] = useState(null);
  const [feedReport, setFeedReport] = useState(null);
  const [activeFilter, setActiveFilter] = useState("सर्व");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = `month=${monthValue.month}&year=${monthValue.year}`;
      const [finance, feed] = await Promise.all([
        fetchJson(`/api/reports/finance?${query}`),
        fetchJson(`/api/feed-expenses?${query}`, { unwrapData: false })
      ]);

      setFinanceReport(finance);
      setFeedReport(feed);
    } catch (fetchError) {
      setError(fetchError.message || "खर्च अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const monthlyExpenses = useMemo(
    () => (financeReport?.transactions || []).filter((transaction) => transaction.type === "खर्च"),
    [financeReport?.transactions]
  );
  const annualExpenses = financeReport?.annualTransactions || [];
  const allExpenses = [...monthlyExpenses, ...annualExpenses];
  const filteredExpenses = allExpenses.filter(
    (transaction) => activeFilter === "सर्व" || transactionCategory(transaction) === activeFilter
  );
  const feedSections = new Map((feedReport?.summary?.bySection || []).map((item) => [item.section, item.amount]));
  const monthlyTrend = (financeReport?.monthlyTrend || []).map((item) => ({
    label: item.label,
    amount: item.expense
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="💸 खर्च सविस्तर" subtitle="चारा, औषध, मजुरी आणि इतर खर्च" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="खर्च अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReports} /> : null}

      {!loading && !error && financeReport && feedReport ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              emoji="💸"
              title="मासिक खर्च"
              value={formatCurrency(financeReport.totalExpense || 0)}
              subtext="खाद्य + औषध + इतर"
              color="red"
            />
            <SummaryCard
              emoji="🌾"
              title="वार्षिक चारा"
              value={formatCurrency(financeReport.annualExpense || 0)}
              subtext="मुरघास + भुसा"
              color="yellow"
            />
            <SummaryCard
              emoji="🧾"
              title="एकूण व्यवहार"
              value={toMarathiNumerals(allExpenses.length)}
              subtext="मासिक + वार्षिक"
              color="slate"
            />
            <SummaryCard
              emoji="📊"
              title="चारा खर्च"
              value={formatCurrency((feedReport.summary?.allTotal || 0))}
              subtext="कॅटल फीड + मुरघास + भुसा"
              color="purple"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">खर्च प्रकार</h2>
            <div className="mt-4">
              <AmountBarChart
                data={buildExpenseChart([
                  ...(financeReport.expenseByCategory || []),
                  ...(financeReport.annualExpenseByCategory || []).map((item) => ({
                    ...item,
                    category: `${item.category} वार्षिक`
                  }))
                ])}
                positiveColor="#dc2626"
              />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">चारा विभाग</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {["कॅटल फीड", "मुरघास", "भुसा", "इतर"].map((section) => (
                <div key={section} className="rounded-lg bg-yellow-50 p-3 text-yellow-950">
                  <p className="text-[18px] font-extrabold">{section}</p>
                  <p className="mt-1 text-[22px] font-extrabold">
                    {formatCurrency(feedSections.get(section) || 0)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">मासिक तुलना</h2>
            <div className="mt-4">
              <AmountBarChart data={monthlyTrend} positiveColor="#dc2626" height={260} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">फिल्टर</h2>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`min-h-[52px] shrink-0 rounded-lg border-2 px-4 text-[18px] font-extrabold ${
                    activeFilter === filter
                      ? "border-red-300 bg-red-100 text-red-800"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">चारा खर्च इतिहास</h2>
            <div className="mt-4 space-y-3">
              {(feedReport.data || []).slice(0, 12).map((record) => (
                <FeedRecord key={record.id} record={record} />
              ))}
              {(feedReport.data || []).length === 0 ? (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                  चारा खर्च नोंदी नाहीत.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">सर्व खर्च व्यवहार</h2>
            <div className="mt-4 space-y-3">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((transaction) => (
                  <ExpenseTransaction
                    key={transaction.id}
                    transaction={transaction}
                    annual={transaction.accounting_period === "annual"}
                  />
                ))
              ) : (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                  या फिल्टरमध्ये खर्च नाही.
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
