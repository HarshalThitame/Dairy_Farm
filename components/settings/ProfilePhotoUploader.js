"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { isSupportedImageType } from "@/lib/imageCompression";

function getAuthHeader() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("goshala_token") : "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ProfilePhotoUploader({ value, name, onUploaded, onRemoved }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [preview, setPreview] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  async function upload(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("फोटो ५ MB पेक्षा कमी असावा.");
      return;
    }
    if (file.type && !isSupportedImageType(file.type)) {
      setError("JPG, PNG किंवा WEBP फोटो निवडा.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    setError("");
    setMessage("फोटो अपलोड होत आहे...");

    try {
      const formData = new FormData();
      formData.append("image", file, file.name || "profile-photo.jpg");
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        headers: getAuthHeader(),
        body: formData
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "फोटो अपलोड झाला नाही.");
      URL.revokeObjectURL(localUrl);
      setPreview(result.photoUrl);
      setMessage("फोटो जतन झाला.");
      onUploaded?.(result.photoUrl);
    } catch (uploadError) {
      URL.revokeObjectURL(localUrl);
      setPreview(value || "");
      setError(uploadError.message || "फोटो अपलोड झाला नाही.");
      setMessage("");
    } finally {
      setUploading(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }

  async function removePhoto() {
    if (!preview || !window.confirm("Profile photo काढायचा आहे का?")) return;
    setUploading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/photo", {
        method: "DELETE",
        headers: getAuthHeader()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "फोटो काढता आला नाही.");
      setPreview("");
      setMessage("फोटो काढला.");
      onRemoved?.();
    } catch (removeError) {
      setError(removeError.message || "फोटो काढता आला नाही.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-2 border-green-100 bg-gradient-to-br from-green-100 to-sky-100 shadow-sm sm:h-24 sm:w-24 sm:rounded-2xl">
          {preview ? (
            <img src={preview} alt={name || "Profile"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[42px]">👤</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[21px] font-black text-slate-950">Profile फोटो</p>
          <p className="mt-1 text-[16px] font-bold leading-snug text-slate-600">
            Camera किंवा gallery मधून फोटो निवडा. फोटो compress होऊन सुरक्षित जतन होईल.
          </p>
          {message ? <p className="mt-2 text-[15px] font-extrabold text-green-700">{message}</p> : null}
          {error ? <p className="mt-2 text-[15px] font-extrabold text-red-700">{error}</p> : null}
        </div>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button disabled={uploading} onClick={() => cameraRef.current?.click()} className="min-h-[50px] rounded-xl bg-green-600 px-3 text-[16px] font-black text-white disabled:bg-slate-300">
          📷 कॅमेरा
        </button>
        <button disabled={uploading} onClick={() => galleryRef.current?.click()} className="min-h-[50px] rounded-xl bg-sky-600 px-3 text-[16px] font-black text-white disabled:bg-slate-300">
          🖼️ गॅलरी
        </button>
        <button disabled={uploading || !preview} onClick={removePhoto} className="min-h-[50px] rounded-xl border-2 border-slate-200 bg-white px-3 text-[16px] font-black text-slate-700 disabled:opacity-50">
          काढा
        </button>
      </div>
    </section>
  );
}
