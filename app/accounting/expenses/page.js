"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ExpenseCard from "@/components/accounting/ExpenseCard";
import MonthSelector from "@/components/accounting/MonthSelector";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { accountingExpenseCategories, expenseCategoryMeta } from "@/lib/accountingUtils";
import { fetchJson, fetchMonthlyExpenses } from "@/lib/offlineActions";
import { toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

function getInitialMonth() {
  return getIndiaMonthParts();
}

function groupExpenses(expenses) {
  return (expenses || []).reduce((groups, expense) => {
    groups[expense.category] = [...(groups[expense.category] || []), expense];
    return groups;
  }, {});
}

export default function AccountingExpensesPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchMonthlyExpenses(monthValue.month, monthValue.year);
      setData(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "खर्च माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  async function deleteExpense(expense) {
    if (!window.confirm("हा खर्च काढायचा का?")) {
      return;
    }

    try {
      await fetchJson(`/api/accounting/expenses/${expense.id}`, { method: "DELETE" });
      loadExpenses();
    } catch (deleteError) {
      setError(deleteError.message || "खर्च काढला नाही.");
    }
  }

  const grouped = useMemo(() => groupExpenses(data?.expenses || []), [data?.expenses]);
  const transportOther = Number(data?.byCategory?.["परिवहन"] || 0) + Number(data?.byCategory?.["इतर"] || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="💸 मासिक खर्च"
        subtitle="अंतिम खाद्य कपात 15 दिवसांच्या स्लिपवरून"
        action={
          <Link href="/accounting/expenses/new" className="flex min-h-[52px] items-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white active:bg-green-700">
            + नवीन
          </Link>
        }
      />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="खर्च लोड होत आहेत..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadExpenses} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard emoji="🌾" title="अंतिम खाद्य कपात" value={toMarathiCurrency(data?.byCategory?.["चारा"] || 0)} subtext="15 दिवसांची स्लिप" color="yellow" />
            <SummaryCard emoji="🥕" title="भूसा" value={toMarathiCurrency(data?.byCategory?.["भूसा"] || 0)} color="yellow" />
            <SummaryCard emoji="💊" title="औषध" value={toMarathiCurrency(data?.byCategory?.["औषध"] || 0)} color="purple" />
            <SummaryCard emoji="👷" title="मजुरी" value={toMarathiCurrency(data?.byCategory?.["मजुरी"] || 0)} color="slate" />
            <SummaryCard emoji="🚚" title="परिवहन + इतर" value={toMarathiCurrency(transportOther)} color="red" />
            <SummaryCard emoji="💸" title="एकूण खर्च" value={toMarathiCurrency(data?.monthlyTotal || 0)} subtext="सर्व वर्ग" color="red" />
          </section>

          {Number(data?.infoOnlyKhadyaTotal || 0) > 0 ? (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[18px] font-bold text-amber-900">
              नोंदीतील खाद्य: {toMarathiCurrency(data.infoOnlyKhadyaTotal)} फक्त माहितीसाठी ठेवले आहे.
              अंतिम खर्चात फक्त 15 दिवसांच्या स्लिपवरील कपात धरली आहे.
            </section>
          ) : null}

          {data?.expenses?.length > 0 ? (
            <section className="space-y-4">
              {accountingExpenseCategories
                .filter((category) => grouped[category]?.length)
                .map((category) => (
                  <section key={category} className="space-y-3">
                    <h2 className="text-[24px] font-extrabold text-slate-950">
                      {expenseCategoryMeta[category]?.emoji} {expenseCategoryMeta[category]?.label || category}
                      <span className="ml-2 text-[18px] text-slate-500">
                        {toMarathiNumerals(grouped[category].length)} नोंदी
                      </span>
                    </h2>
                    {grouped[category].map((expense) => (
                      <ExpenseCard key={expense.id} expense={expense} onDelete={deleteExpense} />
                    ))}
                  </section>
                ))}
            </section>
          ) : (
            <section className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-soft">
              <p className="text-[22px] font-extrabold text-slate-700">अजून खर्च नोंद नाही.</p>
              <Link href="/accounting/expenses/new" className="mt-4 inline-flex min-h-[56px] items-center rounded-lg bg-sheti px-5 text-[20px] font-extrabold text-white active:bg-green-700">
                + खर्च नोंद जोडा
              </Link>
            </section>
          )}
        </>
      ) : null}

      <Link href="/accounting/expenses/new" className="fixed bottom-24 right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-sheti text-[34px] font-extrabold text-white shadow-lg active:bg-green-700" aria-label="नवीन खर्च">
        +
      </Link>
    </div>
  );
}
