"use client";

import Link from "next/link";
import { formatLitres, formatMarathiDate, toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

function sessionEmoji(session) {
  return session === "सकाळ" ? "🌅" : "🌆";
}

function formatReading(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "नोंद नाही";
  }

  return `${toMarathiNumerals(value)}${suffix}`;
}

export default function DairySlipCard({ slip, onDelete }) {
  const amount = Number(slip.total_amount ?? Number(slip.liters || 0) * Number(slip.rate_per_liter || 0));
  const editHref = `/nondi/dudh?date=${encodeURIComponent(slip.slip_date)}`;

  return (
    <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-soft">
      <Link href={editHref} className="block active:bg-blue-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[22px] font-extrabold text-slate-950">
              {sessionEmoji(slip.session)} {slip.session}
            </h3>
            <p className="mt-1 text-[18px] font-bold text-slate-600">
              {formatMarathiDate(slip.slip_date)}
            </p>
          </div>
          <p className="shrink-0 text-[22px] font-extrabold text-green-700">
            {toMarathiCurrency(amount)}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-900">
            <p className="text-[17px] font-extrabold">दूध</p>
            <p className="mt-1 text-[22px] font-extrabold">{formatLitres(slip.liters)} लि.</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-green-900">
            <p className="text-[17px] font-extrabold">दर</p>
            <p className="mt-1 text-[22px] font-extrabold">{toMarathiCurrency(slip.rate_per_liter)}/लि.</p>
          </div>
        </div>

        <p className="mt-3 text-[18px] font-bold text-slate-700">
          Fat: {formatReading(slip.fat_percentage, "%")} | SNF: {formatReading(slip.snf_percentage, "%")} | CLR: {formatReading(slip.clr_degree)}
        </p>
      </Link>

      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(slip)}
          className="mt-3 min-h-[48px] w-full rounded-lg border-2 border-red-200 bg-red-50 px-4 text-[18px] font-extrabold text-red-800 active:bg-red-100"
        >
          🗑️ नोंद काढा
        </button>
      ) : null}
    </article>
  );
}
