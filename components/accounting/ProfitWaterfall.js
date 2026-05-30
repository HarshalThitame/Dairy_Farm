"use client";

import { toMarathiCurrency } from "@/lib/marathiUtils";

function Step({ label, amount, tone }) {
  const toneClass =
    tone === "income"
      ? "border-green-200 bg-green-50 text-green-900"
      : tone === "finalProfit"
        ? "border-green-300 bg-green-100 text-green-950"
        : tone === "finalLoss"
          ? "border-red-300 bg-red-100 text-red-950"
          : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className={`rounded-lg border-2 p-4 ${toneClass}`}>
      <p className="text-[18px] font-extrabold">{label}</p>
      <p className="mt-1 text-[26px] font-extrabold">{toMarathiCurrency(amount)}</p>
    </div>
  );
}

export default function ProfitWaterfall({ income = 0, expenses = 0, deductions = 0 }) {
  const netProfit = Number(income || 0) - Number(expenses || 0) - Number(deductions || 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-[24px] font-extrabold text-slate-950">नफा कसा मोजला</h2>
      <div className="mt-4 grid gap-3">
        <Step label="दूध उत्पन्न" amount={income} tone="income" />
        <div className="text-center text-[24px] font-extrabold text-slate-400">↓</div>
        <Step label="(-) इतर देयक कपात" amount={deductions} tone="expense" />
        <div className="text-center text-[24px] font-extrabold text-slate-400">↓</div>
        <Step label="(-) फार्म खर्च" amount={expenses} tone="expense" />
        <div className="text-center text-[24px] font-extrabold text-slate-400">=</div>
        <Step
          label={netProfit >= 0 ? "शुद्ध नफा" : "तोटा"}
          amount={netProfit}
          tone={netProfit >= 0 ? "finalProfit" : "finalLoss"}
        />
      </div>
    </section>
  );
}
