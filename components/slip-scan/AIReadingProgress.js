"use client";

import { useEffect, useMemo, useState } from "react";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const STEPS = [
  {
    key: "checking",
    label: "QUALITY",
    title: "फोटो तपासत आहे",
    text: "स्लिप स्पष्ट, सरळ आणि वाचण्यायोग्य आहे का ते पाहत आहे..."
  },
  {
    key: "compressing",
    label: "IMAGE",
    title: "फोटो तयार करत आहे",
    text: "फोटो हलका करत आहे, पण अक्षरे स्पष्ट ठेवत आहे..."
  },
  {
    key: "uploading",
    label: "UPLOAD",
    title: "स्लिप सुरक्षित पाठवत आहे",
    text: "फोटो server वर पाठवत आहे. कृपया थांबा..."
  },
  {
    key: "reading",
    label: "OCR",
    title: "अक्षरे वाचत आहे",
    text: "तारीख, लिटर, फॅट, SNF, दर आणि रक्कम शोधत आहे..."
  },
  {
    key: "math",
    label: "MATH",
    title: "हिशोब तपासत आहे",
    text: "लिटर × दर, कपात आणि अंतिम रक्कम जुळते का ते तपासत आहे..."
  },
  {
    key: "review",
    label: "REVIEW",
    title: "तपासणीसाठी तयार करत आहे",
    text: "AI ने वाचलेली माहिती तुम्हाला बदलण्यासाठी दाखवत आहे..."
  }
];

const STAGE_INDEX = {
  checking: 0,
  compressing: 1,
  compressed: 1,
  uploading: 2,
  uploaded: 3,
  reading: 3,
  extracting: 3,
  ocr: 3,
  math: 4,
  validating: 4,
  review: 5,
  ready: 5
};

const STEP_PROGRESS = [16, 32, 50, 68, 84, 96];

const TIPS = [
  "AI वाचलेली माहिती जतन करण्यापूर्वी तुम्ही तपासू आणि बदलू शकता.",
  "आर्थिक आकडे अस्पष्ट असतील तर app थेट save करत नाही.",
  "स्लिपवरील एकूण लिटर, कपात आणि निव्वळ रक्कम शेवटी नक्की तपासा.",
  "फोटो सरळ आणि जवळून घेतला तर OCR जास्त अचूक होते."
];

export default function AIReadingProgress({ stage = "reading", message = "", autoAdvance = false }) {
  const initialIndex = STAGE_INDEX[stage] ?? 0;
  const [autoIndex, setAutoIndex] = useState(initialIndex);

  useEffect(() => {
    setAutoIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!autoAdvance) return undefined;

    const timer = window.setInterval(() => {
      setAutoIndex((current) => Math.min(current + 1, STEPS.length - 1));
    }, 1400);

    return () => window.clearInterval(timer);
  }, [autoAdvance]);

  const activeIndex = autoAdvance ? Math.max(autoIndex, initialIndex) : initialIndex;
  const activeStep = STEPS[activeIndex] || STEPS[0];
  const fillPercent = STEP_PROGRESS[activeIndex] ?? 80;
  const tip = useMemo(() => TIPS[activeIndex % TIPS.length], [activeIndex]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-3 py-6 backdrop-blur-sm sm:px-4"
      role="status"
      aria-live="polite"
    >
      <section className="ai-slip-loader dashboard-panel relative max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[26px] border border-white/80 bg-white/90 p-4 shadow-2xl backdrop-blur">
        <div className="ai-slip-loader-sheen" aria-hidden="true" />

        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-center">
          <div className="ai-slip-scan-console rounded-[22px] bg-slate-950 p-4 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[12px] font-black uppercase text-cyan-100">
                AI OCR live
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-black text-slate-100">
                {toMarathiNumerals(activeIndex + 1)} / {toMarathiNumerals(STEPS.length)}
              </span>
            </div>

            <div className="ai-slip-scan-stage mt-4">
              <div className="ai-slip-document">
                <div className="ai-slip-document-fold" aria-hidden="true" />
                <div className="ai-slip-scan-beam" aria-hidden="true" />
                <div className="ai-slip-reader-lines" aria-hidden="true">
                  <span className="w-8/12" />
                  <span className="w-10/12" />
                  <span className="w-7/12" />
                  <span className="w-11/12" />
                  <span className="w-9/12" />
                  <span className="w-6/12" />
                </div>
                <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/85 px-3 py-1 text-[13px] font-black text-cyan-100 shadow-sm">
                  {toMarathiNumerals(fillPercent)}%
                </div>
              </div>
            </div>

            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={fillPercent}
              aria-label="AI स्लिप वाचन प्रगती"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-300 shadow-[0_0_22px_rgba(34,211,238,0.42)] transition-all duration-700"
                style={{ width: `${fillPercent}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-black uppercase text-slate-300">
              <span className="rounded-full bg-white/10 px-2 py-1">Liters</span>
              <span className="rounded-full bg-white/10 px-2 py-1">Fat/SNF</span>
              <span className="rounded-full bg-white/10 px-2 py-1">Amount</span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">AI स्लिप स्कॅन</p>
                <h2 className="mt-1 text-[25px] font-black leading-tight text-slate-950 sm:text-[28px]">
                  {activeStep.title}
                </h2>
              </div>
              <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[14px] font-black text-emerald-900 shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.14)]" aria-hidden="true" />
                {activeStep.label}
              </div>
            </div>

            <p className="mt-3 text-[17px] font-bold leading-snug text-slate-700 sm:text-[18px]">
              {message || activeStep.text}
            </p>

            <div className="mt-5 grid grid-cols-6 gap-1.5" aria-hidden="true">
              {STEPS.map((step, index) => (
                <div
                  key={step.key}
                  className={`h-2.5 rounded-full transition-colors duration-300 ${
                    index <= activeIndex ? "bg-slate-950" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <ol className="mt-5 grid gap-2 sm:grid-cols-2">
              {STEPS.map((step, index) => {
                const isDone = index < activeIndex;
                const isActive = index === activeIndex;

                return (
                  <li
                    key={step.key}
                    aria-current={isActive ? "step" : undefined}
                    className={`flex min-h-[48px] items-center gap-3 rounded-[16px] border px-3 py-2 text-[14px] font-black transition-colors ${
                      isDone
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : isActive
                          ? "border-slate-300 bg-slate-950 text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] ${
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isActive
                            ? "bg-cyan-300 text-slate-950"
                            : "bg-white text-slate-500"
                      }`}
                    >
                      {isDone ? "✓" : toMarathiNumerals(index + 1)}
                    </span>
                    <span className="min-w-0 leading-tight">{step.title}</span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 flex items-start gap-3 rounded-[18px] border border-sky-100 bg-sky-50 px-3 py-3 text-[15px] font-bold leading-snug text-sky-950">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[13px] font-black text-white">
                i
              </span>
              <p>{tip}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
