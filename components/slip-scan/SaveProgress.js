"use client";

import { useEffect, useMemo, useState } from "react";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const STEPS = [
  {
    icon: "🔒",
    title: "तपासलेले आकडे लॉक करत आहे",
    text: "तुम्ही तपासलेली माहिती सुरक्षित save साठी तयार करत आहे..."
  },
  {
    icon: "💾",
    title: "नोंद जतन करत आहे",
    text: "दूध/सेटलमेंट माहिती database मध्ये जतन होत आहे..."
  },
  {
    icon: "🧮",
    title: "हिशोब अपडेट करत आहे",
    text: "मासिक उत्पन्न, कपात आणि नफा पुन्हा मोजत आहे..."
  },
  {
    icon: "📊",
    title: "रिपोर्ट तयार करत आहे",
    text: "सारांश आणि अहवालात नवीन नोंद जोडत आहे..."
  },
  {
    icon: "🏠",
    title: "मुख्यपृष्ठावर नेत आहे",
    text: "नोंद पूर्ण झाली. आता मुख्यपृष्ठावर जात आहे..."
  }
];

const TIPS = [
  "जतन झाल्यावर ही नोंद अहवाल आणि नफ्यात आपोआप दिसेल.",
  "स्लिप फोटो audit साठी जोडून ठेवला जातो.",
  "सेटलमेंट असेल तर खाद्य कपात योग्य महिन्यात जोडली जाते.",
  "जतन करताना app बंद करू नका."
];

export default function SaveProgress({ done = false }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (done) {
      setActiveIndex(STEPS.length - 1);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => Math.min(current + 1, STEPS.length - 2));
    }, 1200);

    return () => window.clearInterval(timer);
  }, [done]);

  const activeStep = STEPS[activeIndex] || STEPS[0];
  const progress = Math.round(((activeIndex + 1) / STEPS.length) * 100);
  const tip = useMemo(() => TIPS[activeIndex % TIPS.length], [activeIndex]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <section className="dashboard-panel w-full max-w-md rounded-[28px] border border-emerald-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 via-white to-sky-100 shadow-inner ring-1 ring-emerald-200">
            <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
            <span className="relative text-[30px]" aria-hidden="true">{activeStep.icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-black text-emerald-700">जतन प्रक्रिया चालू आहे</p>
                <h2 className="mt-1 text-[23px] font-black leading-tight text-slate-950">{activeStep.title}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[15px] font-black text-emerald-800 ring-1 ring-emerald-200">
                {toMarathiNumerals(progress)}%
              </span>
            </div>
            <p className="mt-2 text-[17px] font-bold leading-snug text-slate-700">{activeStep.text}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-sky-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[15px] font-bold leading-snug text-emerald-900">
          💡 {tip}
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className={`h-2 rounded-full transition-colors ${
                index <= activeIndex ? "bg-emerald-600" : "bg-slate-200"
              }`}
              aria-label={step.title}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
