"use client";

import { toMarathiNumerals } from "@/lib/marathiUtils";

export default function ConfidenceIndicator({ score }) {
  const confidence = Number(score || 0);
  const percent = Math.round(confidence > 1 ? confidence : confidence * 100);
  const tone =
    confidence >= 0.95
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : confidence >= 0.8
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-800";
  const label = confidence >= 0.95 ? "✅ स्पष्ट वाचले" : confidence >= 0.8 ? "⚠️ तपासा" : "⚠️ AI खात्री कमी";

  return (
    <span className={`inline-flex min-h-[48px] items-center gap-2 rounded-2xl border px-3 py-2 text-[14px] font-black shadow-sm ${tone}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-[13px] shadow-sm">
        {toMarathiNumerals(percent)}
      </span>
      <span>
        <span className="block leading-tight">{label}</span>
        <span className="block text-[12px] opacity-80">AI विश्वास {toMarathiNumerals(percent)}%</span>
      </span>
    </span>
  );
}
