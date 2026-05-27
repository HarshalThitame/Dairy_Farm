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
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-950">
      <p className="text-[18px] font-extrabold">फोटो आकार कमी झाला</p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white p-2">
          <p className="text-[13px] font-bold text-blue-700">मूळ</p>
          <p className="text-[18px] font-extrabold">{toMarathiNumerals(stats.original_mb)} MB</p>
        </div>
        <div className="rounded-lg bg-white p-2">
          <p className="text-[13px] font-bold text-blue-700">नवीन</p>
          <p className="text-[18px] font-extrabold">{toMarathiNumerals(stats.compressed_kb)} KB</p>
        </div>
        <div className="rounded-lg bg-white p-2">
          <p className="text-[13px] font-bold text-blue-700">कमी</p>
          <p className="text-[18px] font-extrabold">{toMarathiNumerals(ratio)}%</p>
        </div>
      </div>
    </section>
  );
}
