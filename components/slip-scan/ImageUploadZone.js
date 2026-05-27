"use client";

import { useRef, useState } from "react";

export default function ImageUploadZone({ onFileSelect, loading = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files) {
    const file = files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
  }

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={`rounded-lg border-2 border-dashed p-6 text-center shadow-soft ${
        dragging ? "border-green-400 bg-green-50" : "border-slate-200 bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="text-[54px]" aria-hidden="true">📁</div>
      <h2 className="mt-2 text-[24px] font-extrabold text-slate-950">स्लिप फोटो निवडा</h2>
      <p className="mt-2 text-[19px] font-bold leading-relaxed text-slate-600">
        फोटो येथे ड्रॅग करा किंवा खालील बटण टॅप करा.
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="mt-5 min-h-[58px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white disabled:opacity-70 active:bg-green-700"
      >
        {loading ? "फोटो तयार करत आहे..." : "📁 गॅलरी मधून निवडा"}
      </button>
    </section>
  );
}
