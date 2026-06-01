"use client";

import { useEffect, useMemo, useState } from "react";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const STEPS = [
  {
    key: "checking",
    icon: "🔍",
    title: "फोटो तपासत आहे",
    text: "स्लिप स्पष्ट, सरळ आणि वाचण्यायोग्य आहे का ते पाहत आहे..."
  },
  {
    key: "compressing",
    icon: "🖼️",
    title: "फोटो तयार करत आहे",
    text: "फोटो हलका करत आहे, पण अक्षरे स्पष्ट ठेवत आहे..."
  },
  {
    key: "uploading",
    icon: "☁️",
    title: "स्लिप सुरक्षित पाठवत आहे",
    text: "फोटो server वर पाठवत आहे. कृपया थांबा..."
  },
  {
    key: "reading",
    icon: "🤖",
    title: "अक्षरे वाचत आहे",
    text: "तारीख, लिटर, फॅट, SNF, दर आणि रक्कम शोधत आहे..."
  },
  {
    key: "math",
    icon: "🧮",
    title: "हिशोब तपासत आहे",
    text: "लिटर × दर, कपात आणि अंतिम रक्कम जुळते का ते तपासत आहे..."
  },
  {
    key: "review",
    icon: "✅",
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
  const fillPercent = Math.max(16, Math.round(((activeIndex + 1) / STEPS.length) * 100));
  const tip = useMemo(() => TIPS[activeIndex % TIPS.length], [activeIndex]);

  return (
    <section className="dashboard-panel overflow-hidden rounded-lg border border-green-200 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="relative flex h-24 w-20 shrink-0 items-end overflow-hidden rounded-lg border-2 border-green-200 bg-gradient-to-b from-white to-green-50 shadow-inner">
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-lg bg-gradient-to-t from-green-500 via-emerald-300 to-cyan-200 transition-all duration-700"
            style={{ height: `${fillPercent}%` }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[30px] drop-shadow-sm" aria-hidden="true">🥛</span>
            <span className="mt-1 rounded-full bg-white/85 px-2 py-0.5 text-[12px] font-black text-green-900">
              {toMarathiNumerals(fillPercent)}%
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-extrabold text-green-700">AI स्लिप वाचत आहे</p>
              <h2 className="mt-1 text-[23px] font-black leading-tight text-slate-950">
                <span aria-hidden="true">{activeStep.icon}</span> {activeStep.title}
              </h2>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-[18px] font-black text-sheti ring-1 ring-green-200">
              {toMarathiNumerals(activeIndex + 1)}
            </span>
          </div>

          <p className="mt-2 text-[17px] font-bold leading-snug text-slate-700">
            {message || activeStep.text}
          </p>

          <div className="mt-4 grid grid-cols-6 gap-1">
            {STEPS.map((step, index) => (
              <div
                key={step.key}
                className={`h-2 rounded-full transition-colors duration-300 ${
                  index <= activeIndex ? "bg-sheti" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[15px] font-bold leading-snug text-blue-900">
        💡 {tip}
      </div>

      <div className="mt-4 space-y-2">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex items-center gap-2 text-[15px] font-extrabold">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                index < activeIndex
                  ? "bg-green-600 text-white"
                  : index === activeIndex
                    ? "animate-pulse bg-yellow-400 text-yellow-950"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {index < activeIndex ? "✓" : index + 1}
            </span>
            <span className={index <= activeIndex ? "text-slate-900" : "text-slate-500"}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
