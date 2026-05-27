"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import ExtractionForm from "@/components/slip-scan/ExtractionForm";
import ReconciliationModal from "@/components/slip-scan/ReconciliationModal";
import { extractSlipUpload, saveSlipScanRecord } from "@/lib/offlineActions";

export default function SlipScanPreviewPage() {
  const params = useParams();
  const uploadId = params.uploadId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveResult, setSaveResult] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);

  const loadExtraction = useCallback(async () => {
    setLoading(true);
    setError("");
    setSaveResult(null);

    try {
      const result = await extractSlipUpload(uploadId);
      setData(result.data);
    } catch (extractError) {
      setError(extractError.message || "स्लिप नीट वाचता आली नाही.");
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    loadExtraction();
  }, [loadExtraction]);

  async function handleSave(payload) {
    setSaving(true);
    setError("");

    try {
      const result = await saveSlipScanRecord({
        uploadId,
        ...payload
      });
      setSaveResult(result.data);
      if (result.data?.reconciliation) {
        setReconciliation(result.data.reconciliation);
      }
    } catch (saveError) {
      setError(saveError.message || "डेटा जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

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
          <h2 className="text-[22px] font-extrabold text-slate-950">स्लिप फोटो</h2>
          <div className="mt-3 max-h-[360px] overflow-auto rounded-lg border border-slate-200 bg-slate-100">
            <img src={data.imageUrl} alt="स्लिप फोटो" className="w-full object-contain" />
          </div>
        </section>
      ) : null}

      {!loading && data?.extractedData ? (
        <ExtractionForm
          extractedData={data.extractedData}
          upload={data.upload}
          onSave={handleSave}
          onRetry={() => window.location.assign("/accounting/slip-scan/camera")}
          saving={saving}
        />
      ) : null}

      {!loading && !data?.extractedData && !error ? (
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
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href={saveResult.recordType === "settlement" ? "/accounting/settlements" : "/accounting/dairy-slips"} className="flex min-h-[54px] items-center justify-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white">
              रेकॉर्ड बघा
            </Link>
            <Link href="/accounting/slip-scan" className="flex min-h-[54px] items-center justify-center rounded-lg border-2 border-green-200 bg-white px-4 text-[18px] font-extrabold text-green-900">
              दुसरी स्कॅन
            </Link>
          </div>
        </section>
      ) : null}

      {reconciliation ? (
        <ReconciliationModal reconciliation={reconciliation} onClose={() => setReconciliation(null)} />
      ) : null}
    </div>
  );
}
