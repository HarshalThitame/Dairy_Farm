"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import RecentScansList from "@/components/slip-scan/RecentScansList";
import { fetchSlipUploads, processPendingSlips } from "@/lib/offlineActions";

export default function SlipScanHubPage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const loadUploads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchSlipUploads(10);
      setUploads(result.data || []);
    } catch (fetchError) {
      setError(fetchError.message || "स्लिप स्कॅन माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  async function processQueued() {
    setProcessing(true);
    setError("");
    try {
      await processPendingSlips();
      await loadUploads();
    } catch (processError) {
      setError(processError.message || "फोनवर साठवलेले फोटो process झाले नाहीत.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="📷 स्लिप स्कॅन करा" subtitle="दूध स्लिप किंवा देयक स्लिप स्कॅन करा" />

      <section className="grid gap-3">
        <Link href="/accounting/slip-scan/camera" className="flex min-h-[92px] items-center gap-4 rounded-lg border-2 border-green-200 bg-green-50 p-4 shadow-soft active:bg-green-100">
          <span className="text-[38px]" aria-hidden="true">📷</span>
          <span>
            <span className="block text-[23px] font-extrabold text-green-950">नवीन स्लिप घ्या</span>
            <span className="mt-1 block text-[18px] font-bold text-green-800">कॅमेरा उघडा आणि फोटो घ्या</span>
          </span>
        </Link>
        <Link href="/accounting/slip-scan/upload" className="flex min-h-[92px] items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft active:bg-green-50">
          <span className="text-[38px]" aria-hidden="true">📁</span>
          <span>
            <span className="block text-[23px] font-extrabold text-slate-950">गॅलरी मधून निवडा</span>
            <span className="mt-1 block text-[18px] font-bold text-slate-600">आधीचा स्लिप फोटो वापरा</span>
          </span>
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {[
          ["🥛 दूध स्लिप", "सकाळ किंवा संध्याकाळी डेअरीने दिलेली स्लिप"],
          ["📋 देयक स्लिप", "१५ दिवसांचे पेमेंट किंवा settlement"],
          ["🤖 AI वाचन", "आकडे स्वतः भरायची गरज कमी"],
          ["✅ तपासून जतन", "तुम्ही मान्य केल्याशिवाय जतन होत नाही"]
        ].map(([title, text]) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
            <h2 className="text-[18px] font-extrabold text-slate-950">{title}</h2>
            <p className="mt-1 text-[15px] font-bold leading-snug text-slate-600">{text}</p>
          </article>
        ))}
      </section>

      <button
        type="button"
        onClick={processQueued}
        disabled={processing}
        className="min-h-[54px] w-full rounded-lg border-2 border-yellow-200 bg-yellow-50 px-4 text-[18px] font-extrabold text-yellow-900 disabled:opacity-70 active:bg-yellow-100"
      >
        {processing ? "फोनवरील फोटो process होत आहेत..." : "🟡 फोनवर साठवलेले फोटो process करा"}
      </button>

      {loading ? <LoadingState text="स्कॅन लोड होत आहेत..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadUploads} /> : null}

      {!loading ? (
        <RecentScansList uploads={uploads} />
      ) : null}
    </div>
  );
}
