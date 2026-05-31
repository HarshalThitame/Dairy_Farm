"use client";

import Link from "next/link";
import { formatMarathiDate, toMarathiCurrency } from "@/lib/marathiUtils";

export default function SettlementCard({ settlement, onMarkPaid, onDelete }) {
  const deductions = Number(settlement.cattle_feed_deduction || 0) + Number(settlement.other_deductions || 0);
  const netPayable = Number(settlement.total_milk_income || 0) - deductions;

  return (
    <article className="dashboard-card rounded-lg border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur">
      <Link href={`/accounting/settlements/${settlement.id}/edit`} className="block active:bg-green-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[22px] font-extrabold leading-tight text-slate-950">
              {formatMarathiDate(settlement.period_start)} - {formatMarathiDate(settlement.period_end)}
            </h3>
            <p className="mt-1 text-[18px] font-bold text-slate-600">
              सेटलमेंट: {formatMarathiDate(settlement.settlement_date)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-[17px] font-extrabold ${
            settlement.payment_received ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-900"
          }`}>
            {settlement.payment_received ? "✅ प्राप्त" : "⏳ प्रतीक्षा"}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-green-50 p-3 text-green-900">
            <p className="text-[16px] font-extrabold">उत्पन्न</p>
            <p className="mt-1 text-[19px] font-extrabold">{toMarathiCurrency(settlement.total_milk_income)}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-red-900">
            <p className="text-[16px] font-extrabold">कपात</p>
            <p className="mt-1 text-[19px] font-extrabold">{toMarathiCurrency(deductions)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-blue-900">
            <p className="text-[16px] font-extrabold">शुद्ध देय</p>
            <p className="mt-1 text-[19px] font-extrabold">{toMarathiCurrency(netPayable)}</p>
          </div>
        </div>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {!settlement.payment_received && onMarkPaid ? (
          <button
            type="button"
            onClick={() => onMarkPaid(settlement)}
            className="min-h-[48px] rounded-lg bg-sheti px-3 text-[18px] font-extrabold text-white active:bg-green-700"
          >
            ✅ पेमेंट मिळाली
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(settlement)}
            className="min-h-[48px] rounded-lg border-2 border-red-200 bg-red-50 px-3 text-[18px] font-extrabold text-red-800 active:bg-red-100"
          >
            🗑️ काढा
          </button>
        ) : null}
      </div>
    </article>
  );
}
