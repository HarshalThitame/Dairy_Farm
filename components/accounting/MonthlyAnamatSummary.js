"use client";

import Link from "next/link";
import { toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

export default function MonthlyAnamatSummary({ amount = 0, settlementCount = 0, totalBalance = 0 }) {
  return (
    <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-950 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-extrabold">🏦 अनामत</h2>
          <p className="mt-1 text-[17px] font-bold leading-snug">
            या महिन्यात कपात: {toMarathiCurrency(amount)}
          </p>
          <p className="mt-1 text-[16px] font-bold text-yellow-800">
            {toMarathiNumerals(settlementCount)} सेटलमेंट्स · एकूण शिल्लक {toMarathiCurrency(totalBalance)}
          </p>
        </div>
        <Link
          href="/accounting/anamat"
          className="shrink-0 rounded-lg bg-white px-3 py-2 text-[16px] font-extrabold text-yellow-900 shadow-sm"
        >
          बघा →
        </Link>
      </div>
    </section>
  );
}
