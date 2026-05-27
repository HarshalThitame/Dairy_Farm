"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CameraView from "@/components/slip-scan/CameraView";
import ErrorState from "@/components/ErrorState";
import PageHeader from "@/components/PageHeader";
import CompressionStats from "@/components/slip-scan/CompressionStats";
import { uploadSlipImage } from "@/lib/offlineActions";

export default function SlipScanCameraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [compression, setCompression] = useState(null);

  async function handleCapture(blob) {
    if (!blob) {
      setError("फोटो मिळाला नाही.");
      return;
    }

    setLoading(true);
    setError("");
    setCompression(null);
    setMessage("फोटो संकुचित करत आहे...");

    try {
      const result = await uploadSlipImage(blob, {
        originalFilename: blob.name || `dairy-slip-${Date.now()}.jpg`,
        originalSize: blob.size,
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
    } catch (captureError) {
      setError(captureError.message || "फोटो अपलोड झाला नाही.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="📷 स्लिप फोटो घ्या" subtitle="स्लिप सरळ आणि स्पष्ट दिसेल अशी ठेवा" />
      {error ? <ErrorState message={error} /> : null}
      {message ? <p className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-[19px] font-extrabold text-blue-900">{message}</p> : null}
      {compression ? (
        <CompressionStats
          originalSize={compression.originalSize}
          compressedSize={compression.compressedSize}
          compressionRatio={compression.compressionRatio}
        />
      ) : null}
      <CameraView onCapture={handleCapture} onCancel={() => router.push("/accounting/slip-scan")} loading={loading} />
    </div>
  );
}
