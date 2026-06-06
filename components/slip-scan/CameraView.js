"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

export default function CameraView({ onCapture, onCancel, loading = false }) {
  const nativeInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState(null);
  const [liveMode, setLiveMode] = useState(false);
  const [liveStarting, setLiveStarting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      if (!liveMode) {
        return;
      }

      try {
        setLiveStarting(true);
        setError("");

        if (!navigator.mediaDevices?.getUserMedia) {
          setError("या browser मध्ये live camera support नाही. वरचा native camera वापरा.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 2560 },
            height: { ideal: 1920 }
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
      } finally {
        if (mounted) {
          setLiveStarting(false);
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [liveMode]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function stopLiveCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function openNativeCamera() {
    if (loading) return;
    setError("");
    if (nativeInputRef.current) {
      nativeInputRef.current.value = "";
      nativeInputRef.current.click();
    }
  }

  function handleNativeFile(file) {
    if (!file) {
      return;
    }

    const fileType = String(file.type || "").toLowerCase();
    if (fileType && !fileType.startsWith("image/")) {
      setError("फक्त फोटो फाइल निवडा.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    stopLiveCamera();
    setLiveMode(false);
    setError("");
    setPreviewBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

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
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
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
    if (nativeInputRef.current) {
      nativeInputRef.current.value = "";
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
      <input
        ref={nativeInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleNativeFile(event.target.files?.[0])}
      />

      {!liveMode ? (
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-200 bg-gradient-to-br from-slate-950 via-emerald-950 to-green-800 p-5 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-emerald-300/20" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-black text-emerald-200">High quality camera</p>
                <h2 className="mt-2 text-[31px] font-black leading-tight">फोनचा कॅमेरा उघडा</h2>
                <p className="mt-2 text-[17px] font-bold leading-snug text-emerald-50">
                  हा camera phone app सारखा autofocus आणि clear photo देतो. OCR accuracy साठी हाच उत्तम पर्याय आहे.
                </p>
              </div>
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-[34px] shadow-sm backdrop-blur" aria-hidden="true">
                📷
              </span>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-[17px] font-black text-red-800">
                {error}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={openNativeCamera}
                className="min-h-[64px] rounded-2xl bg-white px-5 text-[21px] font-black text-emerald-950 shadow-lg transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
              >
                📷 कॅमेरा उघडा
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setLiveMode(true)}
                className="min-h-[52px] rounded-2xl border border-white/25 bg-white/10 px-4 text-[16px] font-black text-white backdrop-blur transition active:bg-white/20 disabled:cursor-wait disabled:opacity-70"
              >
                Live browser camera वापरा
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur">
                <p className="text-[13px] font-black text-emerald-100">१</p>
                <p className="mt-1 text-[15px] font-black">स्लिप सरळ</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur">
                <p className="text-[13px] font-black text-emerald-100">२</p>
                <p className="mt-1 text-[15px] font-black">प्रकाश चांगला</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/12 p-3 backdrop-blur">
                <p className="text-[13px] font-black text-emerald-100">३</p>
                <p className="mt-1 text-[15px] font-black">जवळून फोटो</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="h-[62vh] w-full object-cover" />
            {liveStarting ? (
              <div className="absolute inset-x-4 top-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-[18px] font-bold text-blue-800">
                कॅमेरा सुरू करत आहे...
              </div>
            ) : null}
            {error ? (
              <div className="absolute inset-x-4 top-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[18px] font-bold text-red-800">
                {error}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-[1fr_96px_1fr] items-center gap-3">
            <button
              type="button"
              onClick={() => {
                stopLiveCamera();
                setLiveMode(false);
                setError("");
              }}
              className="min-h-[54px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[18px] font-extrabold text-slate-700 active:bg-slate-100"
            >
              Native camera
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
        </>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="min-h-[54px] w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-[18px] font-extrabold text-slate-700 active:bg-slate-100"
      >
        रद्द
      </button>
    </div>
  );
}
