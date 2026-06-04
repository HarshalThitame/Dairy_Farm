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

  function openPicker() {
    if (loading) return;
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
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
      className={`relative overflow-hidden rounded-[28px] border-2 border-dashed p-5 text-center shadow-soft transition duration-200 ${
        dragging
          ? "border-emerald-400 bg-emerald-50 shadow-lg"
          : "border-sky-200 bg-gradient-to-br from-white via-sky-50 to-emerald-50"
      }`}
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-sky-200/40" />
      <div className="pointer-events-none absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-emerald-200/35" />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="relative">
        <button
          type="button"
          disabled={loading}
          onClick={openPicker}
          className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] border border-white bg-white text-[48px] shadow-md transition active:scale-95 disabled:cursor-wait disabled:opacity-70"
          aria-label="स्लिप फोटो निवडा"
        >
          {loading ? "⏳" : "📁"}
        </button>

        <h2 className="mt-4 text-[28px] font-black leading-tight text-slate-950">
          {dragging ? "फोटो इथे सोडा" : "गॅलरी मधून स्लिप निवडा"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[17px] font-bold leading-snug text-slate-600">
          फोटो drag-drop करा किंवा खालील मोठ्या बटणावर टॅप करा. कॅमेरा उघडणार नाही; फोनमधील फोटोच निवडला जाईल.
        </p>

        <div className="mt-5 grid gap-2 text-left sm:grid-cols-3">
          <div className="rounded-2xl bg-white/85 px-3 py-3 shadow-sm">
            <p className="text-[13px] font-black text-sky-700">१</p>
            <p className="mt-1 text-[15px] font-black text-slate-900">फोटो निवडा</p>
          </div>
          <div className="rounded-2xl bg-white/85 px-3 py-3 shadow-sm">
            <p className="text-[13px] font-black text-sky-700">२</p>
            <p className="mt-1 text-[15px] font-black text-slate-900">AI वाचेल</p>
          </div>
          <div className="rounded-2xl bg-white/85 px-3 py-3 shadow-sm">
            <p className="text-[13px] font-black text-sky-700">३</p>
            <p className="mt-1 text-[15px] font-black text-slate-900">तपासून जतन</p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={openPicker}
          className="mt-5 min-h-[60px] w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 text-[20px] font-black text-white shadow-md transition active:scale-[0.99] disabled:cursor-wait disabled:from-slate-300 disabled:to-slate-400"
        >
          {loading ? "फोटो तयार करत आहे..." : "🖼️ फोटो निवडा"}
        </button>
      </div>
    </section>
  );
}
