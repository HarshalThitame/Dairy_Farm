"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";
import { fetchJson } from "@/lib/offlineActions";
import { formatCurrency, formatLitres, toMarathiNumerals } from "@/lib/marathiUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

function getInitialYear() {
  const currentYear = getIndiaMonthParts().year;

  if (typeof window === "undefined") {
    return currentYear;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return Number(searchParams.get("year") || currentYear);
}

function displayValue(value, convertDigits = false) {
  const text = String(value || "").trim();

  if (!text) {
    return "माहिती नाही";
  }

  return convertDigits ? toMarathiNumerals(text) : text;
}

function moneyClass(value) {
  return Number(value || 0) >= 0 ? "text-green-800" : "text-red-800";
}

function YearSelector({ value, onChange }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Number(value) - 1)}
          className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[18px] font-extrabold text-slate-700 active:bg-slate-100"
        >
          ◀ मागील
        </button>
        <div className="rounded-lg bg-green-100 px-3 py-3 text-center text-[22px] font-extrabold text-sheti">
          📅 {toMarathiNumerals(value)}
        </div>
        <button
          type="button"
          onClick={() => onChange(Number(value) + 1)}
          className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[18px] font-extrabold text-slate-700 active:bg-slate-100"
        >
          पुढील ▶
        </button>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(Number(event.target.value || value))}
          className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-900 outline-none focus:border-sheti"
          aria-label="वर्ष निवडा"
        />
        <button
          type="button"
          onClick={() => onChange(getIndiaMonthParts().year)}
          className="min-h-[56px] rounded-lg bg-slate-100 px-4 text-[18px] font-extrabold text-slate-800 active:bg-slate-200"
        >
          चालू वर्ष
        </button>
      </div>
    </section>
  );
}

function InfoTable({ rows }) {
  return (
    <table className="w-full border-collapse text-[17px]">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th className="w-1/2 border border-slate-300 p-2 text-left font-extrabold text-slate-800 print:border-slate-900">
              {label}
            </th>
            <td className="border border-slate-300 p-2 font-bold text-slate-950 print:border-slate-900">
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AmountList({ title, items, emptyText = "नोंदी नाहीत." }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft print:break-inside-avoid print:border-slate-900 print:shadow-none">
      <h2 className="text-[23px] font-extrabold text-slate-950">{title}</h2>
      <div className="mt-3 space-y-2">
        {(items || []).length > 0 ? (
          items.map((item) => (
            <div
              key={item.category || item.status}
              className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-[18px] font-bold text-slate-800 print:border print:border-slate-300 print:bg-white"
            >
              <span>{item.category || item.status}</span>
              <span>{item.amount !== undefined ? formatCurrency(item.amount) : toMarathiNumerals(item.count)}</span>
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

function MonthTable({ rows }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft print:break-inside-avoid print:border-slate-900 print:shadow-none">
      <h2 className="text-[23px] font-extrabold text-slate-950">महिन्याप्रमाणे सविस्तर माहिती</h2>
      <p className="mt-1 text-[17px] font-bold text-slate-600">
        प्रत्येक महिन्याचे दूध, उत्पन्न, खर्च आणि नफा एकाच ठिकाणी.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-[15px] print:min-w-0 print:text-[11px]">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-300 p-2 print:border-slate-900">महिना</th>
              <th className="border border-slate-300 p-2 print:border-slate-900">दूध</th>
              <th className="border border-slate-300 p-2 print:border-slate-900">उत्पन्न</th>
              <th className="border border-slate-300 p-2 print:border-slate-900">मासिक खर्च</th>
              <th className="border border-slate-300 p-2 print:border-slate-900">वार्षिक खर्च</th>
              <th className="border border-slate-300 p-2 print:border-slate-900">इतर कपात</th>
              <th className="border border-slate-300 p-2 print:border-slate-900">नफा/तोटा</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="border border-slate-300 p-2 font-extrabold print:border-slate-900">
                  {row.label}
                </td>
                <td className="border border-slate-300 p-2 print:border-slate-900">
                  {formatLitres(row.milkLitres)} लि.
                </td>
                <td className="border border-slate-300 p-2 print:border-slate-900">
                  {formatCurrency(row.totalIncome)}
                </td>
                <td className="border border-slate-300 p-2 print:border-slate-900">
                  {formatCurrency(row.monthlyExpense)}
                </td>
                <td className="border border-slate-300 p-2 print:border-slate-900">
                  {formatCurrency(row.annualExpense)}
                </td>
                <td className="border border-slate-300 p-2 print:border-slate-900">
                  {formatCurrency(row.otherDeductions)}
                </td>
                <td className={`border border-slate-300 p-2 font-extrabold print:border-slate-900 ${moneyClass(row.netProfit)}`}>
                  {formatCurrency(row.netProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportHeader({ data }) {
  const farm = data.farm || {};

  return (
    <header className="rounded-lg border-2 border-slate-900 bg-white p-4 text-slate-950 print:rounded-none">
      <div className="text-center">
        <h1 className="text-[30px] font-extrabold">🐄 {APP_NAME}</h1>
        <p className="mt-1 text-[18px] font-bold">{APP_TAGLINE}</p>
        <p className="mt-2 text-[24px] font-extrabold">
          वार्षिक अहवाल - {toMarathiNumerals(data.year)}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 print:grid-cols-2">
        <InfoTable
          rows={[
            ["नाव", displayValue(farm.ownerName)],
            ["मोबाइल नंबर", displayValue(farm.ownerMobile, true)],
            ["डेअरीचे नाव", displayValue(farm.farmName)]
          ]}
        />
        <InfoTable
          rows={[
            ["दूध संकलन केंद्र", displayValue(farm.dairyName)],
            ["डेअरी सदस्य नंबर", displayValue(farm.dairyMemberNumber, true)],
            ["गाव", displayValue(farm.villageName)]
          ]}
        />
      </div>
    </header>
  );
}

function FarmerResult({ summary }) {
  const totalExpense = Number(summary.totalExpenseForYear || 0);
  const result = Number(summary.netProfit || 0);

  return (
    <section
      className={`rounded-lg border-2 p-4 print:break-inside-avoid ${
        result >= 0
          ? "border-green-200 bg-green-50 text-green-950"
          : "border-red-200 bg-red-50 text-red-950"
      }`}
    >
      <h2 className="text-[24px] font-extrabold">या वर्षाचा सोपा निकाल</h2>
      <p className="mt-3 text-[20px] font-bold leading-relaxed">
        या वर्षी दूध आणि इतर उत्पन्न {formatCurrency(summary.totalIncome)} झाले. फार्मचा एकूण खर्च {formatCurrency(totalExpense)}
        {summary.dairyFeedDeduction > 0 ? `, डेअरी खाद्य कपात ${formatCurrency(summary.dairyFeedDeduction)}` : ""}
        {summary.otherDeductions > 0 ? ` आणि इतर देयक कपात ${formatCurrency(summary.otherDeductions)}` : ""} धरल्यानंतर
        {result >= 0 ? " नफा " : " तोटा "}
        <span className="font-extrabold">{formatCurrency(Math.abs(result))}</span> आहे.
      </p>
    </section>
  );
}

export default function AnnualReportPage() {
  const [year, setYear] = useState(getInitialYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!Number.isInteger(Number(year)) || Number(year) < 2000) {
      setError("योग्य वर्ष निवडा.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await fetchJson(`/api/reports/annual?year=${year}`);
      setData(result);
    } catch (fetchError) {
      setError(fetchError.message || "वार्षिक अहवाल मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const summary = data?.summary || {};
  const topMonths = data?.topMonths || {};
  const statusItems = useMemo(
    () => (data?.cowSummary?.byStatus || []).map((item) => ({ status: item.status, count: item.count })),
    [data?.cowSummary?.byStatus]
  );

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          nav,
          footer,
          .no-print {
            display: none !important;
          }

          main {
            max-width: none !important;
            padding: 0 !important;
          }

          .safe-bottom {
            padding-bottom: 0 !important;
          }

          .annual-print-page {
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="no-print space-y-6">
        <PageHeader title="📘 वार्षिक अहवाल" subtitle="वर्षभराचे दूध, खर्च, नफा आणि गायींची माहिती" />
        <YearSelector value={year} onChange={setYear} />
        <button
          type="button"
          onClick={() => window.print()}
          disabled={!data || loading}
          className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft active:bg-green-700 disabled:bg-slate-400"
        >
          🖨️ वार्षिक अहवाल छापा
        </button>
      </div>

      {loading ? <LoadingState text="वार्षिक अहवाल लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadReport} /> : null}

      {!loading && !error && data ? (
        <article className="annual-print-page space-y-6 rounded-lg bg-white p-0 print:space-y-4">
          <ReportHeader data={data} />
          <FarmerResult summary={summary} />

          <section className="grid grid-cols-2 gap-3 print:grid-cols-4">
            <SummaryCard
              emoji="🥛"
              title="एकूण दूध"
              value={`${formatLitres(summary.totalMilkLitres)} लि.`}
              subtext={`सरासरी ${formatLitres(summary.averageMilkPerDay)} लि./दिवस`}
              color="blue"
            />
            <SummaryCard
              emoji="💰"
              title="एकूण उत्पन्न"
              value={formatCurrency(summary.totalIncome)}
              subtext="दूध + इतर उत्पन्न"
              color="green"
            />
            <SummaryCard
              emoji="💸"
              title="एकूण खर्च"
              value={formatCurrency(summary.totalExpenseForYear)}
              subtext="मासिक + वार्षिक"
              color="red"
            />
            <SummaryCard
              emoji={Number(summary.netProfit || 0) >= 0 ? "📈" : "📉"}
              title={Number(summary.netProfit || 0) >= 0 ? "शुद्ध नफा" : "तोटा"}
              value={formatCurrency(Math.abs(summary.netProfit || 0))}
              subtext="इतर कपात धरून"
              color={Number(summary.netProfit || 0) >= 0 ? "green" : "red"}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft print:break-inside-avoid print:border-slate-900 print:shadow-none">
              <h2 className="text-[23px] font-extrabold text-slate-950">दूध तपशील</h2>
              <InfoTable
                rows={[
                  ["सकाळचे दूध", `${formatLitres(summary.morningLitres)} लि.`],
                  ["संध्याकाळचे दूध", `${formatLitres(summary.eveningLitres)} लि.`],
                  ["दूध नोंदवलेले दिवस", `${toMarathiNumerals(summary.milkDays || 0)} दिवस`],
                  ["सर्वाधिक दूध महिना", topMonths.bestMilkMonth ? `${topMonths.bestMilkMonth.label} - ${formatLitres(topMonths.bestMilkMonth.milkLitres)} लि.` : "माहिती नाही"],
                  ["कमी दूध महिना", topMonths.lowestMilkMonth ? `${topMonths.lowestMilkMonth.label} - ${formatLitres(topMonths.lowestMilkMonth.milkLitres)} लि.` : "माहिती नाही"]
                ]}
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft print:break-inside-avoid print:border-slate-900 print:shadow-none">
              <h2 className="text-[23px] font-extrabold text-slate-950">गायी आणि आरोग्य</h2>
              <InfoTable
                rows={[
                  ["सध्या सक्रिय गायी", `${toMarathiNumerals(summary.activeCowCount || 0)}`],
                  ["कृत्रिम रेतन", `${toMarathiNumerals(summary.aiCount || 0)} वेळा`],
                  ["व्यायण/ब्यायली", `${toMarathiNumerals(summary.calvingCount || 0)} वेळा`],
                  ["जन्मलेली वासरे", `${toMarathiNumerals(summary.calfCount || 0)}`],
                  ["आरोग्य नोंदी", `${toMarathiNumerals(summary.healthRecordCount || 0)} नोंदी`],
                  ["आरोग्य खर्च", formatCurrency(summary.healthCost || 0)]
                ]}
              />
            </section>
          </section>

          <section className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <AmountList title="उत्पन्न विभाग" items={data.summary.incomeByCategory || []} />
            <AmountList title="मासिक खर्च विभाग" items={data.summary.monthlyExpenseByCategory || []} />
            <AmountList title="वार्षिक खर्च विभाग" items={data.summary.annualExpenseByCategory || []} />
          </section>

          <section className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <AmountList title="चारा विभाग" items={data.feedSummary?.bySection || []} />
            <AmountList title="गायींची स्थिती" items={statusItems} />
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft print:break-inside-avoid print:border-slate-900 print:shadow-none">
              <h2 className="text-[23px] font-extrabold text-slate-950">देयक कपात</h2>
              <InfoTable
                rows={[
                  ["खाद्य कपात", formatCurrency(summary.dairyFeedDeduction || 0)],
                  ["इतर कपात", formatCurrency(summary.otherDeductions || 0)],
                  ["नफ्यात धरलेली कपात", formatCurrency(summary.otherDeductions || 0)]
                ]}
              />
            </section>
          </section>

          <MonthTable rows={data.monthRows || []} />
        </article>
      ) : null}
    </div>
  );
}
