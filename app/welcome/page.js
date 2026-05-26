"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import { useAuth } from "@/context/AuthContext";

const steps = [
  {
    emoji: "🐄",
    title: "स्वागत आहे!",
    text: "तुमची डेअरी यशस्वीरित्या नोंदवली गेली."
  },
  {
    emoji: "📋",
    title: "पहिली गाय जोडा",
    text: "तुमच्या गायींच्या नोंदी व्यवस्थित ठेवा."
  },
  {
    emoji: "🥛",
    title: "दूध नोंदी ठेवा",
    text: "रोज सकाळ-संध्याकाळ दूध नोंदवा."
  },
  {
    emoji: "🔔",
    title: "आठवणी मिळवा",
    text: "रेतन, लसीकरण, व्यायण या सगळ्या आठवणी वेळेवर मिळतील."
  }
];

export default function WelcomePage() {
  const router = useRouter();
  const { farm } = useAuth();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("onboarding_completed") === "true") {
      router.replace("/");
    }
  }, [router]);

  function finish() {
    localStorage.setItem("onboarding_completed", "true");
    router.replace("/");
  }

  const current = steps[step];

  return (
    <div className="-mx-4 -my-4 flex min-h-screen items-center justify-center bg-green-50 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-2xl">
        <div className="flex justify-center gap-2">
          {steps.map((item, index) => (
            <div
              key={item.title}
              className={`h-3 w-10 rounded-full ${index <= step ? "bg-sheti" : "bg-slate-200"}`}
            />
          ))}
        </div>

        {step === 0 ? (
          <BrandLockup size="lg" center className="mt-8" />
        ) : (
          <div className="mt-8 text-[72px] leading-none" aria-hidden="true">
            {current.emoji}
          </div>
        )}
        <h1 className="mt-5 text-[30px] font-extrabold leading-tight text-slate-950">
          {step === 0 ? `स्वागत आहे ${farm?.farmName || "माझी डेअरी"}!` : current.title}
        </h1>
        <p className="mt-4 text-[21px] font-bold leading-relaxed text-slate-700">
          {current.text}
        </p>

        {step === 1 ? (
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("onboarding_completed", "true");
                router.replace("/gayi/navi");
              }}
              className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft"
            >
              आत्ता जोडा
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[52px] rounded-lg border-2 border-slate-200 px-4 text-[19px] font-extrabold text-slate-700"
            >
              नंतर करू
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (step === steps.length - 1) {
                finish();
              } else {
                setStep((value) => value + 1);
              }
            }}
            className="mt-8 min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft"
          >
            {step === steps.length - 1 ? "सुरू करा 🚀" : "पुढे →"}
          </button>
        )}
      </div>
    </div>
  );
}
