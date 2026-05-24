"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import {
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { displayVaccineName, getMonthName, vaccineTypes } from "@/lib/reportUtils";

function groupByMonth(items) {
  return items.reduce((groups, item) => {
    const date = new Date(`${item.due_date}T00:00:00`);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const label = `${getMonthName(date.getMonth() + 1)} ${toMarathiNumerals(date.getFullYear())}`;

    if (!groups[key]) {
      groups[key] = { label, items: [] };
    }

    groups[key].items.push(item);
    return groups;
  }, {});
}

function DueCard({ item, tone }) {
  const color =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-900"
      : tone === "yellow"
        ? "border-yellow-300 bg-yellow-50 text-yellow-900"
        : "border-blue-300 bg-blue-50 text-blue-900";

  return (
    <article className={`rounded-lg border-2 p-4 shadow-soft ${color}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[23px] font-extrabold leading-tight text-slate-950">
            {item.cow_name}
          </p>
          <p className="mt-1 text-[19px] font-bold">
            {displayVaccineName(item.vaccine_name)}
          </p>
          <p className="mt-1 text-[18px] font-bold">
            तारीख: {formatMarathiDate(item.due_date)}
          </p>
          {item.days_late ? (
            <p className="mt-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-[18px] font-extrabold text-red-800">
              {toMarathiNumerals(item.days_late)} दिवस उशीर
            </p>
          ) : item.days_left ? (
            <p className="mt-2 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-[18px] font-extrabold text-yellow-800">
              {toMarathiNumerals(item.days_left)} दिवस राहिले
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href={`/nondi/lasikaran?cow_id=${item.cow_id}`}
        className="mt-4 flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white active:bg-green-700"
      >
        💉 लस द्या
      </Link>
    </article>
  );
}

function GridCell({ cell }) {
  const color =
    cell.status === "ok"
      ? "bg-green-50 text-green-800"
      : cell.status === "due_soon"
        ? "bg-yellow-50 text-yellow-800"
        : "bg-red-50 text-red-800";

  return (
    <td className={`min-w-[150px] border border-slate-200 p-2 text-center text-[18px] font-bold ${color}`}>
      {cell.last_date ? formatMarathiDate(cell.last_date) : "नाही"}
    </td>
  );
}

export default function VaccinationListPage() {
  const [report, setReport] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/reports/vaccination", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "लसीकरण यादी मिळाली नाही.");
      }

      setReport(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "यादी मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const upcomingByMonth = useMemo(() => groupByMonth(report?.upcoming || []), [report]);

  return (
    <div className="space-y-6">
      <PageHeader title="💉 लसीकरण यादी" />

      {loading ? <LoadingState text="लसीकरण यादी लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchReport} /> : null}

      {!loading && !error && report ? (
        <>
          <section className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <h2 className="text-[24px] font-extrabold text-red-900">थकलेल्या लसी</h2>
            <div className="mt-4 space-y-3">
              {report.overdue.length > 0 ? (
                report.overdue.map((item) => <DueCard key={item.id} item={item} tone="red" />)
              ) : (
                <p className="rounded-lg bg-white p-4 text-center text-[20px] font-extrabold text-green-800">
                  थकलेली लस नाही.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4">
            <h2 className="text-[24px] font-extrabold text-yellow-900">या महिन्यात</h2>
            <div className="mt-4 space-y-3">
              {report.dueThisMonth.length > 0 ? (
                report.dueThisMonth.map((item) => (
                  <DueCard key={item.id} item={item} tone="yellow" />
                ))
              ) : (
                <p className="rounded-lg bg-white p-4 text-center text-[20px] font-extrabold text-slate-700">
                  या महिन्यात लस बाकी नाही.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <h2 className="text-[24px] font-extrabold text-blue-900">पुढील ३ महिने</h2>
            <div className="mt-4 space-y-4">
              {Object.values(upcomingByMonth).length > 0 ? (
                Object.values(upcomingByMonth).map((group) => (
                  <div key={group.label}>
                    <h3 className="text-[21px] font-extrabold text-blue-950">{group.label}</h3>
                    <div className="mt-2 space-y-3">
                      {group.items.map((item) => (
                        <DueCard key={item.id} item={item} tone="blue" />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-white p-4 text-center text-[20px] font-extrabold text-slate-700">
                  पुढील तीन महिन्यात लस बाकी नाही.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <button
              type="button"
              onClick={() => setShowCompleted((current) => !current)}
              className="flex min-h-[56px] w-full items-center justify-between rounded-lg bg-slate-100 px-4 text-left text-[21px] font-extrabold text-slate-950 active:bg-slate-200"
            >
              <span>या वर्षात झालेल्या</span>
              <span>{showCompleted ? "▲" : "▼"}</span>
            </button>
            <p className="mt-3 text-[18px] font-bold text-slate-600">
              सर्व {toMarathiNumerals(report.completedThisYear.length)} नोंदी
            </p>

            {showCompleted ? (
              <div className="mt-4 space-y-3">
                {report.completedThisYear.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-[20px] font-extrabold text-slate-950">
                      {item.cow_name}
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-slate-700">
                      {displayVaccineName(item.vaccine_name)} | {formatMarathiDate(item.date)}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <button
              type="button"
              onClick={() => setShowGrid((current) => !current)}
              className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white active:bg-green-700"
            >
              📋 सर्व गायींची लस शेड्युल बघा
            </button>

            {showGrid ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[980px] w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="sticky left-0 z-10 min-w-[150px] border border-slate-200 bg-slate-100 p-2 text-left text-[18px] font-extrabold">
                        गाय
                      </th>
                      {vaccineTypes.map((type) => (
                        <th
                          key={type}
                          className="min-w-[150px] border border-slate-200 p-2 text-center text-[18px] font-extrabold"
                        >
                          {type}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.vaccinationGrid.map((cow) => (
                      <tr key={cow.cow_id}>
                        <th className="sticky left-0 z-10 border border-slate-200 bg-white p-2 text-left text-[18px] font-extrabold text-sheti">
                          {cow.name}
                        </th>
                        {cow.vaccines.map((cell) => (
                          <GridCell key={cell.vaccine_name} cell={cell} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
