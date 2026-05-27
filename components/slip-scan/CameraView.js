"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

export default function CameraView({ onCapture, onCancel, loading = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1600 },
            height: { ideal: 1200 }
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError("कॅमेरा सुरू झाला नाही. परवानगी द्या किंवा गॅलरी मधून फोटो निवडा.");
      }
    }

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("कॅमेरा तयार नाही. पुन्हा प्रयत्न करा.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("फोटो घेताना त्रुटी आली.");
          return;
        }
        const file = new File([blob], `dairy-slip-${Date.now()}.jpg`, { type: "image/jpeg" });
        const nextUrl = URL.createObjectURL(file);
        setPreviewBlob(file);
        setPreviewUrl(nextUrl);
      },
      "image/jpeg",
      0.92
    );
  }

  function retake() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setPreviewBlob(null);
    setError("");
  }

  if (previewUrl) {
    return (
      <div className="space-y-4">
        <img src={previewUrl} alt="स्लिप फोटो preview" className="max-h-[62vh] w-full rounded-lg border border-slate-200 object-contain bg-black" />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={retake}
            className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[19px] font-extrabold text-slate-700 active:bg-slate-100"
          >
            🔄 पुन्हा घ्या
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onCapture?.(previewBlob)}
            className="min-h-[56px] rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white disabled:opacity-70 active:bg-green-700"
          >
            {loading ? "अपलोड होत आहे..." : "✅ हे ठीक आहे"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="h-[62vh] w-full object-cover" />
        {error ? (
          <div className="absolute inset-x-4 top-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[18px] font-bold text-red-800">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_96px_1fr] items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[54px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[18px] font-extrabold text-slate-700 active:bg-slate-100"
        >
          रद्द
        </button>
        <button
          type="button"
          onClick={captureFrame}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-sheti text-[34px] text-white shadow-lg active:bg-green-700"
          aria-label="फोटो घ्या"
        >
          📷
        </button>
        <p className="text-center text-[16px] font-bold text-slate-600">स्लिप सरळ ठेवा</p>
      </div>
    </div>
  );
}
