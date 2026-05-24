"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MilkBarChart from "@/components/MilkBarChart";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import SummaryCard from "@/components/SummaryCard";
import {
  formatLitres,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

function getInitialMonth() {
  const current = getIndiaMonthParts();

  if (typeof window === "undefined") {
    return current;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const month = Number(searchParams.get("month") || current.month);
  const year = Number(searchParams.get("year") || current.year);

  return { month, year };
}

function rankEmoji(index) {
  if (index === 0) {
    return "🥇";
  }

  if (index === 1) {
    return "🥈";
  }

  if (index === 2) {
    return "🥉";
  }

  return toMarathiNumerals(index + 1);
}

export default function MilkReportPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/reports/milk?month=${monthValue.month}&year=${monthValue.year}`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "दूध अहवाल मिळाला नाही.");
      }

      setReport(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="space-y-6">
      <PageHeader title="📊 दूध उत्पादन अहवाल" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="दूध अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReport} /> : null}

      {!loading && !error && report ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              emoji="🥛"
              title="एकूण दूध"
              value={`${formatLitres(report.totalLitres)} लिटर`}
              subtext="या महिन्यात"
              color="blue"
            />
            <SummaryCard
              emoji="📅"
              title="दररोज सरासरी"
              value={`${formatLitres(report.dailyAverage)} लिटर`}
              subtext="मासिक सरासरी"
              color="blue"
            />
            <SummaryCard
              emoji="⬆️"
              title="सर्वाधिक दूध"
              value={`${formatLitres(report.bestDay?.litres || 0)} लिटर`}
              subtext={formatMarathiDate(report.bestDay?.date)}
              color="green"
            />
            <SummaryCard
              emoji="⬇️"
              title="सर्वात कमी दूध"
              value={`${formatLitres(report.worstDay?.litres || 0)} लिटर`}
              subtext={formatMarathiDate(report.worstDay?.date)}
              color="yellow"
            />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">
              रोजचे दूध चार्ट
            </h2>
            <div className="mt-4">
              <MilkBarChart data={report.dailyData || []} height={280} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">
              गायीप्रमाणे दूध
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse text-[18px]">
                <thead>
                  <tr className="bg-blue-50 text-left text-blue-950">
                    <th className="border border-blue-100 p-3">क्रम</th>
                    <th className="border border-blue-100 p-3">गायीचे नाव</th>
                    <th className="border border-blue-100 p-3">एकूण लिटर</th>
                    <th className="border border-blue-100 p-3">सरासरी/दिवस</th>
                    <th className="border border-blue-100 p-3">सर्वाधिक</th>
                    <th className="border border-blue-100 p-3">स्थिती</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.perCow || []).map((cow, index) => (
                    <tr
                      key={cow.cow_id}
                      className={cow.total > 0 ? "bg-white" : "bg-slate-50 text-slate-500"}
                    >
                      <td className="border border-slate-200 p-3 font-extrabold">
                        {rankEmoji(index)}
                      </td>
                      <td className="border border-slate-200 p-3">
                        <Link
                          href={`/gayi/${cow.cow_id}`}
                          className="font-extrabold text-sheti"
                        >
                          {cow.name}
                        </Link>
                      </td>
                      <td className="border border-slate-200 p-3 font-bold">
                        {formatLitres(cow.total)} लिटर
                      </td>
                      <td className="border border-slate-200 p-3 font-bold">
                        {formatLitres(cow.average)} लिटर
                      </td>
                      <td className="border border-slate-200 p-3 font-bold">
                        {formatLitres(cow.best)} लिटर
                      </td>
                      <td className="border border-slate-200 p-3">
                        <StatusBadge status={cow.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">
              मागील सहा महिन्यांची तुलना
            </h2>
            <div className="mt-4">
              <MilkBarChart
                data={(report.monthlyTrend || []).map((item) => ({
                  day: item.label,
                  litres: item.total
                }))}
                height={260}
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
