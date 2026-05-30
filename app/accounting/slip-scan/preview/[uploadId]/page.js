"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import ExtractionForm from "@/components/slip-scan/ExtractionForm";
import { showToast } from "@/components/Toast";
import { GAP_FILLING_MESSAGES } from "@/lib/marathiLabels";
import { toMarathiCurrency } from "@/lib/marathiUtils";
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

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="✅ AI ने माहिती वाचली आहे" subtitle="कृपया तपासा आणि मगच जतन करा" />

      {loading ? <LoadingState text="AI स्लिप वाचत आहे..." /> : null}
      {error ? (
        <ErrorState
          message={error}
          onRetry={loadExtraction}
        />
      ) : null}

      {!loading && data?.imageUrl ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[22px] font-extrabold text-slate-950">स्लिप फोटो</h2>
            <button
              type="button"
              onClick={() => loadExtraction({ force: true })}
              className="min-h-[46px] rounded-lg border-2 border-blue-200 bg-blue-50 px-3 text-[16px] font-extrabold text-blue-800 active:bg-blue-100"
            >
              🤖 AI पुन्हा वाचा
            </button>
          </div>
          <div className="mt-3 max-h-[360px] overflow-auto rounded-lg border border-slate-200 bg-slate-100">
            <img src={data.imageUrl} alt="स्लिप फोटो" className="w-full object-contain" />
          </div>
        </section>
      ) : null}

      {!loading && gapsFilled.length > 0 ? (
        <section className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 text-yellow-950 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-extrabold">{GAP_FILLING_MESSAGES.gaps_detected}</h2>
              <p className="mt-1 text-[17px] font-bold leading-snug">
                {gapsFilled.length} फील्ड {GAP_FILLING_MESSAGES.ai_filled}. स्वीकार करण्यापूर्वी आकडे तपासा.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[16px] font-extrabold text-yellow-900">
              {useFilledData ? "AI डेटा" : "मूळ डेटा"}
            </span>
          </div>

          <div className="mt-3 max-h-56 space-y-2 overflow-auto rounded-lg border border-yellow-200 bg-white p-3">
            {gapsFilled.map((gap, index) => (
              <div key={`${gap.field}-${index}`} className="border-b border-yellow-100 pb-2 text-[16px] font-bold last:border-b-0 last:pb-0">
                <div className="flex justify-between gap-3">
                  <span className="font-extrabold text-yellow-950">{gapFieldLabel(gap.field)}</span>
                  <span className="text-right text-yellow-900">{formatGapValue(gap.filled_value)}</span>
                </div>
                <p className="mt-1 text-[14px] text-yellow-800">
                  पद्धत: {gapMethodLabel(gap.method)}
                  {gap.confidence ? ` · विश्वास ${Math.round(Number(gap.confidence) * 100)}%` : ""}
                </p>
                {gap.formula ? <p className="mt-1 text-[14px] text-slate-600">सूत्र: {gap.formula}</p> : null}
                {gap.note ? <p className="mt-1 text-[14px] text-slate-600">{gap.note}</p> : null}
                {gap.warning ? <p className="mt-1 text-[14px] font-extrabold text-red-700">{gap.warning}</p> : null}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[15px] font-extrabold">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-900">
              <p>मूळ विश्वास</p>
              <p className="mt-1 text-[22px]">{Math.round(Number(originalData?.confidence_score || data?.confidence_score || 0) * 100)}%</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-green-900">
              <p>भरल्यानंतर</p>
              <p className="mt-1 text-[22px]">{Math.round(Number(filledData?.confidence_after_filling || filledData?.confidence_score || 0) * 100)}%</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUseFilledData(true)}
              className={`min-h-[52px] rounded-lg px-3 text-[17px] font-extrabold ${
                useFilledData ? "bg-sheti text-white" : "border-2 border-green-200 bg-white text-sheti"
              }`}
            >
              {GAP_FILLING_MESSAGES.accept_filled}
            </button>
            <button
              type="button"
              onClick={() => setUseFilledData(false)}
              className={`min-h-[52px] rounded-lg px-3 text-[17px] font-extrabold ${
                !useFilledData ? "bg-slate-700 text-white" : "border-2 border-slate-200 bg-white text-slate-700"
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
        <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
          <p className="text-[20px] font-extrabold">AI ला स्लिप वाचता आली नाही.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href="/accounting/slip-scan/camera" className="flex min-h-[54px] items-center justify-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white">
              पुन्हा घ्या
            </Link>
            <Link href="/nondi/dudh?date=today" className="flex min-h-[54px] items-center justify-center rounded-lg border-2 border-yellow-300 bg-white px-4 text-[18px] font-extrabold text-yellow-900">
              स्वतः नोंद करा
            </Link>
          </div>
        </section>
      ) : null}

      {saveResult ? (
        <section className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
          <p className="text-[21px] font-extrabold">✅ {saveResult.message || "डेटा जतन झाली!"}</p>
          <p className="mt-2 text-[18px] font-bold">मुख्यपृष्ठावर जात आहे...</p>
        </section>
      ) : null}
    </div>
  );
}
