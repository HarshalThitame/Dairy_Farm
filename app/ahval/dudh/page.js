"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getIndiaMonthParts } from "@/lib/reportUtils";

const MilkBarChart = dynamic(() => import("@/components/MilkBarChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] items-center justify-center rounded-lg bg-slate-50 text-[18px] font-extrabold text-slate-600">
      चार्ट लोड होत आहे...
    </div>
  )
});

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

function formatRate(value) {
  const numberValue = Number(value || 0);
  const rounded = Number.isInteger(numberValue) ? numberValue : Number(numberValue.toFixed(2));
  return `₹ ${toMarathiNumerals(rounded)}`;
}

function formatReading(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "नोंद नाही";
  }

  return `${toMarathiNumerals(value)}${suffix}`;
}

function withinDateRange(record, fromDate, toDate) {
  return (!fromDate || record.date >= fromDate) && (!toDate || record.date <= toDate);
}

function ReadingTile({ label, value, tone = "bg-slate-50 text-slate-900", suffix = "" }) {
  return (
    <div className={`rounded-lg p-3 ${tone}`}>
      <p className="text-[17px] font-extrabold opacity-80">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold">{formatReading(value, suffix)}</p>
    </div>
  );
}

function DailyMilkCard({ record }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[21px] font-extrabold text-slate-950">
            {formatMarathiDate(record.date)}
          </p>
          <p className="mt-1 text-[18px] font-bold text-slate-600">
            दर: {formatRate(record.averageRate || 0)} / लि.
          </p>
        </div>
        <p className="shrink-0 text-[22px] font-extrabold text-blue-700">
          {formatLitres(record.total)} लि.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-900">
          <p className="text-[17px] font-extrabold">सकाळ</p>
          <p className="mt-1 text-[20px] font-extrabold">{formatLitres(record.morning)} लि.</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-3 text-indigo-900">
          <p className="text-[17px] font-extrabold">संध्याकाळ</p>
          <p className="mt-1 text-[20px] font-extrabold">{formatLitres(record.evening)} लि.</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-green-900">
          <p className="text-[17px] font-extrabold">रक्कम</p>
          <p className="mt-1 text-[20px] font-extrabold">{formatCurrency(record.amount)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-slate-800">
          <p className="text-[17px] font-extrabold">फॅट / SNF</p>
          <p className="mt-1 text-[18px] font-extrabold">
            {formatReading(record.morningFat ?? record.eveningFat, "%")} / {formatReading(record.morningSnf ?? record.eveningSnf)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function MilkReportPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [report, setReport] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJson(
        `/api/reports/milk?month=${monthValue.month}&year=${monthValue.year}`
      );

      setReport(result);
    } catch (fetchError) {
      setError(fetchError.message || "दूध अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredRecords = useMemo(
    () => (report?.dailyRecords || []).filter((record) => withinDateRange(record, fromDate, toDate)),
    [fromDate, report?.dailyRecords, toDate]
  );
  const filteredDailyData = useMemo(
    () => (report?.dailyData || []).filter((record) => withinDateRange(record, fromDate, toDate)),
    [fromDate, report?.dailyData, toDate]
  );
  const quality = report?.qualitySummary || {};
  const session = report?.sessionSummary || {};
  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredTotal = hasDateFilter
    ? filteredRecords.reduce((sum, record) => sum + Number(record.total || 0), 0)
    : Number(session.totalLitres || report?.totalLitres || 0);
  const filteredRevenue = hasDateFilter
    ? filteredRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0)
    : Number(session.totalAmount || 0);
  const settlementSessionAudits = report?.settlementSessionAudits || [];
  const missingRows = settlementSessionAudits.flatMap((audit) => [
    ...(audit.missingMorning || []),
    ...(audit.missingEvening || [])
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="🥛 दूध सविस्तर अहवाल" subtitle="दैनिक दूध, गुणवत्ता, दर आणि उत्पन्न" />
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
              subtext={session.source === "settlement_printed_totals" ? "सेटलमेंट स्लिपवरील final total" : "या महिन्यात"}
              color="blue"
            />
            <SummaryCard
              emoji="💰"
              title="दूध उत्पन्न"
              value={formatCurrency(session.totalAmount || 0)}
              subtext={`सरासरी दर ${formatRate(session.averageRate || 0)}`}
              color="green"
            />
            <SummaryCard
              emoji="📅"
              title="दररोज सरासरी"
              value={`${formatLitres(report.dailyAverage)} लिटर`}
              subtext={`${toMarathiNumerals(session.daysWithMilk || 0)} दिवस नोंद`}
              color="blue"
            />
            <SummaryCard
              emoji="⬆️"
              title="सर्वाधिक दूध"
              value={`${formatLitres(report.bestDay?.litres || 0)} लिटर`}
              subtext={formatMarathiDate(report.bestDay?.date)}
              color="green"
            />
          </section>

          {session.source === "settlement_printed_totals" ? (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-soft">
              <h2 className="text-[22px] font-extrabold text-amber-950">दूध total कुठून घेतले?</h2>
              <p className="mt-1 text-[17px] font-bold text-amber-900">
                या अहवालातील एकूण दूध सेटलमेंट स्लिपवरील छापील सकाळ + संध्याकाळ total वरून घेतले आहे.
              </p>
              {Number(report.rowTotalLitres || 0) !== Number(report.totalLitres || 0) ? (
                <p className="mt-3 rounded-lg bg-white p-3 text-[16px] font-extrabold text-amber-950">
                  Daily rows बेरीज: {formatLitres(report.rowTotalLitres || 0)} लि. | Final settlement total: {formatLitres(report.totalLitres || 0)} लि.
                </p>
              ) : null}
              {missingRows.length > 0 ? (
                <div className="mt-3 space-y-1 text-[15px] font-bold text-amber-900">
                  <p className="font-extrabold">Missing daily rows:</p>
                  {missingRows.slice(0, 8).map((item) => (
                    <p key={`${item.date}-${item.session}`}>
                      {formatMarathiDate(item.date)} {item.session}: {item.reason} {item.finalSource}
                    </p>
                  ))}
                  {missingRows.length > 8 ? (
                    <p>आणखी {toMarathiNumerals(missingRows.length - 8)} missing rows आहेत.</p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">तारीख फिल्टर</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-[18px] font-extrabold text-slate-800">पासून</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-3 text-[18px] font-bold"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[18px] font-extrabold text-slate-800">पर्यंत</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-3 text-[18px] font-bold"
                />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-900">
                <p className="text-[17px] font-extrabold">फिल्टर दूध</p>
                <p className="mt-1 text-[22px] font-extrabold">{formatLitres(filteredTotal)} लि.</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-green-900">
                <p className="text-[17px] font-extrabold">फिल्टर रक्कम</p>
                <p className="mt-1 text-[22px] font-extrabold">{formatCurrency(filteredRevenue)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">सकाळ / संध्याकाळ एकूण</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ReadingTile label="सकाळ दूध" value={formatLitres(session.morningLitres || 0)} suffix=" लि." tone="bg-blue-50 text-blue-900" />
              <ReadingTile label="संध्याकाळ दूध" value={formatLitres(session.eveningLitres || 0)} suffix=" लि." tone="bg-indigo-50 text-indigo-900" />
              {session.source === "settlement_printed_totals" ? (
                <div className="col-span-2 rounded-lg bg-green-50 p-3 text-green-900">
                  <p className="text-[17px] font-extrabold opacity-80">दूध रक्कम</p>
                  <p className="mt-1 text-[22px] font-extrabold">{formatCurrency(session.totalAmount || 0)}</p>
                  <p className="mt-1 text-[15px] font-bold">
                    सेटलमेंटमध्ये सकाळ/संध्याकाळ रक्कम वेगळी नसल्यामुळे total दूध उत्पन्न दाखवले आहे.
                  </p>
                </div>
              ) : (
                <>
                  <ReadingTile label="सकाळ रक्कम" value={formatCurrency(session.morningAmount || 0)} tone="bg-green-50 text-green-900" />
                  <ReadingTile label="संध्याकाळ रक्कम" value={formatCurrency(session.eveningAmount || 0)} tone="bg-green-50 text-green-900" />
                </>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">फॅट, SNF आणि डिग्री</h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <ReadingTile label="सरासरी फॅट" value={quality.averageFat} suffix="%" tone="bg-yellow-50 text-yellow-900" />
              <ReadingTile label="सरासरी SNF" value={quality.averageSnf} tone="bg-purple-50 text-purple-900" />
              <ReadingTile label="सरासरी डिग्री" value={quality.averageDegree} tone="bg-slate-50 text-slate-900" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ReadingTile label="सकाळ फॅट" value={quality.morningFat} suffix="%" tone="bg-yellow-50 text-yellow-900" />
              <ReadingTile label="संध्याकाळ फॅट" value={quality.eveningFat} suffix="%" tone="bg-yellow-50 text-yellow-900" />
              <ReadingTile label="सकाळ SNF" value={quality.morningSnf} tone="bg-purple-50 text-purple-900" />
              <ReadingTile label="संध्याकाळ SNF" value={quality.eveningSnf} tone="bg-purple-50 text-purple-900" />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">रोजचे दूध चार्ट</h2>
            <div className="mt-4">
              <MilkBarChart data={filteredDailyData} height={280} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">गायनिहाय उत्पादन</h2>
            <p className="mt-3 rounded-lg bg-slate-50 p-4 text-[19px] font-bold leading-relaxed text-slate-700">
              सध्याची दूध नोंद सर्व गायींची एकत्रित आहे. त्यामुळे गायनिहाय दूध उत्पादन वेगळे दाखवता येत नाही.
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">रोजची दूध नोंद</h2>
            <div className="mt-4 space-y-3">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => <DailyMilkCard key={record.id || record.date} record={record} />)
              ) : (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
                  या तारखांसाठी दूध नोंद नाही.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">मागील सहा महिन्यांची तुलना</h2>
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
