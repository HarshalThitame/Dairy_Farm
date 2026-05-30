"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import DairySlipCard from "@/components/accounting/DairySlipCard";
import MonthSelector from "@/components/accounting/MonthSelector";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { summarizeDairySlips } from "@/lib/accountingUtils";
import { fetchDairySlips, fetchJson } from "@/lib/offlineActions";
import { formatLitres, formatMarathiDate, getTodayISODate, toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";
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

function getMonthPartsFromDate(dateString) {
  const [year, month] = String(dateString || "").split("-").map(Number);

  return {
    month: Number.isFinite(month) ? month : getInitialMonth().month,
    year: Number.isFinite(year) ? year : getInitialMonth().year
  };
}

export default function DairySlipsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [selectedDate, setSelectedDate] = useState("");
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

  function changeMonth(nextMonth) {
    setSelectedDate("");
    setMonthValue(nextMonth);
  }

  function applyDateFilter(date) {
    setSelectedDate(date);

    if (date) {
      setMonthValue(getMonthPartsFromDate(date));
    }
  }

  const allSlips = useMemo(() => data?.slips || [], [data?.slips]);
  const visibleSlips = useMemo(
    () => (selectedDate ? allSlips.filter((slip) => slip.slip_date === selectedDate) : allSlips),
    [allSlips, selectedDate]
  );
  const filteredSummary = useMemo(() => summarizeDairySlips(visibleSlips).monthlyTotal, [visibleSlips]);
  const monthly = selectedDate ? filteredSummary : data?.monthlyTotal || {};
  const averageRate = Number(monthly.averageRate || 0);
  const byDate = useMemo(() => groupByDate(visibleSlips), [visibleSlips]);
  const dates = Object.keys(byDate).sort((first, second) => second.localeCompare(first));
  const today = getTodayISODate();
  const addMilkHref = `/nondi/dudh?date=${selectedDate || "today"}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="🥛 दूध नोंद"
        subtitle="डेअरी स्लिपप्रमाणे सकाळ-संध्याकाळ नोंद"
        action={
          <Link
            href={addMilkHref}
            className="flex min-h-[52px] items-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white active:bg-green-700"
          >
            + नवीन
          </Link>
        }
      />
      <MonthSelector value={monthValue} onChange={changeMonth} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <label className="text-[18px] font-extrabold text-slate-800" htmlFor="dairy-slip-date-filter">
          तारीख फिल्टर
        </label>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            id="dairy-slip-date-filter"
            type="date"
            value={selectedDate}
            onChange={(event) => applyDateFilter(event.target.value)}
            className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-900 outline-none focus:border-sheti"
          />
          <button
            type="button"
            onClick={() => applyDateFilter(today)}
            className="min-h-[56px] rounded-lg border-2 border-green-200 bg-green-50 px-5 text-[19px] font-extrabold text-sheti active:bg-green-100"
          >
            आज
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate("")}
            className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-5 text-[19px] font-extrabold text-slate-700 active:bg-slate-100"
          >
            सर्व दाखवा
          </button>
        </div>
        {selectedDate ? (
          <p className="mt-3 rounded-lg bg-green-50 p-3 text-[20px] font-extrabold text-sheti">
            {formatMarathiDate(selectedDate)}
          </p>
        ) : null}
      </section>

      {loading ? <LoadingState text="दूध नोंदी लोड होत आहेत..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadSlips} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              emoji="📊"
              title={selectedDate ? "या तारखेचे दूध" : "या महिन्याचे एकूण दूध"}
              value={`${formatLitres(monthly.totalLiters || 0)} लिटर`}
              subtext={selectedDate ? "निवडलेली तारीख" : `${toMarathiNumerals(monthly.daysWithData || 0)} दिवसांचा डेटा`}
              color="blue"
            />
            <SummaryCard
              emoji="💰"
              title={selectedDate ? "या तारखेचे उत्पन्न" : "या महिन्याचा उत्पन्न"}
              value={toMarathiCurrency(monthly.totalAmount || 0)}
              subtext="दूध विक्रीतून"
              color="green"
            />
            <SummaryCard
              emoji="📈"
              title="सरासरी दर"
              value={`${toMarathiCurrency(averageRate)}/लि.`}
              subtext={selectedDate ? "या तारखेचा" : "या महिन्याचा"}
              color="yellow"
            />
            <SummaryCard
              emoji="✅"
              title={selectedDate ? "नोंदी" : "नोंदवलेले दिवस"}
              value={
                selectedDate
                  ? `${toMarathiNumerals(monthly.sessionCount || 0)} नोंदी`
                  : `${toMarathiNumerals(monthly.daysWithData || 0)} दिवस`
              }
              subtext="सकाळ + संध्याकाळ"
              color="purple"
            />
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
              <p className="text-[22px] font-extrabold text-slate-700">
                {selectedDate ? "📭 या तारखेला दूध नोंद नाही" : "📭 या महिन्यात दूध नोंद नाही"}
              </p>
              <Link
                href={addMilkHref}
                className="mt-4 inline-flex min-h-[56px] items-center rounded-lg bg-sheti px-5 text-[20px] font-extrabold text-white active:bg-green-700"
              >
                + दूध नोंद जोडा
              </Link>
            </section>
          )}
        </>
      ) : null}

      <Link
        href={addMilkHref}
        className="fixed bottom-24 right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-sheti text-[34px] font-extrabold text-white shadow-lg active:bg-green-700"
        aria-label="नवीन दूध नोंद"
      >
        +
      </Link>
    </div>
  );
}
