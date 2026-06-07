"use client";

import { useState } from "react";
import { getMonthName, normalizeReportMonthYear, reportMonths } from "@/lib/reportUtils";
import { toMarathiNumerals } from "@/lib/marathiUtils";

function shiftMonth(value, offset) {
  const safeValue = normalizeReportMonthYear(value);
  const date = new Date(safeValue.year, safeValue.month - 1 + offset, 1);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
}

export default function MonthSelector({ value, onChange }) {
  const safeValue = normalizeReportMonthYear(value);
  const [open, setOpen] = useState(false);
  const [draftMonth, setDraftMonth] = useState(safeValue.month);
  const [draftYear, setDraftYear] = useState(safeValue.year);

  function applySelection() {
    onChange(normalizeReportMonthYear({ month: draftMonth, year: draftYear }, safeValue));
    setOpen(false);
  }

  return (
    <div className="dashboard-card rounded-lg border border-white/80 bg-white/90 p-3 shadow-soft backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(shiftMonth(safeValue, -1))}
          className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[18px] font-extrabold text-slate-700 active:bg-slate-100"
        >
          ◀ मागील
        </button>
        <button
          type="button"
          onClick={() => {
            setDraftMonth(safeValue.month);
            setDraftYear(safeValue.year);
            setOpen((current) => !current);
          }}
          className="min-h-[52px] rounded-lg bg-green-100 px-3 text-center text-[20px] font-extrabold text-sheti active:bg-green-200"
        >
          📅 {getMonthName(safeValue.month)} {toMarathiNumerals(safeValue.year)}
        </button>
        <button
          type="button"
          onClick={() => onChange(shiftMonth(safeValue, 1))}
          className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[18px] font-extrabold text-slate-700 active:bg-slate-100"
        >
          पुढील ▶
        </button>
      </div>

      {open ? (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_auto_auto]">
          <select
            value={draftMonth}
            onChange={(event) => setDraftMonth(Number(event.target.value))}
            className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-900 outline-none focus:border-sheti"
            aria-label="महिना निवडा"
          >
            {reportMonths.map((monthName, index) => (
              <option key={monthName} value={index + 1}>
                {monthName}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={draftYear}
            onChange={(event) => setDraftYear(Number(event.target.value))}
            inputMode="numeric"
            className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-900 outline-none focus:border-sheti"
            aria-label="वर्ष निवडा"
          />
          <button
            type="button"
            onClick={applySelection}
            className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white active:bg-green-700"
          >
            ✅ निवडा
          </button>
        </div>
      ) : null}
    </div>
  );
}
