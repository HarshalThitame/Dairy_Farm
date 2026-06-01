"use client";

import { toMarathiNumerals } from "@/lib/marathiUtils";

export default function ConfidenceIndicator({ score }) {
  const confidence = Number(score || 0);
  const percent = Math.round(confidence * 100);
  const tone =
    confidence >= 0.95
      ? "border-green-200 bg-green-50 text-green-800"
      : confidence >= 0.8
        ? "border-yellow-200 bg-yellow-50 text-yellow-900"
        : "border-red-200 bg-red-50 text-red-800";
  const label = confidence >= 0.95 ? "✅ स्पष्ट वाचले" : confidence >= 0.8 ? "⚠️ तपासा" : "⚠️ AI खात्री कमी";

  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[14px] font-extrabold ${tone}`}>
      {label} {toMarathiNumerals(percent)}%
    </span>
  );
}
