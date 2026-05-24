"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { formatCurrency, formatLitres } from "@/lib/marathiUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

const reportLinks = [
  {
    href: "/ahval/dudh",
    title: "दूध उत्पादन अहवाल",
    emoji: "📊",
    color: "border-blue-200 bg-blue-50 text-blue-900"
  },
  {
    href: "/ahval/hishob",
    title: "हिशोब अहवाल",
    emoji: "💰",
    color: "border-green-200 bg-green-50 text-green-900"
  },
  {
    href: "/ahval/gaykamgiri",
    title: "गाय कामगिरी",
    emoji: "🐄",
    color: "border-purple-200 bg-purple-50 text-purple-900"
  },
  {
    href: "/ahval/lasiyadi",
    title: "लसीकरण यादी",
    emoji: "💉",
    color: "border-yellow-200 bg-yellow-50 text-yellow-900"
  },
  {
    href: "/ahval/chapa",
    title: "मासिक अहवाल छापा",
    emoji: "🖨️",
    color: "border-slate-200 bg-white text-slate-900"
  }
];

export default function AhvalPage() {
  const [monthValue, setMonthValue] = useState(getIndiaMonthParts());
  const [milkReport, setMilkReport] = useState(null);
  const [financeReport, setFinanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = `month=${monthValue.month}&year=${monthValue.year}`;
      const [milkResponse, financeResponse] = await Promise.all([
        fetch(`/api/reports/milk?${query}`, { cache: "no-store" }),
        fetch(`/api/reports/finance?${query}`, { cache: "no-store" })
      ]);
      const [milkResult, financeResult] = await Promise.all([
        milkResponse.json(),
        financeResponse.json()
      ]);

      if (!milkResponse.ok) {
        throw new Error(milkResult.error || "दूध अहवाल मिळाला नाही.");
      }

      if (!financeResponse.ok) {
        throw new Error(financeResult.error || "हिशोब अहवाल मिळाला नाही.");
      }

      setMilkReport(milkResult.data);
      setFinanceReport(financeResult.data);
    } catch (fetchError) {
      setError(fetchError.message || "अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const netProfit = financeReport?.netProfit || 0;
  const linkQuery = `?month=${monthValue.month}&year=${monthValue.year}`;

  return (
    <div className="space-y-6">
      <PageHeader title="📊 अहवाल" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReports} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-2 gap-3" aria-label="मासिक सारांश">
            <SummaryCard
              emoji="🥛"
              title="एकूण दूध उत्पादन"
              value={`${formatLitres(milkReport?.totalLitres || 0)} लिटर`}
              subtext={`दररोज सरासरी: ${formatLitres(milkReport?.dailyAverage || 0)} लिटर`}
              color="blue"
            />
            <SummaryCard
              emoji="💰"
              title="एकूण उत्पन्न"
              value={formatCurrency(financeReport?.totalIncome || 0)}
              subtext="दूध विक्री + इतर"
              color="green"
            />
            <SummaryCard
              emoji="💸"
              title="एकूण खर्च"
              value={formatCurrency(financeReport?.totalExpense || 0)}
              subtext="चारा + औषध + रेतन + इतर"
              color="red"
            />
            <SummaryCard
              emoji="📈"
              title="निव्वळ नफा"
              value={formatCurrency(netProfit)}
              subtext="या महिन्याचा नफा"
              color={netProfit >= 0 ? "green" : "red"}
            />
          </section>

          <section className="space-y-3">
            {reportLinks.map((item) => (
              <Link
                key={item.href}
                href={`${item.href}${linkQuery}`}
                className={`flex min-h-[64px] items-center justify-between rounded-lg border-2 p-4 text-[20px] font-extrabold shadow-soft active:scale-[0.99] ${item.color}`}
              >
                <span>
                  {item.emoji} {item.title}
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </section>
        </>
      ) : null}
    </div>
  );
}
