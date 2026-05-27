"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DairySlipCard from "@/components/accounting/DairySlipCard";
import MonthSelector from "@/components/accounting/MonthSelector";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { fetchDairySlips, fetchJson } from "@/lib/offlineActions";
import { formatLitres, formatMarathiDate, toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";
import { getMarathiDayName } from "@/lib/reminderUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

function getInitialMonth() {
  return getIndiaMonthParts();
}

function groupByDate(slips) {
  return (slips || []).reduce((groups, slip) => {
    groups[slip.slip_date] = [...(groups[slip.slip_date] || []), slip];
    return groups;
  }, {});
}

export default function DairySlipsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSlips = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchDairySlips(monthValue.month, monthValue.year);
      setData(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "दूध नोंदी मिळाल्या नाहीत.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    loadSlips();
  }, [loadSlips]);

  async function deleteSlip(slip) {
    const confirmed = window.confirm("ही दूध नोंद काढायची का?");

    if (!confirmed) {
      return;
    }

    try {
      await fetchJson(`/api/accounting/dairy-slips/${slip.id}`, { method: "DELETE" });
      loadSlips();
    } catch (deleteError) {
      setError(deleteError.message || "नोंद काढली नाही.");
    }
  }

  const monthly = data?.monthlyTotal || {};
  const averageRate = Number(monthly.averageRate || 0);
  const byDate = useMemo(() => groupByDate(data?.slips || []), [data?.slips]);
  const dates = Object.keys(byDate).sort((first, second) => second.localeCompare(first));

  return (
    <div className="space-y-6">
      <PageHeader
        title="🥛 दूध नोंद"
        subtitle="डेअरी स्लिपप्रमाणे सकाळ-संध्याकाळ नोंद"
        action={
          <Link
            href="/nondi/dudh?date=today"
            className="flex min-h-[52px] items-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white active:bg-green-700"
          >
            + नवीन
          </Link>
        }
      />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="दूध नोंदी लोड होत आहेत..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadSlips} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard emoji="📊" title="या महिन्याचे एकूण दूध" value={`${formatLitres(monthly.totalLiters || 0)} लिटर`} subtext={`${toMarathiNumerals(monthly.daysWithData || 0)} दिवसांचा डेटा`} color="blue" />
            <SummaryCard emoji="💰" title="या महिन्याचा उत्पन्न" value={toMarathiCurrency(monthly.totalAmount || 0)} subtext="दूध विक्रीतून" color="green" />
            <SummaryCard emoji="📈" title="सरासरी दर" value={`${toMarathiCurrency(averageRate)}/लि.`} subtext="या महिन्याचा" color="yellow" />
            <SummaryCard emoji="✅" title="नोंदवलेले दिवस" value={`${toMarathiNumerals(monthly.daysWithData || 0)} दिवस`} subtext="सकाळ + संध्याकाळ" color="purple" />
          </section>

          {dates.length > 0 ? (
            <section className="space-y-4">
              {dates.map((date) => (
                <div key={date} className="space-y-3">
                  <h2 className="text-[23px] font-extrabold text-slate-950">
                    {getMarathiDayName(date)}, {formatMarathiDate(date)}
                  </h2>
                  <div className="grid gap-3">
                    {byDate[date].map((slip) => (
                      <DairySlipCard key={slip.id} slip={slip} onDelete={deleteSlip} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : (
            <section className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-soft">
              <p className="text-[22px] font-extrabold text-slate-700">📭 या महिन्यात दूध नोंद नाही</p>
              <Link
                href="/nondi/dudh?date=today"
                className="mt-4 inline-flex min-h-[56px] items-center rounded-lg bg-sheti px-5 text-[20px] font-extrabold text-white active:bg-green-700"
              >
                + दूध नोंद जोडा
              </Link>
            </section>
          )}
        </>
      ) : null}

      <Link
        href="/nondi/dudh?date=today"
        className="fixed bottom-24 right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-sheti text-[34px] font-extrabold text-white shadow-lg active:bg-green-700"
        aria-label="नवीन दूध नोंद"
      >
        +
      </Link>
    </div>
  );
}
