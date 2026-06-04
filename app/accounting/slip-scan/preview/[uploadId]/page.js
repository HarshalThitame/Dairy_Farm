"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import AIReadingProgress from "@/components/slip-scan/AIReadingProgress";
import ExtractionForm from "@/components/slip-scan/ExtractionForm";
import SaveProgress from "@/components/slip-scan/SaveProgress";
import { showToast } from "@/components/Toast";
import { GAP_FILLING_MESSAGES } from "@/lib/marathiLabels";
import { toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";
import { extractSlipUpload, saveSlipScanRecord } from "@/lib/offlineActions";

function gapMethodLabel(method) {
  return GAP_FILLING_MESSAGES[`method_${method}`] || method || "AI विश्लेषण";
}

function gapFieldLabel(field) {
  const text = String(field || "");

  if (text.includes("daily_entries") && text.includes("amount")) return "दैनिक रक्कम";
  if (text.includes("daily_entries") && text.includes("fat")) return "दैनिक फॅट";
  if (text.includes("daily_entries") && text.includes("snf")) return "दैनिक SNF";
  if (text === "total_milk_income") return "एकूण उत्पन्न";
  if (text === "total_liters") return "एकूण दूध";
  if (text === "morning_total_liters") return "सकाळचे एकूण दूध";
  if (text === "evening_total_liters") return "संध्याकाळचे एकूण दूध";
  if (text === "net_payable") return "शुद्ध देय";
  if (text === "period_end") return "पीरियड शेवट";
  if (text === "daily_entries") return "दैनिक तक्ता";
  if (text === "total_amount") return "एकूण रक्कम";

  return text;
}

function formatGapValue(value) {
  if (typeof value === "number") {
    return Math.abs(value) >= 100 ? toMarathiCurrency(value) : String(value);
  }

  return String(value ?? "-");
}

function confidencePercent(value) {
  const raw = Number(value || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.round(raw > 1 ? raw : raw * 100);
}

function slipTypeLabel(type) {
  return type === "settlement" ? "१५ दिवसांचे देयक" : "दूध स्लिप";
}

function PreviewMetric({ label, value, tone = "slate" }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    yellow: "border-amber-200 bg-amber-50 text-amber-900",
    slate: "border-white/20 bg-white/12 text-white"
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-[13px] font-black uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 text-[20px] font-black leading-tight">{value}</p>
    </div>
  );
}

export default function SlipScanPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const uploadId = params.uploadId;
  const redirectTimerRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveResult, setSaveResult] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [filledData, setFilledData] = useState(null);
  const [gapsFilled, setGapsFilled] = useState([]);
  const [useFilledData, setUseFilledData] = useState(false);

  const loadExtraction = useCallback(async ({ force = false } = {}) => {
    setLoading(true);
    setError("");
    setSaveResult(null);
    setOriginalData(null);
    setFilledData(null);
    setGapsFilled([]);
    setUseFilledData(false);

    try {
      const result = await extractSlipUpload(uploadId, { force });
      setData(result.data);
      setOriginalData(result.data?.originalData || result.data?.extractedData || null);
      setFilledData(result.data?.filledData || null);
      setGapsFilled(result.data?.gaps_filled || []);
      if (force) {
        showToast("✅ AI ने स्लिप पुन्हा वाचली. आकडे तपासा.", "success", 2500);
      }
    } catch (extractError) {
      setError(extractError.message || "स्लिप नीट वाचता आली नाही.");
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    loadExtraction();
  }, [loadExtraction]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  async function handleSave(payload) {
    setSaving(true);
    setError("");

    try {
      const result = await saveSlipScanRecord({
        uploadId,
        ...payload
      });
      setSaveResult(result.data);
      showToast("✅ स्लिप नोंद जतन झाली. मुख्यपृष्ठावर जात आहे...", "success", 2500);

      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }

      redirectTimerRef.current = window.setTimeout(() => {
        router.replace("/");
      }, 1100);
    } catch (saveError) {
      setError(saveError.message || "डेटा जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  const dataToUse = useFilledData && filledData ? filledData : originalData || data?.extractedData;
  const activeConfidence = confidencePercent(
    dataToUse?.confidence_after_filling || dataToUse?.confidence_score || data?.confidence_score || data?.upload?.ai_confidence
  );

  return (
    <div className="space-y-5 pb-28">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-sky-900 p-5 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-emerald-300/20" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <Link href="/accounting/slip-scan" className="inline-flex min-h-[38px] items-center rounded-full bg-white/12 px-3 text-[14px] font-black text-emerald-50 backdrop-blur active:bg-white/20">
              ← स्कॅन पेज
            </Link>
            <span className="rounded-full bg-white/12 px-3 py-1 text-[13px] font-black text-emerald-50 backdrop-blur">
              Auto-save बंद
            </span>
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-black text-emerald-200">AI review screen</p>
              <h1 className="mt-2 text-[34px] font-black leading-tight">माहिती तपासा</h1>
              <p className="mt-2 max-w-2xl text-[17px] font-bold leading-snug text-emerald-50">
                AI ने वाचलेली माहिती खाली editable आहे. तुम्ही तपासल्याशिवाय database मध्ये जतन होत नाही.
              </p>
            </div>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-[34px] shadow-sm backdrop-blur" aria-hidden="true">
              ✅
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <PreviewMetric label="प्रकार" value={slipTypeLabel(dataToUse?.slip_type)} />
            <PreviewMetric label="AI विश्वास" value={activeConfidence ? `${toMarathiNumerals(activeConfidence)}%` : "तपासा"} />
            <PreviewMetric label="स्थिती" value={loading ? "वाचत आहे" : dataToUse ? "तयार" : "तपासा"} />
          </div>
        </div>
      </section>

      {loading ? (
        <AIReadingProgress
          stage="reading"
          message="OCR मजकूर, AI extraction आणि हिशोब validation चालू आहे..."
          autoAdvance
        />
      ) : null}
      {error ? (
        <ErrorState
          message={error}
          onRetry={loadExtraction}
        />
      ) : null}

      {saving || saveResult ? <SaveProgress done={Boolean(saveResult)} /> : null}

      {!loading && data?.imageUrl ? (
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="p-4 pb-0">
              <p className="text-[14px] font-black uppercase tracking-wide text-sky-700">Original image</p>
              <h2 className="mt-1 text-[24px] font-black text-slate-950">स्लिप फोटो</h2>
              <p className="mt-1 text-[15px] font-bold text-slate-600">फोटो मोठा करून आकडे स्वतः जुळवा.</p>
            </div>
            <button
              type="button"
              onClick={() => loadExtraction({ force: true })}
              className="mx-4 mt-4 min-h-[48px] rounded-2xl border border-sky-200 bg-sky-50 px-4 text-[16px] font-black text-sky-900 shadow-sm active:bg-sky-100"
            >
              🤖 AI पुन्हा वाचा
            </button>
          </div>
          <div className="m-4 max-h-[420px] overflow-auto rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50">
            <img src={data.imageUrl} alt="स्लिप फोटो" className="w-full object-contain" />
          </div>
        </section>
      ) : null}

      {!loading && gapsFilled.length > 0 ? (
        <section className="rounded-[26px] border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 text-amber-950 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-black uppercase tracking-wide text-amber-700">AI gap filling</p>
              <h2 className="mt-1 text-[24px] font-black">{GAP_FILLING_MESSAGES.gaps_detected}</h2>
              <p className="mt-1 text-[17px] font-bold leading-snug">
                {gapsFilled.length} फील्ड {GAP_FILLING_MESSAGES.ai_filled}. स्वीकार करण्यापूर्वी आकडे तपासा.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[15px] font-black text-amber-900 shadow-sm">
              {useFilledData ? "AI डेटा" : "मूळ डेटा"}
            </span>
          </div>

          <div className="mt-4 max-h-60 space-y-2 overflow-auto rounded-[20px] border border-amber-200 bg-white p-3">
            {gapsFilled.map((gap, index) => (
              <div key={`${gap.field}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50/45 p-3 text-[16px] font-bold">
                <div className="flex justify-between gap-3">
                  <span className="font-black text-amber-950">{gapFieldLabel(gap.field)}</span>
                  <span className="text-right text-amber-900">{formatGapValue(gap.filled_value)}</span>
                </div>
                <p className="mt-1 text-[14px] text-amber-800">
                  पद्धत: {gapMethodLabel(gap.method)}
                  {gap.confidence ? ` · विश्वास ${toMarathiNumerals(Math.round(Number(gap.confidence) * 100))}%` : ""}
                </p>
                {gap.formula ? <p className="mt-1 text-[14px] text-slate-600">सूत्र: {gap.formula}</p> : null}
                {gap.note ? <p className="mt-1 text-[14px] text-slate-600">{gap.note}</p> : null}
                {gap.warning ? <p className="mt-1 text-[14px] font-extrabold text-red-700">{gap.warning}</p> : null}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[15px] font-extrabold">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3 text-sky-900">
              <p>मूळ विश्वास</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(confidencePercent(originalData?.confidence_score || data?.confidence_score))}%</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-900">
              <p>भरल्यानंतर</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(confidencePercent(filledData?.confidence_after_filling || filledData?.confidence_score))}%</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUseFilledData(true)}
              className={`min-h-[54px] rounded-2xl px-3 text-[17px] font-black transition active:scale-[0.99] ${
                useFilledData ? "bg-emerald-600 text-white shadow-sm" : "border border-emerald-200 bg-white text-emerald-800"
              }`}
            >
              {GAP_FILLING_MESSAGES.accept_filled}
            </button>
            <button
              type="button"
              onClick={() => setUseFilledData(false)}
              className={`min-h-[54px] rounded-2xl px-3 text-[17px] font-black transition active:scale-[0.99] ${
                !useFilledData ? "bg-slate-800 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              {GAP_FILLING_MESSAGES.use_original}
            </button>
          </div>
        </section>
      ) : null}

      {!loading && dataToUse ? (
        <ExtractionForm
          key={`${useFilledData ? "filled" : "original"}-${uploadId}`}
          extractedData={dataToUse}
          upload={data.upload}
          onSave={handleSave}
          onRetry={() => window.location.assign("/accounting/slip-scan/camera")}
          saving={saving || Boolean(saveResult)}
        />
      ) : null}

      {!loading && !dataToUse && !error ? (
        <section className="rounded-[26px] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 text-amber-900 shadow-soft">
          <p className="text-[22px] font-black">AI ला स्लिप वाचता आली नाही.</p>
          <p className="mt-2 text-[16px] font-bold text-amber-800">फोटो पुन्हा घ्या किंवा स्वतः दूध नोंद करा.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/accounting/slip-scan/camera" className="flex min-h-[56px] items-center justify-center rounded-2xl bg-emerald-600 px-4 text-[18px] font-black text-white shadow-sm">
              पुन्हा घ्या
            </Link>
            <Link href="/nondi/dudh?date=today" className="flex min-h-[56px] items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 text-[18px] font-black text-amber-900 shadow-sm">
              स्वतः नोंद करा
            </Link>
          </div>
        </section>
      ) : null}

      {saveResult ? (
        <section className="rounded-[26px] border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-green-50 p-5 text-emerald-900 shadow-soft">
          <p className="text-[22px] font-black">✅ {saveResult.message || "डेटा जतन झाली!"}</p>
          <p className="mt-2 text-[18px] font-bold">मुख्यपृष्ठावर जात आहे...</p>
        </section>
      ) : null}
    </div>
  );
}
