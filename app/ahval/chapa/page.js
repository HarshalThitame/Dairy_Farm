"use client";

import { useCallback, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import PrintableReport from "@/app/ahval/chapa/PrintableReport";
import { fetchJson } from "@/lib/offlineActions";
import { getIndiaMonthParts, getMonthRange, getReportMonthFromSearchParams } from "@/lib/reportUtils";

const options = [
  { id: "milk", label: "दूध उत्पादन सारांश", defaultChecked: true },
  { id: "finance", label: "हिशोब सारांश", defaultChecked: true },
  { id: "performance", label: "गाय कामगिरी", defaultChecked: true },
  { id: "vaccination", label: "लसीकरण यादी", defaultChecked: true },
  { id: "transactions", label: "सर्व व्यवहार यादी", defaultChecked: false }
];

function getInitialMonth() {
  const current = getIndiaMonthParts();
  if (typeof window === "undefined") {
    return current;
  }

  const searchParams = new URLSearchParams(window.location.search);

  return getReportMonthFromSearchParams(searchParams, current);
}

function addDaysISO(dateString, days) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getMonthDateQuery(monthValue) {
  const range = getMonthRange(monthValue.month, monthValue.year);
  const endInclusive = addDaysISO(range.end, -1);
  return `from=${range.start}&to=${endInclusive}`;
}

function buildPerformance(cows, milkReport, aiRecords, calvingRecords) {
  const milkByCow = new Map((milkReport?.perCow || []).map((cow) => [cow.cow_id, cow]));
  const aiCount = aiRecords.reduce((map, record) => {
    map.set(record.cow_id, (map.get(record.cow_id) || 0) + 1);
    return map;
  }, new Map());
  const calvingCount = calvingRecords.reduce((map, record) => {
    map.set(record.cow_id, (map.get(record.cow_id) || 0) + 1);
    return map;
  }, new Map());

  return cows
    .map((cow) => ({
      ...cow,
      totalMilk: Number(milkByCow.get(cow.id)?.total || 0),
      aiCount: aiCount.get(cow.id) || 0,
      calvingCount: calvingCount.get(cow.id) || 0
    }))
    .sort((first, second) => second.totalMilk - first.totalMilk || first.name.localeCompare(second.name, "mr-IN"));
}

export default function PrintReportPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [selectedSections, setSelectedSections] = useState(
    options.filter((option) => option.defaultChecked).map((option) => option.id)
  );
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSet = useMemo(() => new Set(selectedSections), [selectedSections]);

  function toggleSection(section) {
    setSelectedSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  }

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = `month=${monthValue.month}&year=${monthValue.year}`;
      const monthDateQuery = getMonthDateQuery(monthValue);
      const [milk, finance, vaccination, cows, ai, calving, farm] =
        await Promise.all([
          fetchJson(`/api/reports/milk?${query}`),
          fetchJson(`/api/reports/finance?${query}`),
          fetchJson("/api/reports/vaccination"),
          fetchJson("/api/cows"),
          fetchJson(`/api/ai?${monthDateQuery}`),
          fetchJson(`/api/calving?${monthDateQuery}`),
          fetchJson("/api/farms/current")
        ]);

      const performance = buildPerformance(
        cows || [],
        milk,
        ai || [],
        calving || []
      );

      const nextReportData = {
        month: monthValue.month,
        year: monthValue.year,
        milk,
        finance,
        vaccination,
        performance,
        farm
      };

      setReportData(nextReportData);
      return nextReportData;
    } catch (fetchError) {
      setError(fetchError.message || "अहवाल तयार करताना चूक झाली.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  async function generateAndPrint() {
    const data = await fetchReportData();

    if (!data) {
      return;
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
          }

          nav,
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

          .print-page {
            box-shadow: none !important;
            border: 0 !important;
          }
        }
      `}</style>

      <div className="no-print space-y-6">
        <PageHeader title="🖨️ अहवाल छापा" />
        <MonthSelector value={monthValue} onChange={setMonthValue} />

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            अहवालात काय हवे?
          </h2>
          <div className="mt-4 grid gap-3">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleSection(option.id)}
                className={`min-h-[56px] rounded-lg border-2 px-4 text-left text-[20px] font-extrabold ${
                  selectedSet.has(option.id)
                    ? "border-green-300 bg-green-100 text-sheti"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {selectedSet.has(option.id) ? "☑" : "☐"} {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={generateAndPrint}
            disabled={loading || selectedSections.length === 0}
            className="mt-5 min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft active:bg-green-700 disabled:bg-slate-400"
          >
            {loading ? "अहवाल तयार होत आहे..." : "🖨️ अहवाल तयार करा"}
          </button>
        </section>

        {error ? <ErrorState message={error} onRetry={fetchReportData} /> : null}
        {loading ? <LoadingState text="अहवाल तयार होत आहे..." /> : null}
      </div>

      {reportData ? (
        <PrintableReport reportData={reportData} selectedSections={selectedSections} />
      ) : null}
    </div>
  );
}
