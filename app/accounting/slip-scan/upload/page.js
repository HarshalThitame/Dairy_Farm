"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorState from "@/components/ErrorState";
import AIReadingProgress from "@/components/slip-scan/AIReadingProgress";
import CompressionStats from "@/components/slip-scan/CompressionStats";
import ImageUploadZone from "@/components/slip-scan/ImageUploadZone";
import { uploadSlipImage } from "@/lib/offlineActions";
import { toMarathiNumerals } from "@/lib/marathiUtils";

function formatFileSize(bytes = 0) {
  if (!bytes) return "० KB";
  if (bytes >= 1024 * 1024) {
    return `${toMarathiNumerals((bytes / 1024 / 1024).toFixed(1))} MB`;
  }
  return `${toMarathiNumerals(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

function GuidanceItem({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/75 bg-white/80 p-3 shadow-sm backdrop-blur">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-[24px]" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h3 className="text-[17px] font-black leading-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-[14px] font-bold leading-snug text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function SelectedFilePanel({ file }) {
  if (!file) return null;

  return (
    <section className="rounded-[22px] border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-[30px] shadow-sm" aria-hidden="true">
          🖼️
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-black uppercase tracking-wide text-sky-700">निवडलेला फोटो</p>
          <h2 className="mt-1 truncate text-[19px] font-black text-slate-950">{file.name || "स्लिप फोटो"}</h2>
          <p className="mt-1 text-[15px] font-bold text-slate-600">{formatFileSize(file.size)} · {file.type || "image"}</p>
        </div>
      </div>
    </section>
  );
}

export default function SlipScanUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("checking");
  const [compression, setCompression] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleFileSelect(file) {
    if (!file) return;
    setSelectedFile(file);

    if (!file.type?.startsWith("image/")) {
      setSelectedFile(null);
      setError("फक्त फोटो फाइल निवडा.");
      return;
    }

    setLoading(true);
    setError("");
    setCompression(null);
    setStage("checking");
    setMessage("फोटो तपासत आहे...");

    try {
      const result = await uploadSlipImage(file, {
        originalFilename: file.name,
        originalSize: file.size,
        onProgress: (progress) => {
          if (progress.stage) {
            setStage(progress.stage);
          }
          if (progress.message) {
            setMessage(progress.message);
          }
          if (progress.compression) {
            setCompression(progress.compression);
          }
        }
      });

      if (result.offline) {
        setMessage("🟡 फोटो फोनवर साठवला. इंटरनेट आल्यावर process करा.");
        window.setTimeout(() => router.push("/accounting/slip-scan"), 1200);
        return;
      }

      const uploadId = result.data?.uploadId;
      if (!uploadId) {
        throw new Error("Upload ID मिळाला नाही.");
      }

      setStage("reading");
      setMessage("फोटो अपलोड झाला. AI वाचत आहे...");
      router.push(`/accounting/slip-scan/preview/${uploadId}`);
    } catch (uploadError) {
      setError(uploadError.message || "फोटो अपलोड झाला नाही.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <section className="relative overflow-hidden rounded-[28px] border border-sky-200 bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-800 p-5 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-14 left-10 h-32 w-32 rounded-full bg-emerald-300/20" />

        <div className="relative">
          <Link href="/accounting/slip-scan" className="inline-flex min-h-[38px] items-center rounded-full bg-white/12 px-3 text-[14px] font-black text-sky-50 backdrop-blur active:bg-white/20">
            ← स्कॅन पेज
          </Link>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-black text-sky-200">गॅलरी upload</p>
              <h1 className="mt-2 text-[34px] font-black leading-tight">स्लिप फोटो निवडा</h1>
              <p className="mt-2 max-w-2xl text-[17px] font-bold leading-snug text-sky-50">
                फोनमधील स्पष्ट दूध किंवा १५ दिवसांची देयक स्लिप निवडा. जतन करण्याआधी सगळे आकडे तपासता येतील.
              </p>
            </div>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-[34px] shadow-sm backdrop-blur" aria-hidden="true">
              🖼️
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur">
              <p className="text-[13px] font-black uppercase tracking-wide text-sky-100">Format</p>
              <p className="mt-1 text-[18px] font-black">JPG · PNG · WEBP</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur">
              <p className="text-[13px] font-black uppercase tracking-wide text-sky-100">Save rule</p>
              <p className="mt-1 text-[18px] font-black">तपासून मग जतन</p>
            </div>
          </div>
        </div>
      </section>

      <ImageUploadZone onFileSelect={handleFileSelect} loading={loading} />

      <SelectedFilePanel file={selectedFile} />

      {error ? <ErrorState message={error} /> : null}
      {loading ? (
        <AIReadingProgress stage={stage} message={message} />
      ) : message ? (
        <p className="rounded-[20px] border border-sky-200 bg-sky-50 p-4 text-[18px] font-black text-sky-900 shadow-sm">{message}</p>
      ) : null}
      {compression ? (
        <CompressionStats
          originalSize={compression.originalSize}
          compressedSize={compression.compressedSize}
          compressionRatio={compression.compressionRatio}
        />
      ) : null}

      <section className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[23px] font-black text-slate-950">चांगला फोटो कसा असावा?</h2>
            <p className="mt-1 text-[16px] font-bold text-slate-600">OCR अचूक येण्यासाठी हे तीन नियम पाळा.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-black text-emerald-900">
            महत्वाचे
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <GuidanceItem icon="☀️" title="प्रकाश चांगला" text="स्लिपवर सावली किंवा glare नसावा." />
          <GuidanceItem icon="📐" title="स्लिप सरळ" text="फोटो तिरका किंवा अर्धा crop नसावा." />
          <GuidanceItem icon="🔎" title="अक्षरे स्पष्ट" text="लिटर, दर आणि रक्कम जवळून दिसली पाहिजे." />
        </div>
      </section>
    </div>
  );
}
