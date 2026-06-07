"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import MarathiTextInput from "@/components/MarathiTextInput";
import { applyAppearancePreferences } from "@/components/settings/AppearanceBoot";
import { useAuth } from "@/context/AuthContext";
import { safeSetLocalStorageItem } from "@/lib/clientStorage";
import {
  MAHARASHTRA_DISTRICTS,
  getAhilyanagarTalukas,
  getAhilyanagarVillages,
  isAhilyanagarDistrict
} from "@/lib/maharashtraLocations";
import { toMarathiNumerals } from "@/lib/marathiUtils";
import { normalizeUiLanguage } from "@/lib/uiLanguage";
import { useUiLanguage, useUiTranslation } from "@/lib/useUiLanguage";

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

const LANGUAGE_SELECTED_KEY = "majhi_dairy_language_selected";

function Progress({ step, total = 4 }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }, (_, index) => index + 1).map((item) => (
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
  const language = useUiLanguage();
  const t = useUiTranslation();
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState("");
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
      return t("नोंदणी यशस्वी", "Signup Successful");
    }

    return [
      t("भाषा निवडा", "Choose Language"),
      t("मोबाइल नंबर", "Mobile Number"),
      t("डेअरी माहिती", "Dairy Information"),
      t("PIN तयार करा", "Create PIN")
    ][step - 1] || t("नोंदणी", "Signup");
  }, [step, success, t]);
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

  function chooseLanguage(nextLanguage) {
    const normalized = normalizeUiLanguage(nextLanguage);
    setSelectedLanguage(normalized);
    safeSetLocalStorageItem(LANGUAGE_SELECTED_KEY, "true");
    applyAppearancePreferences({ language: normalized });
    setError("");
  }

  function goFromLanguage() {
    if (!selectedLanguage) {
      setError(t("कृपया भाषा निवडा.", "Please select a language."));
      return;
    }
    setError("");
    setStep(2);
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
      setError(t("६ ते ९ ने सुरू होणारा १० अंकी मोबाइल नंबर लिहा.", "Enter a valid 10-digit mobile number starting with 6 to 9."));
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
        setError(t("हा मोबाइल नंबर आधीच नोंदणीकृत आहे. कृपया लॉगिन करा किंवा वेगळा नंबर वापरा.", "This mobile number is already registered. Please login or use another number."));
        return false;
      }

      return true;
    } catch {
      setError(t("मोबाइल नंबर तपासताना त्रुटी. पुन्हा प्रयत्न करा.", "Could not verify mobile number. Please try again."));
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function goFromMobile() {
    if (await checkMobile()) {
      setStep(3);
    }
  }

  function goFromFarmInfo() {
    if (form.farmName.trim().length < 2) {
      setError(t("डेअरीचे नाव लिहा.", "Enter dairy name."));
      return;
    }

    if (form.ownerName.trim().length < 2) {
      setError(t("मालकाचे नाव लिहा.", "Enter owner name."));
      return;
    }

    if (!form.districtName) {
      setError(t("जिल्ह्याचे नाव निवडा.", "Select district name."));
      return;
    }

    setError("");
    setStep(4);
  }

  async function completeSignup() {
    if (pinValue.length !== 4 || confirmPinValue.length !== 4) {
      setError(t("दोन्ही ठिकाणी ४ अंकी PIN लिहा.", "Enter a 4-digit PIN in both fields."));
      return;
    }

    if (pinValue !== confirmPinValue) {
      setError(t("दोन्ही PIN सारखे नाहीत.", "Both PINs do not match."));
      return;
    }

    if (weakPins.has(pinValue)) {
      setError(t("हा PIN खूप सोपा आहे. कठीण PIN निवडा.", "This PIN is too easy. Choose a stronger PIN."));
      return;
    }

    setSaving(true);
    setError("");

    const result = await signup({
      ...form,
      pin: pinValue,
      totalCows: Number(form.totalCows || 0),
      language: selectedLanguage || language || "mr"
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error || t("नोंदणी करताना त्रुटी. पुन्हा प्रयत्न करा.", "Signup failed. Please try again."));
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
            🎉 {t("नोंदणी यशस्वी!", "Signup Successful!")}
          </h1>
          <p className="mt-3 text-[21px] font-bold leading-relaxed text-slate-800">
            {language === "en" ? `Your dairy ${form.farmName} has been registered.` : `तुमची डेअरी ${form.farmName} नोंदवली गेली.`}
          </p>
          <p className="mt-2 text-[20px] font-extrabold text-slate-700">
            {t("मोबाइल", "Mobile")}: {language === "en" ? form.mobile : toMarathiNumerals(form.mobile)}
          </p>
          <button
            type="button"
            onClick={() => router.replace("/welcome")}
            className="mt-6 min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft active:bg-green-700"
          >
            {t("सुरू करा", "Start")} 🚀
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
            {t("नवीन डेअरी नोंदणी", "New Dairy Signup")}
          </h1>
          <p className="mt-2 text-[20px] font-bold text-slate-600">
            {t("आपल्या डेअरीचे व्यवस्थापन सुरू करा", "Start managing your dairy")}
          </p>
        </div>

        <div className="mt-6">
          <Progress step={step} total={4} />
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
            <div className="rounded-2xl border border-green-100 bg-green-50/80 p-4 text-left">
              <p className="text-[18px] font-black text-green-900">
                {t("तुम्हाला app कोणत्या भाषेत वापरायचे आहे?", "Which language do you want to use in the app?")}
              </p>
              <p className="mt-1 text-[16px] font-bold leading-relaxed text-green-800">
                {t("ही भाषा पुढील सर्व स्क्रीन, सूचना आणि अहवालांसाठी वापरली जाईल.", "This language will be used for all screens, notifications and reports.")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "mr", title: "मराठी", subtitle: "Marathi", icon: language === "en" ? "MR" : "अ" },
                { value: "en", title: "English", subtitle: "English", icon: "A" }
              ].map((option) => {
                const active = selectedLanguage === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => chooseLanguage(option.value)}
                    aria-pressed={active}
                    className={`min-h-[142px] rounded-2xl border-2 p-4 text-center shadow-sm transition active:scale-[0.98] ${
                      active
                        ? "border-green-600 bg-green-600 text-white shadow-green-200"
                        : "border-slate-200 bg-white text-slate-900"
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

            <button
              type="button"
              disabled={!selectedLanguage}
              onClick={goFromLanguage}
              className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
            >
              {t("पुढे", "Continue")} →
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">
                {t("मोबाइल नंबर", "Mobile Number")} *
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.mobile}
                onBlur={(event) => {
                  if (event.relatedTarget?.dataset?.signupNext === "true") {
                    return;
                  }

                  if (form.mobile.length === 10) {
                    checkMobile();
                  }
                }}
                onChange={(event) => updateField("mobile", onlyDigits(event.target.value).slice(0, 10))}
                placeholder={t("१० अंकी मोबाइल नंबर", "10 digit mobile number")}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[22px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <button
              type="button"
              data-signup-next="true"
              disabled={checking}
              onClick={goFromMobile}
              className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
            >
              {checking ? t("तपासत आहे...", "Checking...") : `${t("पुढे", "Next")} →`}
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">{t("डेअरीचे नाव", "Dairy Name")} *</span>
              <MarathiTextInput
                value={form.farmName}
                onValueChange={(value) => updateField("farmName", value)}
                placeholder={t("उदा. श्री गणेश डेअरी", "e.g. Shri Ganesh Dairy")}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">{t("मालकाचे नाव", "Owner Name")} *</span>
              <MarathiTextInput
                value={form.ownerName}
                onValueChange={(value) => updateField("ownerName", value)}
                placeholder={t("तुमचे पूर्ण नाव", "Your full name")}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">{t("जिल्ह्याचे नाव", "District Name")} *</span>
              <select
                value={form.districtName}
                onChange={(event) => updateDistrict(event.target.value)}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-bold outline-none focus:border-sheti"
              >
                {MAHARASHTRA_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district === "अहमदनगर" ? t("अहमदनगर (जुने नाव)", "Ahmednagar (old name)") : district}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[20px] font-extrabold text-slate-900">{t("तालुक्याचे नाव", "Taluka Name")}</span>
                {isAhilyanagarSelected ? (
                  <select
                    value={form.talukaName}
                    onChange={(event) => updateTaluka(event.target.value)}
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-bold outline-none focus:border-sheti"
                  >
                    <option value="">{t("तालुका निवडा", "Select taluka")}</option>
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
                    placeholder={t("उदा. खेड", "e.g. Khed")}
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
                  />
                )}
              </label>
              <label className="block">
                <span className="text-[20px] font-extrabold text-slate-900">{t("गावाचे नाव", "Village Name")}</span>
                {isAhilyanagarSelected ? (
                  <select
                    value={form.villageName}
                    onChange={(event) => updateField("villageName", event.target.value)}
                    disabled={!form.talukaName}
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-bold outline-none focus:border-sheti disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">{form.talukaName ? t("गाव निवडा", "Select village") : t("आधी तालुका निवडा", "Select taluka first")}</option>
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
                    placeholder={t("उदा. शिरूर", "e.g. Shirur")}
                    className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[20px] font-bold outline-none focus:border-sheti"
                  />
                )}
              </label>
            </div>
            {isAhilyanagarSelected ? (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[16px] font-bold leading-snug text-green-800">
                {t("अहिल्यानगर जिल्ह्यासाठी official १४ तालुके आणि १६०२ गावांची dropdown यादी वापरली आहे.", "For Ahilyanagar district, the official dropdown list of 14 talukas and 1602 villages is used.")}
              </p>
            ) : null}
            <label className="block">
              <span className="text-[20px] font-extrabold text-slate-900">{t("एकूण गायी", "Total Cows")}</span>
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
                {t("सध्या तुमच्याकडे किती गायी आहेत?", "How many cows do you currently have?")}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[56px] rounded-lg border-2 border-slate-200 px-4 text-[20px] font-extrabold text-slate-700"
              >
                ← {t("मागे", "Back")}
              </button>
              <button
                type="button"
                onClick={goFromFarmInfo}
                className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft active:bg-green-700"
              >
                {t("पुढे", "Next")} →
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6 space-y-5">
            <p className="rounded-lg bg-yellow-50 p-4 text-[19px] font-bold leading-relaxed text-yellow-900">
              {t("तुमच्या खात्यासाठी ४ अंकी PIN निवडा. हा PIN लॉगिन करताना लागेल, सुरक्षित ठेवा.", "Choose a 4-digit PIN for your account. You will need this PIN for login, so keep it safe.")}
            </p>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPin((value) => !value)}
                className="min-h-[44px] rounded-lg px-3 text-[18px] font-extrabold text-sheti"
              >
                {showPin ? t("PIN लपवा", "Hide PIN") : t("PIN दाखवा", "Show PIN")}
              </button>
            </div>
            <PinBoxes label={t("नवीन PIN", "New PIN")} value={pin} onChange={setPin} show={showPin} />
            <PinBoxes label={t("PIN पुन्हा टाका", "Enter PIN Again")} value={confirmPin} onChange={setConfirmPin} show={showPin} />
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="min-h-[56px] rounded-lg border-2 border-slate-200 px-4 text-[20px] font-extrabold text-slate-700"
              >
                ← {t("मागे", "Back")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={completeSignup}
                className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
              >
                {saving ? t("खाते तयार करत आहे...", "Creating account...") : `${t("नोंदणी पूर्ण करा", "Complete Signup")} ✅`}
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 min-h-[52px] w-full rounded-lg border-2 border-green-200 bg-green-50 px-4 text-[19px] font-extrabold text-sheti active:bg-green-100"
        >
          {t("आधीच खाते आहे? लॉगिन करा", "Already have an account? Login")}
        </button>
      </div>
    </div>
  );
}
