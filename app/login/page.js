"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import { useAuth } from "@/context/AuthContext";
import { useUiTranslation } from "@/lib/useUiLanguage";

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithPin, isAuthenticated, isLoading } = useAuth();
  const t = useUiTranslation();
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMobile, setForgotMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const inputsRef = useRef([]);

  const redirectTo = searchParams.get("from") || "/";
  const locked = wrongAttempts >= 5;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  function updatePin(index, value) {
    const digit = onlyDigits(value).slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    setError("");

    if (digit && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    if (digit && index === 3 && next.every(Boolean)) {
      submitLogin(next.join(""));
    }
  }

  function handlePinKeyDown(index, event) {
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function submitLogin(pinValue = pin.join("")) {
    if (locked || loading) {
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError(t("१० अंकी योग्य मोबाइल नंबर लिहा.", "Enter a valid 10-digit mobile number."));
      return;
    }

    if (pinValue.length !== 4) {
      setError(t("४ अंकी PIN लिहा.", "Enter a 4-digit PIN."));
      return;
    }

    setLoading(true);
    setError("");
    const result = await loginWithPin(mobile, pinValue);
    setLoading(false);

    if (result.success) {
      router.replace(redirectTo);
      return;
    }

    setWrongAttempts((count) => count + 1);
    setError(result.error || t("खाते उघडले नाही.", "Could not open account."));
  }

  return (
    <div data-i18n-skip className="auth-screen -mx-4 -my-5 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="auth-card w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-5 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <BrandLockup size="lg" center />
          <p className="mt-2 text-[20px] font-bold text-slate-600">
            {t("मोबाइल नंबर आणि PIN टाका", "Enter mobile number and PIN")}
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-[20px] font-extrabold text-slate-900">
              {t("मोबाइल नंबर", "Mobile Number")}
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(event) => setMobile(onlyDigits(event.target.value).slice(0, 10))}
              placeholder={t("१० अंकी मोबाइल नंबर", "10 digit mobile number")}
              className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[22px] font-bold outline-none focus:border-sheti"
            />
          </label>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[20px] font-extrabold text-slate-900">
                {t("४ अंकी PIN", "4 Digit PIN")}
              </span>
              <button
                type="button"
                onClick={() => setShowPin((value) => !value)}
                className="min-h-[44px] rounded-lg px-3 text-[18px] font-extrabold text-sheti"
              >
                {showPin ? t("लपवा", "Hide") : t("दाखवा", "Show")}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputsRef.current[index] = element;
                  }}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updatePin(index, event.target.value)}
                  onKeyDown={(event) => handlePinKeyDown(index, event)}
                  className="h-[58px] rounded-lg border-2 border-slate-200 text-center text-[28px] font-extrabold outline-none focus:border-sheti"
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={loading || locked}
            onClick={() => submitLogin()}
            className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
          >
            {loading ? t("खाते उघडत आहे...", "Opening account...") : `${t("खाते उघडा", "Open Account")} →`}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-[18px] font-bold text-red-700">
            {locked ? t("५ चुकीचे प्रयत्न. कृपया मालकाशी संपर्क करा.", "5 wrong attempts. Please contact the owner.") : error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="mt-5 min-h-[48px] w-full text-center text-[18px] font-extrabold text-sheti"
        >
          {t("PIN विसरलात?", "Forgot PIN?")}
        </button>

        <div className="mt-4 rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center">
          <p className="text-[19px] font-extrabold text-slate-800">
            {t("नवीन डेअरी नोंदणी करायची आहे?", "Want to register a new dairy?")}
          </p>
          <Link
            href="/signup"
            className="mt-3 flex min-h-[52px] items-center justify-center rounded-lg border-2 border-green-300 bg-white px-4 text-[19px] font-extrabold text-sheti active:bg-green-100"
          >
            ➕ {t("नवीन नोंदणी करा", "New Signup")}
          </Link>
        </div>
      </div>

      {forgotOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border border-white/80 bg-white p-5 shadow-2xl">
            <h2 className="text-[24px] font-extrabold text-slate-950">
              {t("PIN विसरलात?", "Forgot PIN?")}
            </h2>
            <p className="mt-3 text-[18px] font-bold leading-relaxed text-slate-700">
              {t("मोबाइल नंबर टाका. उत्पादन आवृत्तीत नवीन PIN संदेशाने पाठवता येईल.", "Enter your mobile number. In production, a new PIN can be sent by message.")}
            </p>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={forgotMobile}
              onChange={(event) => setForgotMobile(onlyDigits(event.target.value).slice(0, 10))}
              placeholder={t("१० अंकी मोबाइल नंबर", "10 digit mobile number")}
              className="mt-4 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="min-h-[52px] rounded-lg border-2 border-slate-200 px-4 text-[18px] font-extrabold text-slate-700"
              >
                {t("बंद करा", "Close")}
              </button>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="min-h-[52px] rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white"
              >
                {t("समजले", "Understood")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-screen -mx-4 -my-5 flex min-h-screen items-center justify-center px-4 py-8">
          <div className="auth-card rounded-lg border border-white/80 bg-white/90 p-5 text-center shadow-2xl backdrop-blur-xl">
            <BrandLockup size="sm" center />
            <p className="mt-4 text-[20px] font-extrabold text-slate-800">खाते पान लोड होत आहे...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
