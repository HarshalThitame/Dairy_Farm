"use client";

import { formatLitres, toMarathiCurrency } from "@/lib/marathiUtils";

export default function ReconciliationViewer({ reconciliation }) {
  if (!reconciliation) {
    return null;
  }

  const discrepancy = Number(reconciliation.discrepancy || 0);
  const litersDiscrepancy = Number(reconciliation.litersDiscrepancy || reconciliation.liters_discrepancy || 0);
  const isClear = Math.abs(discrepancy) < 0.01 && Math.abs(litersDiscrepancy) < 0.01;

  return (
    <div className="space-y-3 text-[18px] font-bold">
      <p className={`rounded-lg p-3 text-[19px] font-extrabold ${isClear ? "bg-green-50 text-green-800" : "bg-yellow-50 text-yellow-900"}`}>
        {isClear ? "✅ सर्व सरेल! देयक आपल्या नोंदीशी जुळते." : `⚠️ फरक आहे: ${toMarathiCurrency(Math.abs(discrepancy))}`}
      </p>

      <div className="rounded-lg bg-slate-50 p-3">
        <div className="flex justify-between gap-3"><span>आपली दूध नोंद</span><span>{formatLitres(reconciliation.expectedLiters || 0)} लि.</span></div>
        <div className="mt-2 flex justify-between gap-3"><span>देयकातील दूध</span><span>{formatLitres(reconciliation.actualLiters || 0)} लि.</span></div>
        <div className="mt-2 flex justify-between gap-3"><span>फरक</span><span>{formatLitres(litersDiscrepancy)} लि.</span></div>
      </div>

      <div className="rounded-lg bg-slate-50 p-3">
        <div className="flex justify-between gap-3"><span>आपली रक्कम</span><span>{toMarathiCurrency(reconciliation.expectedAmount || 0)}</span></div>
        <div className="mt-2 flex justify-between gap-3"><span>देयकातील रक्कम</span><span>{toMarathiCurrency(reconciliation.actualAmount || 0)}</span></div>
        <div className="mt-2 flex justify-between gap-3"><span>फरक</span><span>{toMarathiCurrency(discrepancy)}</span></div>
      </div>
    </div>
  );
}
