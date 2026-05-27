"use client";

import { formatLitres, toMarathiCurrency } from "@/lib/marathiUtils";

function DifferenceValue({ value, money = false }) {
  const numberValue = Number(value || 0);
  const className = numberValue === 0 ? "text-green-700" : "text-yellow-800";

  return (
    <span className={`font-extrabold ${className}`}>
      {numberValue > 0 ? "+" : ""}
      {money ? toMarathiCurrency(numberValue) : `${formatLitres(numberValue)} लि.`}
    </span>
  );
}

export default function ReconciliationViewer({ reconciliation }) {
  if (!reconciliation) {
    return null;
  }

  const hasDifference =
    Math.abs(Number(reconciliation.discrepancy || 0)) > 0.5 ||
    Math.abs(Number(reconciliation.litersDiscrepancy || 0)) > 0.05;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-[24px] font-extrabold text-slate-950">
        ✅ आपली नोंद VS देयक तपासणी
      </h2>

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg bg-blue-50 p-4 text-blue-950">
          <div className="flex justify-between gap-3 text-[19px] font-bold">
            <span>आपली नोंद</span>
            <span>{formatLitres(reconciliation.expectedLiters)} लि.</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[19px] font-bold">
            <span>देयकातील</span>
            <span>{formatLitres(reconciliation.actualLiters)} लि.</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[20px] font-extrabold">
            <span>फरक</span>
            <DifferenceValue value={reconciliation.litersDiscrepancy} />
          </div>
        </div>

        <div className="rounded-lg bg-green-50 p-4 text-green-950">
          <div className="flex justify-between gap-3 text-[19px] font-bold">
            <span>आपली नोंद</span>
            <span>{toMarathiCurrency(reconciliation.expectedAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[19px] font-bold">
            <span>देयकातील</span>
            <span>{toMarathiCurrency(reconciliation.actualAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[20px] font-extrabold">
            <span>फरक</span>
            <DifferenceValue value={reconciliation.discrepancy} money />
          </div>
        </div>
      </div>

      <p
        className={`mt-4 rounded-lg p-4 text-[20px] font-extrabold ${
          hasDifference
            ? "border border-yellow-200 bg-yellow-50 text-yellow-900"
            : "border border-green-200 bg-green-50 text-green-800"
        }`}
      >
        {hasDifference ? "देयकात फरक आहे. कारण लिहून ठेवा." : "✅ सर्व सरेल!"}
      </p>
    </section>
  );
}
