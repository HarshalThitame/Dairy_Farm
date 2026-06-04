"use client";

import { getCompressionStats } from "@/lib/imageCompression";
import { toMarathiNumerals } from "@/lib/marathiUtils";

export default function CompressionStats({ originalSize, compressedSize, compressionRatio }) {
  const stats = getCompressionStats(originalSize, compressedSize);
  const ratio = compressionRatio ?? stats.reduction_percent;

  if (!originalSize || !compressedSize) {
    return null;
  }

  return (
    <section className="rounded-[22px] border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-4 text-blue-950 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-black uppercase tracking-wide text-blue-700">फोटो तयार</p>
          <h2 className="mt-1 text-[21px] font-black leading-tight text-slate-950">आकार कमी झाला</h2>
          <p className="mt-1 text-[15px] font-bold text-slate-600">अक्षरे स्पष्ट ठेवून upload हलका केला.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-black text-emerald-800">
          {toMarathiNumerals(ratio)}% कमी
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-black text-blue-700">मूळ</p>
          <p className="mt-1 text-[19px] font-black text-slate-950">{toMarathiNumerals(stats.original_mb)} MB</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-black text-blue-700">नवीन</p>
          <p className="mt-1 text-[19px] font-black text-slate-950">{toMarathiNumerals(stats.compressed_kb)} KB</p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <p className="text-[13px] font-black text-blue-700">बचत</p>
          <p className="mt-1 text-[19px] font-black text-slate-950">{toMarathiNumerals(ratio)}%</p>
        </div>
      </div>
    </section>
  );
}
