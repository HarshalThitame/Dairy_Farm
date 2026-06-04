"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import RecentScansList from "@/components/slip-scan/RecentScansList";
import { fetchSlipUploads, processPendingSlips } from "@/lib/offlineActions";
import { toMarathiNumerals } from "@/lib/marathiUtils";

function countByStatus(uploads, statuses) {
  return uploads.filter((upload) => statuses.includes(upload.extraction_status || upload.status)).length;
}

function StatPill({ label, value, tone = "slate" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-900 border-emerald-200",
    yellow: "bg-amber-50 text-amber-900 border-amber-200",
    blue: "bg-sky-50 text-sky-900 border-sky-200",
    red: "bg-red-50 text-red-900 border-red-200",
    slate: "bg-white/90 text-slate-900 border-white/70"
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-[13px] font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-[28px] font-black leading-none">{toMarathiNumerals(value || 0)}</p>
    </div>
  );
}

function ActionCard({ href, icon, title, subtitle, badge, tone }) {
  const tones = {
    green: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50 text-emerald-950 active:bg-emerald-100",
    blue: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-sky-950 active:bg-sky-100"
  };

  return (
    <Link
      href={href}
      className={`group relative min-h-[138px] overflow-hidden rounded-3xl border p-4 shadow-soft transition duration-200 active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:shadow-lg ${tones[tone]}`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/55" />
      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-[34px] shadow-sm" aria-hidden="true">
            {icon}
          </span>
          {badge ? (
            <span className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-black shadow-sm">
              {badge}
            </span>
          ) : null}
        </div>
        <div>
          <h2 className="text-[24px] font-black leading-tight">{title}</h2>
          <p className="mt-1 text-[16px] font-bold leading-snug opacity-75">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function InfoStep({ number, title, text }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-950 text-[17px] font-black text-white">
          {toMarathiNumerals(number)}
        </span>
        <div>
          <h3 className="text-[18px] font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-[15px] font-bold leading-snug text-slate-600">{text}</p>
        </div>
      </div>
    </div>
  );
}

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

  const totalScans = uploads.length;
  const savedCount = countByStatus(uploads, ["saved"]);
  const pendingCount = countByStatus(uploads, ["pending", "processing", "captured", "queued"]);
  const failedCount = countByStatus(uploads, ["failed"]);

  return (
    <div className="space-y-5 pb-4">
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-green-800 p-5 text-white shadow-xl">
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-28 w-full bg-gradient-to-t from-white/10 to-transparent" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-black text-emerald-200">AI स्लिप वाचन</p>
              <h1 className="mt-2 text-[34px] font-black leading-tight">स्लिप स्कॅन करा</h1>
              <p className="mt-2 max-w-2xl text-[17px] font-bold leading-snug text-emerald-50">
                दूध स्लिप आणि १५ दिवसांची देयक स्लिप फोटोवरून वाचा, तपासा आणि मगच जतन करा.
              </p>
            </div>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-[34px] shadow-sm backdrop-blur" aria-hidden="true">
              📷
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatPill label="एकूण" value={totalScans} />
            <StatPill label="जतन" value={savedCount} tone="green" />
            <StatPill label="बाकी" value={pendingCount} tone={pendingCount ? "yellow" : "blue"} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <ActionCard
          href="/accounting/slip-scan/camera"
          icon="📷"
          title="कॅमेरा वापरा"
          subtitle="आता फोटो घ्या आणि AI ला वाचायला द्या"
          badge="सर्वात जलद"
          tone="green"
        />
        <ActionCard
          href="/accounting/slip-scan/upload"
          icon="🖼️"
          title="गॅलरी मधून निवडा"
          subtitle="फोनमध्ये असलेला स्पष्ट स्लिप फोटो निवडा"
          badge="फोटो तयार असेल तर"
          tone="blue"
        />
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[23px] font-black text-slate-950">हे कसे काम करते?</h2>
            <p className="mt-1 text-[16px] font-bold text-slate-600">आर्थिक नोंद जतन करण्याआधी तुमची खात्री आवश्यक आहे.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-black text-emerald-900">सुरक्षित</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoStep number={1} title="फोटो निवडा" text="कॅमेरा किंवा गॅलरी मधून स्लिप फोटो घ्या." />
          <InfoStep number={2} title="AI वाचते" text="लिटर, दर, कपात आणि रक्कम वेगळी केली जाते." />
          <InfoStep number={3} title="तुम्ही तपासा" text="सर्व आकडे editable असतात. चुकीचे दिसल्यास बदला." />
          <InfoStep number={4} title="मग जतन" text="तुम्ही मान्य केल्याशिवाय database मध्ये entry होत नाही." />
        </div>
      </section>

      <section className="rounded-[24px] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[21px] font-black text-amber-950">फोनवर साठवलेले फोटो</h2>
            <p className="mt-1 text-[16px] font-bold text-amber-800">
              Internet नसताना घेतलेले फोटो online झाल्यावर process करा.
            </p>
          </div>
          <button
            type="button"
            onClick={processQueued}
            disabled={processing}
            className="min-h-[54px] rounded-2xl bg-amber-500 px-5 text-[17px] font-black text-white shadow-sm transition active:scale-[0.99] disabled:cursor-wait disabled:bg-amber-300"
          >
            {processing ? "Process होत आहे..." : "Process करा"}
          </button>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft">
          <div className="h-7 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </section>
      ) : null}
      {error ? <ErrorState message={error} onRetry={loadUploads} /> : null}

      {!loading ? (
        <RecentScansList uploads={uploads} failedCount={failedCount} pendingCount={pendingCount} />
      ) : null}
    </div>
  );
}
