"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import { applyAppearancePreferences } from "@/components/settings/AppearanceBoot";
import { useAuth } from "@/context/AuthContext";
import { safeGetLocalStorageItem, safeSetLocalStorageItem } from "@/lib/clientStorage";
import { normalizeUiLanguage } from "@/lib/uiLanguage";
import { useUiLanguage, useUiTranslation } from "@/lib/useUiLanguage";

const LANGUAGE_SELECTED_KEY = "majhi_dairy_language_selected";

const steps = [
  {
    emoji: "🐄",
    title: "स्वागत आहे!",
    titleEn: "Welcome!",
    text: "तुमची डेअरी यशस्वीरित्या नोंदवली गेली.",
    textEn: "Your dairy has been registered successfully."
  },
  {
    emoji: "📋",
    title: "पहिली गाय जोडा",
    titleEn: "Add Your First Cow",
    text: "तुमच्या गायींच्या नोंदी व्यवस्थित ठेवा.",
    textEn: "Keep your cow records organized."
  },
  {
    emoji: "🥛",
    title: "दूध नोंदी ठेवा",
    titleEn: "Record Milk",
    text: "रोज सकाळ-संध्याकाळ दूध नोंदवा.",
    textEn: "Record morning and evening milk every day."
  },
  {
    emoji: "🔔",
    title: "आठवणी मिळवा",
    titleEn: "Get Reminders",
    text: "रेतन, लसीकरण, व्यायण या सगळ्या आठवणी वेळेवर मिळतील.",
    textEn: "Get breeding, vaccination and calving reminders on time."
  }
];

export default function WelcomePage() {
  const router = useRouter();
  const { farm } = useAuth();
  const language = useUiLanguage();
  const t = useUiTranslation();
  const [step, setStep] = useState(0);
  const [needsLanguage, setNeedsLanguage] = useState(false);

  useEffect(() => {
    if (safeGetLocalStorageItem("onboarding_completed", "") === "true") {
      router.replace("/");
      return;
    }

    if (safeGetLocalStorageItem(LANGUAGE_SELECTED_KEY, "") === "true") {
      setNeedsLanguage(false);
    } else {
      setNeedsLanguage(true);
    }
  }, [router]);

  function chooseLanguage(nextLanguage) {
    const normalized = normalizeUiLanguage(nextLanguage);
    safeSetLocalStorageItem(LANGUAGE_SELECTED_KEY, "true");
    applyAppearancePreferences({ language: normalized });
    setNeedsLanguage(false);
  }

  function finish() {
    safeSetLocalStorageItem("onboarding_completed", "true");
    router.replace("/");
  }

  const current = steps[step];

  if (needsLanguage) {
    return (
      <div className="auth-screen -mx-4 -my-5 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-card w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-6 text-center shadow-2xl backdrop-blur-xl">
          <BrandLockup size="lg" center />
          <h1 className="mt-5 text-[30px] font-extrabold leading-tight text-slate-950">
            {t("भाषा निवडा", "Choose Language")}
          </h1>
          <p className="mt-3 text-[19px] font-bold leading-relaxed text-slate-700">
            {t("App सुरू करण्यापूर्वी तुमची भाषा निवडा.", "Choose your language before entering the app.")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { value: "mr", title: "मराठी", subtitle: "Marathi", icon: language === "en" ? "MR" : "अ" },
              { value: "en", title: "English", subtitle: "English", icon: "A" }
            ].map((option) => {
              const active = language === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => chooseLanguage(option.value)}
                  className={`min-h-[138px] rounded-2xl border-2 p-4 text-center shadow-sm transition active:scale-[0.98] ${
                    active ? "border-green-600 bg-green-600 text-white" : "border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-[26px] font-black ${
                    active ? "bg-white/20 text-white" : "bg-green-50 text-green-700"
                  }`}>
                    {option.icon}
                  </span>
                  <span className="mt-3 block text-[22px] font-black">{option.title}</span>
                  <span className={`mt-1 block text-[15px] font-bold ${active ? "text-white/85" : "text-slate-500"}`}>{option.subtitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen -mx-4 -my-5 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="auth-card w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-6 text-center shadow-2xl backdrop-blur-xl">
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
          {step === 0
            ? language === "en"
              ? `Welcome ${farm?.farmName || "Majhi Dairy"}!`
              : `स्वागत आहे ${farm?.farmName || "माझी डेअरी"}!`
            : language === "en"
              ? current.titleEn
              : current.title}
        </h1>
        <p className="mt-4 text-[21px] font-bold leading-relaxed text-slate-700">
          {language === "en" ? current.textEn : current.text}
        </p>

        {step === 1 ? (
          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => {
                safeSetLocalStorageItem("onboarding_completed", "true");
                router.replace("/gayi/navi");
              }}
              className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft"
            >
              {t("आत्ता जोडा", "Add Now")}
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[52px] rounded-lg border-2 border-slate-200 px-4 text-[19px] font-extrabold text-slate-700"
            >
              {t("नंतर करू", "Do Later")}
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
            {step === steps.length - 1 ? `${t("सुरू करा", "Start")} 🚀` : `${t("पुढे", "Next")} →`}
          </button>
        )}
      </div>
    </div>
  );
}
