"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorState from "@/components/ErrorState";
import PageHeader from "@/components/PageHeader";
import CompressionStats from "@/components/slip-scan/CompressionStats";
import ImageUploadZone from "@/components/slip-scan/ImageUploadZone";
import { uploadSlipImage } from "@/lib/offlineActions";

export default function SlipScanUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [compression, setCompression] = useState(null);

  async function handleFileSelect(file) {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setError("फक्त फोटो फाइल निवडा.");
      return;
    }

    setLoading(true);
    setError("");
    setCompression(null);
    setMessage("फोटो तपासत आहे...");

    try {
      const result = await uploadSlipImage(file, {
        originalFilename: file.name,
        originalSize: file.size,
        onProgress: (progress) => {
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
    <div className="space-y-5">
      <PageHeader title="📁 स्लिप निवडा" subtitle="गॅलरीतील दूध किंवा देयक स्लिप फोटो वापरा" />
      {error ? <ErrorState message={error} /> : null}
      {message ? <p className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-[19px] font-extrabold text-blue-900">{message}</p> : null}
      {compression ? (
        <CompressionStats
          originalSize={compression.originalSize}
          compressedSize={compression.compressedSize}
          compressionRatio={compression.compressionRatio}
        />
      ) : null}
      <ImageUploadZone onFileSelect={handleFileSelect} loading={loading} />
    </div>
  );
}
