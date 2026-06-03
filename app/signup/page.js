"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import MarathiTextInput from "@/components/MarathiTextInput";
import { useAuth } from "@/context/AuthContext";
import {
  MAHARASHTRA_DISTRICTS,
  getAhilyanagarTalukas,
  getAhilyanagarVillages,
  isAhilyanagarDistrict
} from "@/lib/maharashtraLocations";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const weakPins = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "4321"
]);

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function PinBoxes({ label, value, onChange, show }) {
  const refs = useRef([]);

  function updateDigit(index, nextValue) {
    const digit = onlyDigits(nextValue).slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);

    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div>
      <p className="text-[20px] font-extrabold text-slate-900">{label}</p>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {value.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type={show ? "text" : "password"}
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className="h-[58px] rounded-lg border-2 border-slate-200 text-center text-[28px] font-extrabold outline-none focus:border-sheti"
          />
        ))}
      </div>
    </div>
  );
}

function Progress({ step }) {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className={`h-3 w-12 rounded-full ${item <= step ? "bg-sheti" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [form, setForm] = useState({
    mobile: "",
    farmName: "",
    ownerName: "",
    villageName: "",
    talukaName: "",
    districtName: "पुणे",
    totalCows: ""
  });

  const pinValue = pin.join("");
  const confirmPinValue = confirmPin.join("");

  const title = useMemo(() => {
    if (success) {
      return "नोंदणी यशस्वी";
    }

    return ["मोबाइल नंबर", "डेअरी माहिती", "PIN तयार करा"][step - 1] || "नोंदणी";
  }, [step, success]);
  const isAhilyanagarSelected = isAhilyanagarDistrict(form.districtName);
  const talukaOptions = useMemo(
    () => (isAhilyanagarSelected ? getAhilyanagarTalukas() : []),
    [isAhilyanagarSelected]
  );
  const villageOptions = useMemo(
    () => (isAhilyanagarSelected ? getAhilyanagarVillages(form.talukaName) : []),
    [isAhilyanagarSelected, form.talukaName]
  );

  useEffect(() => {
    if (success) {
      const timeout = window.setTimeout(() => router.replace("/welcome"), 3000);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [router, success]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
    setError("");
  }

  function updateDistrict(value) {
    setForm((current) => {
      const nextIsAhilyanagar = isAhilyanagarDistrict(value);
      const currentTalukaValid = getAhilyanagarTalukas().includes(current.talukaName);

      return {
        ...current,
        districtName: value,
        talukaName: nextIsAhilyanagar && !currentTalukaValid ? "" : current.talukaName,
        villageName: nextIsAhilyanagar ? "" : current.villageName
      };
    });
    setError("");
  }

  function updateTaluka(value) {
    setForm((current) => ({
      ...current,
      talukaName: value,
      villageName: isAhilyanagarDistrict(current.districtName) ? "" : current.villageName
    }));
    setError("");
  }

  async function checkMobile() {
    const mobile = form.mobile;

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError("६ ते ९ ने सुरू होणारा १० अंकी मोबाइल नंबर लिहा.");
      return false;
    }

    setChecking(true);
    setError("");

    try {
      const response = await fetch("/api/auth/check-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.available) {
        setError("हा मोबाइल नंबर आधीच नोंदणीकृत आहे. कृपया लॉगिन करा किंवा वेगळा नंबर वापरा.");
        return false;
      }

      return true;
    } catch {
      setError("मोबाइल नंबर तपासताना त्रुटी. पुन्हा प्रयत्न करा.");
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function goFromMobile() {
    if (await checkMobile()) {
      setStep(2);
    }
  }

  function goFromFarmInfo() {
    if (form.farmName.trim().length < 2) {
      setError("डेअरीचे नाव लिहा.");
      return;
    }

    if (form.ownerName.trim().length < 2) {
      setError("मालकाचे नाव लिहा.");
      return;
    }

    if (!form.districtName) {
      setError("जिल्ह्याचे नाव निवडा.");
      return;
    }

    setError("");
    setStep(3);
  }

  async function completeSignup() {
    if (pinValue.length !== 4 || confirmPinValue.length !== 4) {
      setError("दोन्ही ठिकाणी ४ अंकी PIN लिहा.");
      return;
    }

    if (pinValue !== confirmPinValue) {
      setError("दोन्ही PIN सारखे नाहीत.");
      return;
    }

    if (weakPins.has(pinValue)) {
      setError("हा PIN खूप सोपा आहे. कठीण PIN निवडा.");
      return;
    }

    setSaving(true);
    setError("");

    const result = await signup({
      ...form,
      pin: pinValue,
      totalCows: Number(form.totalCows || 0)
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error || "नोंदणी करताना त्रुटी. पुन्हा प्रयत्न करा.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="auth-screen -mx-4 -my-5 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="auth-card w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-[54px]">
            ✅
          </div>
          <h1 className="mt-5 text-[30px] font-extrabold text-green-800">
            🎉 नोंदणी यशस्वी!
          </h1>
          <p className="mt-3 text-[21px] font-bold leading-relaxed text-slate-800">
            तुमची डेअरी {form.farmName} नोंदवली गेली.
          </p>
          <p className="mt-2 text-[20px] font-extrabold text-slate-700">
            मोबाइल: {toMarathiNumerals(form.mobile)}
          </p>
          <button
            type="button"
            onClick={() => router.replace("/welcome")}
            className="mt-6 min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft active:bg-green-700"
          >
            सुरू करा 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen -mx-4 -my-5 min-h-screen px-4 py-8">
      <div className="auth-card mx-auto w-full max-w-md rounded-lg border border-white/80 bg-white/90 p-5 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <BrandLockup size="lg" center />
          <h1 className="mt-4 text-[27px] font-extrabold leading-tight text-slate-950">
            नवीन डेअरी नोंदणी
          </h1>
          <p className="mt-2 text-[20px] font-bold text-slate-600">
            आपल्या डेअरीचे व्यवस्थापन सुरू करा
          </p>
        </div>

        <div className="mt-6">
          <Progress step={step} />
          <h2 className="mt-5 text-center text-[24px] font-extrabold text-slate-950">
            {title}
          </h2>
        </div>

        {error ? (
          <div className="mt-5 rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-[18px] font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">
                मोबाइल नंबर *
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.mobile}
                onBlur={() => {
                  if (form.mobile.length === 10) {
                    checkMobile();
                  }
                }}
                onChange={(event) => updateField("mobile", onlyDigits(event.target.value).slice(0, 10))}
                placeholder="१० अंकी मोबाइल नंबर"
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[22px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <button
              type="button"
              disabled={checking}
              onClick={goFromMobile}
              className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
            >
              {checking ? "तपासत आहे..." : "पुढे →"}
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">डेअरीचे नाव *</span>
              <MarathiTextInput
                value={form.farmName}
                onValueChange={(value) => updateField("farmName", value)}
                placeholder="उदा. श्री गणेश डेअरी"
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">मालकाचे नाव *</span>
              <MarathiTextInput
                value={form.ownerName}
                onValueChange={(value) => updateField("ownerName", value)}
                placeholder="तुमचे पूर्ण नाव"
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">जिल्ह्याचे नाव *</span>
              <select
                value={form.districtName}
                onChange={(event) => updateDistrict(event.target.value)}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-bold outline-none focus:border-sheti"
              >
                {MAHARASHTRA_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district === "अहमदनगर" ? "अहमदनगर (जुने नाव)" : district}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[20px] font-extrabold text-slate-900">तालुक्याचे नाव</span>
                {isAhilyanagarSelected ? (
                  <select
                    value={form.talukaName}
                    onChange={(event) => updateTaluka(event.target.value)}
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-bold outline-none focus:border-sheti"
                  >
                    <option value="">तालुका निवडा</option>
                    {form.talukaName && !talukaOptions.includes(form.talukaName) ? (
                      <option value={form.talukaName}>{form.talukaName}</option>
                    ) : null}
                    {talukaOptions.map((taluka) => (
                      <option key={taluka} value={taluka}>{taluka}</option>
                    ))}
                  </select>
                ) : (
                  <MarathiTextInput
                    value={form.talukaName}
                    onValueChange={(value) => updateField("talukaName", value)}
                    placeholder="उदा. खेड"
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
                  />
                )}
              </label>
              <label className="block">
                <span className="text-[20px] font-extrabold text-slate-900">गावाचे नाव</span>
                {isAhilyanagarSelected ? (
                  <select
                    value={form.villageName}
                    onChange={(event) => updateField("villageName", event.target.value)}
                    disabled={!form.talukaName}
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-bold outline-none focus:border-sheti disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">{form.talukaName ? "गाव निवडा" : "आधी तालुका निवडा"}</option>
                    {form.villageName && !villageOptions.includes(form.villageName) ? (
                      <option value={form.villageName}>{form.villageName}</option>
                    ) : null}
                    {villageOptions.map((village) => (
                      <option key={village} value={village}>{village}</option>
                    ))}
                  </select>
                ) : (
                  <MarathiTextInput
                    value={form.villageName}
                    onValueChange={(value) => updateField("villageName", value)}
                    placeholder="उदा. शिरूर"
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
                  />
                )}
              </label>
            </div>
            {isAhilyanagarSelected ? (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[16px] font-bold leading-snug text-green-800">
                अहिल्यानगर जिल्ह्यासाठी official १४ तालुके आणि १६०२ गावांची dropdown यादी वापरली आहे.
              </p>
            ) : null}
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">एकूण गायी</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={form.totalCows}
                onChange={(event) => updateField("totalCows", event.target.value)}
                placeholder="०"
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
              />
              <span className="mt-2 block text-[18px] font-bold text-slate-500">
                सध्या तुमच्याकडे किती गायी आहेत?
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[56px] rounded-lg border-2 border-slate-200 px-4 text-[20px] font-extrabold text-slate-700"
              >
                ← मागे
              </button>
              <button
                type="button"
                onClick={goFromFarmInfo}
                className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft active:bg-green-700"
              >
                पुढे →
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 space-y-5">
            <p className="rounded-lg bg-yellow-50 p-4 text-[19px] font-bold leading-relaxed text-yellow-900">
              तुमच्या खात्यासाठी ४ अंकी PIN निवडा. हा PIN लॉगिन करताना लागेल, सुरक्षित ठेवा.
            </p>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPin((value) => !value)}
                className="min-h-[44px] rounded-lg px-3 text-[18px] font-extrabold text-sheti"
              >
                {showPin ? "PIN लपवा" : "PIN दाखवा"}
              </button>
            </div>
            <PinBoxes label="नवीन PIN" value={pin} onChange={setPin} show={showPin} />
            <PinBoxes label="PIN पुन्हा टाका" value={confirmPin} onChange={setConfirmPin} show={showPin} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[56px] rounded-lg border-2 border-slate-200 px-4 text-[20px] font-extrabold text-slate-700"
              >
                ← मागे
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={completeSignup}
                className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
              >
                {saving ? "खाते तयार करत आहे..." : "नोंदणी पूर्ण करा ✅"}
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 min-h-[52px] w-full rounded-lg border-2 border-green-200 bg-green-50 px-4 text-[19px] font-extrabold text-sheti active:bg-green-100"
        >
          आधीच खाते आहे? लॉगिन करा
        </button>
      </div>
    </div>
  );
}
