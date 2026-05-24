"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithPin } = useAuth();
  const [mode, setMode] = useState("pin");
  const [mobile, setMobile] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const inputsRef = useRef([]);

  const redirectTo = searchParams.get("from") || "/";
  const locked = wrongAttempts >= 5;

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
      submitPin(next.join(""));
    }
  }

  function handlePinKeyDown(index, event) {
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function submitPin(pinValue = pin.join("")) {
    if (locked || loading) {
      return;
    }

    if (mobile.length !== 10) {
      setError("१० अंकी मोबाइल नंबर लिहा.");
      return;
    }

    if (pinValue.length !== 4) {
      setError("४ अंकी PIN लिहा.");
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
    setError(result.error || "लॉगिन झाले नाही.");
  }

  async function submitPassword(event) {
    event.preventDefault();

    if (locked || loading) {
      return;
    }

    if (!identifier.trim() || !password.trim()) {
      setError("मोबाइल किंवा ईमेल आणि पासवर्ड लिहा.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result.success) {
      router.replace(redirectTo);
      return;
    }

    setWrongAttempts((count) => count + 1);
    setError(result.error || "लॉगिन झाले नाही.");
  }

  return (
    <div className="-mx-4 -my-4 flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-sheti to-green-500 px-4 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
        <div className="text-center">
          <div className="text-[64px] leading-none" aria-hidden="true">
            🐄
          </div>
          <h1 className="mt-3 text-[30px] font-extrabold leading-tight text-slate-950">
            गोशाळा व्यवस्थापन
          </h1>
          <p className="mt-2 text-[20px] font-bold text-slate-600">
            आपले खाते उघडा
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("pin");
              setError("");
            }}
            className={`min-h-[52px] rounded-lg text-[18px] font-extrabold ${
              mode === "pin" ? "bg-white text-sheti shadow-sm" : "text-slate-700"
            }`}
          >
            कामगार
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError("");
            }}
            className={`min-h-[52px] rounded-lg text-[18px] font-extrabold ${
              mode === "password" ? "bg-white text-sheti shadow-sm" : "text-slate-700"
            }`}
          >
            मालक
          </button>
        </div>

        {mode === "pin" ? (
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">
                मोबाइल नंबर
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(event) => setMobile(onlyDigits(event.target.value).slice(0, 10))}
                placeholder="१० अंकी मोबाइल नंबर"
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[22px] font-bold outline-none focus:border-sheti"
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[20px] font-extrabold text-slate-900">
                  ४ अंकी PIN
                </span>
                <button
                  type="button"
                  onClick={() => setShowPin((value) => !value)}
                  className="min-h-[44px] rounded-lg px-3 text-[18px] font-extrabold text-sheti"
                >
                  {showPin ? "लपवा" : "दाखवा"}
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
              onClick={() => submitPin()}
              className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
            >
              {loading ? "लॉगिन होत आहे..." : "पुढे →"}
            </button>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={submitPassword}>
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">
                मोबाइल किंवा ईमेल
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">
                पासवर्ड
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <button
              type="submit"
              disabled={loading || locked}
              className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
            >
              {loading ? "लॉगिन होत आहे..." : "लॉगिन करा"}
            </button>
          </form>
        )}

        {error ? (
          <div className="mt-5 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-[18px] font-bold text-red-700">
            {locked ? "५ चुकीचे प्रयत्न. कृपया मालकाशी संपर्क करा." : error}
          </div>
        ) : null}

        <p className="mt-6 text-center text-[18px] font-bold text-slate-600">
          PIN विसरलात? मालकाशी संपर्क करा.
        </p>
      </div>
    </div>
  );
}
