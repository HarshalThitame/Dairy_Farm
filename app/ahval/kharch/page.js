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
  displayFeedExpenseText,
  displayFeedSectionName,
  FEED_SECTION_CATTLE_FEED
} from "@/lib/feedExpenseSections";
import {
  formatCurrency,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";
import { displayFinanceCategory, getIndiaMonthParts } from "@/lib/reportUtils";

const expenseSectionOrder = ["खाद्य", "चारा", "औषध", "रेतन खर्च", "पशुवैद्यक", "मजुरी", "इतर"];
const filterOptions = ["सर्व", ...expenseSectionOrder];
const feedSectionOrder = [FEED_SECTION_CATTLE_FEED, "मुरघास", "भुसा", "इतर"];

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

function sumAmounts(items, amountField = "amount") {
  return (items || []).reduce((sum, item) => sum + Number(item[amountField] || 0), 0);
}

function buildExpenseSections(expenses) {
  const grouped = new Map();

  (expenses || []).forEach((transaction) => {
    const category = transactionCategory(transaction);
    grouped.set(category, [...(grouped.get(category) || []), transaction]);
  });

  const orderedSections = expenseSectionOrder.map((category) => ({
    category,
    transactions: grouped.get(category) || []
  }));
  const extraSections = Array.from(grouped.entries())
    .filter(([category]) => !expenseSectionOrder.includes(category))
    .map(([category, transactions]) => ({ category, transactions }));

  return [...orderedSections, ...extraSections]
    .map((section) => ({
      ...section,
      total: sumAmounts(section.transactions)
    }))
    .filter((section) => section.transactions.length > 0);
}

function ExpenseTransaction({ transaction, annual = false }) {
  const derivedLabel =
    transaction.source === "health_records"
      ? "आरोग्य नोंदीवरून आपोआप खर्च"
      : transaction.source === "milk_records"
        ? "दूध नोंदीवरून आपोआप मोजलेले"
        : transaction.source === "monthly_expenses"
          ? "मासिक खर्च नोंदीवरून आपोआप"
          : transaction.source === "dairy_settlements"
            ? "डेअरी देयक कपात"
            : "";

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
            <p className="mt-1 text-[18px] font-semibold text-slate-600">
              {displayFeedExpenseText(transaction.description)}
            </p>
          ) : null}
          {derivedLabel ? (
            <p className="mt-1 text-[17px] font-bold text-green-700">
              {derivedLabel}
            </p>
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
          <p className="text-[19px] font-extrabold">
            {displayFeedSectionName(record.section)} - {record.item_name}
          </p>
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

function ExpenseCategorySection({ category, transactions, total }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[23px] font-extrabold text-slate-950">
            {category} खर्च
          </h2>
          <p className="mt-1 text-[17px] font-bold text-slate-600">
            {toMarathiNumerals(transactions.length)} नोंदी
          </p>
        </div>
        <p className="shrink-0 text-[22px] font-extrabold text-red-700">
          {formatCurrency(total)}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {transactions.map((transaction) => (
          <ExpenseTransaction
            key={transaction.id}
            transaction={transaction}
            annual={transaction.accounting_period === "annual"}
          />
        ))}
      </div>
    </section>
  );
}

function FeedSectionDetails({ section, records }) {
  const total = sumAmounts(records, "total_cost");

  return (
    <section className="rounded-lg border border-yellow-100 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[23px] font-extrabold text-slate-950">
            {displayFeedSectionName(section)}
          </h2>
          <p className="mt-1 text-[17px] font-bold text-slate-600">
            {toMarathiNumerals(records.length)} चारा नोंदी
          </p>
        </div>
        <p className="shrink-0 text-[22px] font-extrabold text-red-700">
          {formatCurrency(total)}
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {records.map((record) => (
          <FeedRecord key={record.id} record={record} />
        ))}
      </div>
    </section>
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
  const expenseSections = buildExpenseSections(allExpenses);
  const feedSectionDetails = feedSectionOrder
    .map((section) => ({
      section,
      records: (feedReport?.data || []).filter((record) => record.section === section)
    }))
    .filter((section) => section.records.length > 0);
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
              subtext="खाद्य + औषध + कपात + इतर"
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
              subtext="खाद्य + मुरघास + भुसा"
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
              {feedSectionOrder.map((section) => (
                <div key={section} className="rounded-lg bg-yellow-50 p-3 text-yellow-950">
                  <p className="text-[18px] font-extrabold">{displayFeedSectionName(section)}</p>
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

          <section className="space-y-3">
            <div>
              <h2 className="text-[24px] font-extrabold text-slate-950">खर्च विभागवार नोंदी</h2>
              <p className="mt-1 text-[18px] font-bold text-slate-600">
                औषध, खाद्य, मजुरी आणि इतर प्रत्येक खर्च आपापल्या विभागात
              </p>
            </div>
            {expenseSections.length > 0 ? (
              expenseSections.map((section) => (
                <ExpenseCategorySection
                  key={section.category}
                  category={section.category}
                  transactions={section.transactions}
                  total={section.total}
                />
              ))
            ) : (
              <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                या महिन्यात खर्च नोंदी नाहीत.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-[24px] font-extrabold text-slate-950">चारा विभागवार नोंदी</h2>
              <p className="mt-1 text-[18px] font-bold text-slate-600">
                खाद्य, मुरघास, भुसा आणि इतर चारा खर्च
              </p>
            </div>
            {feedSectionDetails.length > 0 ? (
              feedSectionDetails.map((section) => (
                <FeedSectionDetails
                  key={section.section}
                  section={section.section}
                  records={section.records}
                />
              ))
            ) : (
              <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                चारा खर्च नोंदी नाहीत.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">चारा खर्च इतिहास</h2>
            <div className="mt-4 space-y-3">
              {(feedReport.data || []).map((record) => (
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
