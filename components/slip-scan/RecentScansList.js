"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

function statusLabel(status) {
  const labels = {
    pending: "प्रतीक्षा",
    processing: "AI वाचत आहे",
    success: "तपासा",
    saved: "जतन झाले",
    failed: "अयशस्वी",
    captured: "फोनवर साठवले",
    queued: "रांगेत",
    extracted: "AI वाचले"
  };
  return labels[status] || status || "प्रतीक्षा";
}

function statusTone(status) {
  if (status === "saved" || status === "success" || status === "extracted") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (status === "failed") {
    return "bg-red-50 text-red-800 border-red-200";
  }
  return "bg-amber-50 text-amber-900 border-amber-200";
}

function typeLabel(type) {
  if (type === "settlement") return "📋 देयक स्लिप";
  if (type === "daily") return "🥛 दूध स्लिप";
  return "📷 स्लिप";
}

function confidenceLabel(value) {
  if (!value) return "";
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return "";
  const percent = raw > 1 ? raw : raw * 100;
  return `${toMarathiNumerals(Math.round(percent))}%`;
}

function ScanItem({ upload, index }) {
  const status = upload.extraction_status || upload.status;
  const href = upload.id ? `/accounting/slip-scan/preview/${upload.id}` : null;
  const confidence = confidenceLabel(upload.ai_confidence);
  const dateLabel = upload.created_at
    ? formatMarathiDate(upload.created_at)
    : `स्थानिक #${toMarathiNumerals(upload.localId || index + 1)}`;

  const content = (
    <article className="group grid min-h-[112px] grid-cols-[82px_1fr_auto] items-center gap-3 rounded-[22px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-emerald-50 p-3 shadow-sm transition duration-200 active:scale-[0.99] active:border-emerald-300 sm:hover:-translate-y-0.5 sm:hover:shadow-md">
      <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[18px] border border-white bg-slate-200 shadow-sm">
        {upload.compressed_image_url ? (
          <img src={upload.compressed_image_url} alt="स्लिप" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 text-[34px]">
            📷
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-[19px] font-black leading-tight text-slate-950">{typeLabel(upload.slip_type)}</p>
          {confidence ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-black text-emerald-800">
              AI {confidence}
            </span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-1 text-[15px] font-bold text-slate-600">{dateLabel}</p>
        <p className="mt-1 line-clamp-1 text-[14px] font-bold text-slate-500">
          {status === "saved" ? "नोंद database मध्ये जतन झाली आहे" : "तपासणीसाठी उघडा"}
        </p>
      </div>

      <div className="flex h-full shrink-0 flex-col items-end justify-between gap-2">
        <span className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-black ${statusTone(status)}`}>
          {statusLabel(status)}
        </span>
        {href ? (
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[18px] font-black text-slate-700 shadow-sm transition group-hover:bg-emerald-600 group-hover:text-white">
            →
          </span>
        ) : null}
      </div>
    </article>
  );

  return href ? (
    <Link key={upload.id} href={href} className="block">
      {content}
    </Link>
  ) : (
    <div key={upload.localId || index}>{content}</div>
  );
}

export default function RecentScansList({ uploads = [], failedCount = 0, pendingCount = 0 }) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">स्लिप इतिहास</p>
          <h2 className="mt-1 text-[25px] font-black leading-tight text-slate-950">अलीकडील स्कॅन</h2>
          <p className="mt-1 text-[15px] font-bold text-slate-600">शेवटच्या १० स्लिप्स आणि त्यांची स्थिती.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-black text-slate-700">
            {toMarathiNumerals(uploads.length)} स्कॅन
          </span>
          {pendingCount > 0 ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-black text-amber-800">
              {toMarathiNumerals(pendingCount)} बाकी
            </span>
          ) : null}
          {failedCount > 0 ? (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[13px] font-black text-red-800">
              {toMarathiNumerals(failedCount)} अयशस्वी
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {uploads.length > 0 ? uploads.map((upload, index) => (
          <ScanItem key={upload.id || upload.localId || index} upload={upload} index={index} />
        )) : (
          <div className="rounded-[22px] border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-[34px] shadow-sm">📷</div>
            <h3 className="mt-4 text-[22px] font-black text-slate-950">अजून स्लिप स्कॅन केलेली नाही</h3>
            <p className="mx-auto mt-2 max-w-sm text-[16px] font-bold leading-snug text-slate-600">
              पहिली दूध किंवा देयक स्लिप स्कॅन करा. जतन करण्याआधी सर्व आकडे तपासता येतील.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href="/accounting/slip-scan/camera" className="rounded-2xl bg-emerald-600 px-4 py-3 text-[16px] font-black text-white shadow-sm">
                कॅमेरा उघडा
              </Link>
              <Link href="/accounting/slip-scan/upload" className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-[16px] font-black text-sky-900 shadow-sm">
                गॅलरी निवडा
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
