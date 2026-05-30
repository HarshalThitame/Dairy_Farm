"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import { displayFeedExpenseText } from "@/lib/feedExpenseSections";
import {
  formatCurrency,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";
import { displayFinanceCategory, getIndiaMonthParts } from "@/lib/reportUtils";

const AmountBarChart = dynamic(() => import("@/components/AmountBarChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg bg-slate-50 text-[18px] font-extrabold text-slate-600">
      चार्ट लोड होत आहे...
    </div>
  )
});

const expenseSectionOrder = ["खाद्य", "चारा", "औषध", "रेतन खर्च", "पशुवैद्यक", "मजुरी", "इतर"];

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

function topAmountItem(items) {
  return (items || []).reduce(
    (top, item) => (Number(item.amount || 0) > Number(top.amount || 0) ? item : top),
    { category: "", amount: 0 }
  );
}

function sumAmounts(items, amountField = "amount") {
  return (items || []).reduce((sum, item) => sum + Number(item[amountField] || 0), 0);
}

function CompactStat({ label, value, hint, tone = "slate" }) {
  const toneClass = {
    red: "border-red-100 bg-red-50 text-red-950",
    yellow: "border-yellow-100 bg-yellow-50 text-yellow-950",
    green: "border-green-100 bg-green-50 text-green-950",
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    slate: "border-slate-200 bg-slate-50 text-slate-950"
  };

  return (
    <article className={`rounded-lg border p-4 ${toneClass[tone] || toneClass.slate}`}>
      <p className="text-[17px] font-extrabold opacity-80">{label}</p>
      <p className="mt-2 text-[25px] font-extrabold leading-none">{value}</p>
      {hint ? <p className="mt-2 text-[16px] font-bold leading-snug opacity-75">{hint}</p> : null}
    </article>
  );
}

function BreakdownList({ title, items, total, emptyText }) {
  const maxAmount = Math.max(...(items || []).map((item) => Number(item.amount || 0)), 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-[17px] font-bold text-slate-600">
            एकूण {formatCurrency(total || 0)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {(items || []).length > 0 ? (
          items.map((item) => (
            <div key={item.category} className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[19px] font-extrabold text-slate-900">{item.category}</p>
                <p className="text-[19px] font-extrabold text-red-700">{formatCurrency(item.amount)}</p>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${Math.max(8, (Number(item.amount || 0) / maxAmount) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[18px] font-bold text-slate-600">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
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

function LedgerSection({
  number,
  title,
  total,
  entries,
  topItem,
  summaryText,
  includeText,
  excludeText,
  breakdownTitle,
  breakdownItems,
  breakdownEmptyText,
  sections,
  emptyText,
  tone = "red",
  children
}) {
  const toneClass = {
    red: "border-red-200 bg-red-50 text-red-950",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-950"
  };
  const amountClass = tone === "yellow" ? "text-yellow-900" : "text-red-800";
  const badgeClass = tone === "yellow" ? "bg-yellow-200 text-yellow-950" : "bg-red-200 text-red-950";

  return (
    <section className="space-y-4">
      <div className={`rounded-lg border p-4 ${toneClass[tone] || toneClass.red}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`inline-flex rounded-full px-3 py-1 text-[16px] font-extrabold ${badgeClass}`}>
              भाग {toMarathiNumerals(number)}
            </p>
            <h2 className="mt-3 text-[28px] font-extrabold leading-tight">{title}</h2>
            <p className="mt-2 text-[18px] font-bold leading-relaxed opacity-80">
              {summaryText}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[16px] font-extrabold opacity-75">एकूण</p>
            <p className={`mt-1 text-[27px] font-extrabold leading-none ${amountClass}`}>
              {formatCurrency(total || 0)}
            </p>
            <p className="mt-2 text-[16px] font-bold opacity-75">
              {toMarathiNumerals(entries)} नोंदी
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-[17px] font-extrabold">या भागात येते</p>
            <p className="mt-1 text-[17px] font-bold leading-relaxed opacity-80">{includeText}</p>
          </div>
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-[17px] font-extrabold">या भागात येत नाही</p>
            <p className="mt-1 text-[17px] font-bold leading-relaxed opacity-80">{excludeText}</p>
          </div>
        </div>

        {topItem?.amount > 0 ? (
          <p className="mt-4 rounded-lg bg-white/70 p-3 text-[18px] font-bold">
            सर्वात जास्त खर्च:{" "}
            <span className={amountClass}>
              {topItem.category} - {formatCurrency(topItem.amount)}
            </span>
          </p>
        ) : null}
      </div>

      <BreakdownList
        title={breakdownTitle}
        items={breakdownItems}
        total={total}
        emptyText={breakdownEmptyText}
      />

      {children}

      <div className="space-y-3">
        <h3 className="text-[24px] font-extrabold text-slate-950">सविस्तर नोंदी</h3>
        {sections.length > 0 ? (
          sections.map((section) => (
            <ExpenseCategorySection
              key={section.category}
              category={section.category}
              transactions={section.transactions}
              total={section.total}
            />
          ))
        ) : (
          <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}

export default function ExpenseAnalyticsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [financeReport, setFinanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = `month=${monthValue.month}&year=${monthValue.year}`;
      const finance = await fetchJson(`/api/reports/finance?${query}`);

      setFinanceReport(finance);
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
  const monthlyExpenseSections = buildExpenseSections(monthlyExpenses);
  const annualExpenseSections = buildExpenseSections(annualExpenses);
  const monthlyTrend = (financeReport?.monthlyTrend || []).map((item) => ({
    label: item.label,
    amount: item.expense
  }));
  const topMonthlyExpense = topAmountItem(financeReport?.expenseByCategory || []);
  const topAnnualExpense = topAmountItem(financeReport?.annualExpenseByCategory || []);

  return (
    <div className="space-y-6">
      <PageHeader title="💸 खर्च सविस्तर" subtitle="खाद्य, औषध, मजुरी आणि इतर खर्च" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="खर्च अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReports} /> : null}

      {!loading && !error && financeReport ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[25px] font-extrabold text-slate-950">
              खर्च दोन वेगळ्या भागात दाखवला आहे
            </h2>
            <p className="mt-2 text-[18px] font-bold leading-relaxed text-slate-600">
              मासिक खर्च आणि वार्षिक खर्च एकत्र केलेले नाहीत. त्यामुळे खाद्य, औषध,
              मजुरी हे महिन्यात दिसते आणि मुरघास/भुसा वर्षात वेगळे दिसते.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <CompactStat
                label="मासिक खर्च"
                value={formatCurrency(financeReport.totalExpense || 0)}
                hint="खाद्य + औषध + मजुरी + इतर"
                tone="red"
              />
              <CompactStat
                label="वार्षिक खर्च"
                value={formatCurrency(financeReport.annualExpense || 0)}
                hint="मुरघास + भुसा"
                tone="yellow"
              />
              <CompactStat
                label="मासिक नोंदी"
                value={toMarathiNumerals(monthlyExpenses.length)}
                hint="या महिन्यातील नोंदी"
                tone="slate"
              />
              <CompactStat
                label="वार्षिक नोंदी"
                value={toMarathiNumerals(annualExpenses.length)}
                hint={`${toMarathiNumerals(monthValue.year)} मधील नोंदी`}
                tone="slate"
              />
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[18px] font-bold leading-relaxed text-slate-700">
              <p>
                लक्षात ठेवा: <span className="text-red-700">मासिक खर्च</span> नफा मोजताना
                महिन्यात धरला जातो. <span className="text-yellow-800">वार्षिक खर्च</span>{" "}
                वेगळा दाखवला जातो, म्हणजे महिन्याचा खर्च चुकीने जास्त दिसत नाही.
              </p>
            </div>
          </section>

          <LedgerSection
            number={1}
            title="मासिक खर्च"
            total={financeReport.totalExpense || 0}
            entries={monthlyExpenses.length}
            topItem={topMonthlyExpense}
            summaryText="हा भाग फक्त निवडलेल्या महिन्याचा रोजचा/मासिक खर्च दाखवतो."
            includeText="खाद्य, औषध, मजुरी, वीज, वाहतूक, पशुवैद्यक आणि इतर रोजचे खर्च."
            excludeText="मुरघास आणि भुसा इथे धरलेले नाहीत."
            breakdownTitle="मासिक खर्च विभागवार"
            breakdownItems={financeReport.expenseByCategory || []}
            breakdownEmptyText="या महिन्यात मासिक खर्च नाही."
            sections={monthlyExpenseSections}
            emptyText="या महिन्यात मासिक खर्च नोंदी नाहीत."
            tone="red"
          >
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="text-[24px] font-extrabold text-slate-950">
                मागील ६ महिन्यांचा मासिक खर्च
              </h3>
              <p className="mt-1 text-[17px] font-bold text-slate-600">
                खर्च वाढतोय की कमी होतोय हे पाहण्यासाठी.
              </p>
              <div className="mt-4">
                <AmountBarChart data={monthlyTrend} positiveColor="#dc2626" height={240} />
              </div>
            </section>
          </LedgerSection>

          <LedgerSection
            number={2}
            title="वार्षिक खर्च"
            total={financeReport.annualExpense || 0}
            entries={annualExpenses.length}
            topItem={topAnnualExpense}
            summaryText={`${toMarathiNumerals(monthValue.year)} या वर्षातील मोठे आणि अनियमित चारा खर्च.`}
            includeText="मुरघास आणि भुसा यांसारखे मोठे पण अनियमित चारा खर्च."
            excludeText="खाद्य, औषध, मजुरी आणि इतर महिन्याचे खर्च इथे धरलेले नाहीत."
            breakdownTitle="वार्षिक खर्च विभागवार"
            breakdownItems={financeReport.annualExpenseByCategory || []}
            breakdownEmptyText="या वर्षात वार्षिक खर्च नाही."
            sections={annualExpenseSections}
            emptyText="या वर्षात वार्षिक खर्च नोंदी नाहीत."
            tone="yellow"
          />
        </>
      ) : null}
    </div>
  );
}
