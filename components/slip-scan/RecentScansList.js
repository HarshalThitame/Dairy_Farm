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
    return "bg-green-50 text-green-800 border-green-200";
  }
  if (status === "failed") {
    return "bg-red-50 text-red-800 border-red-200";
  }
  return "bg-yellow-50 text-yellow-900 border-yellow-200";
}

function typeLabel(type) {
  if (type === "settlement") return "📋 देयक स्लिप";
  if (type === "daily") return "🥛 दूध स्लिप";
  return "📷 स्लिप";
}

export default function RecentScansList({ uploads = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <h2 className="text-[24px] font-extrabold text-slate-950">अलीकडील स्कॅन</h2>
      <div className="mt-4 space-y-3">
        {uploads.length > 0 ? uploads.map((upload, index) => {
          const status = upload.extraction_status || upload.status;
          const href = upload.id ? `/accounting/slip-scan/preview/${upload.id}` : null;
          const confidence = upload.ai_confidence ? `${toMarathiNumerals(Math.round(Number(upload.ai_confidence) * 100))}%` : "";
          const content = (
            <article className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 active:bg-green-50">
              <div className="relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded-lg bg-slate-200">
                {upload.compressed_image_url ? (
                  <img src={upload.compressed_image_url} alt="स्लिप" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[30px]">📷</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[19px] font-extrabold text-slate-950">{typeLabel(upload.slip_type)}</p>
                <p className="mt-1 text-[16px] font-bold text-slate-600">
                  {upload.created_at ? formatMarathiDate(upload.created_at) : `स्थानिक #${toMarathiNumerals(upload.localId || index + 1)}`}
                </p>
                {confidence ? <p className="mt-1 text-[14px] font-extrabold text-green-700">AI आत्मविश्वास {confidence}</p> : null}
              </div>
              <span className={`rounded-lg border px-2 py-1 text-[14px] font-extrabold ${statusTone(status)}`}>
                {statusLabel(status)}
              </span>
            </article>
          );

          return href ? <Link key={upload.id} href={href}>{content}</Link> : <div key={upload.localId || index}>{content}</div>;
        }) : (
          <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-[19px] font-bold text-slate-600">
            अजून कोणतीही स्लिप स्कॅन केलेली नाही.
          </p>
        )}
      </div>
    </section>
  );
}
