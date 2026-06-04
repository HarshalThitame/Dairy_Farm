"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { getClientAuthHeaders } from "@/lib/clientStorage";
import { compressImageFileToWebP, isSupportedImageType } from "@/lib/imageCompression";

function getAuthHeader() {
  return getClientAuthHeaders();
}

function getInitialPreview(value) {
  if (typeof value === "string") {
    return value;
  }

  return value?.photo_url || "";
}

export default function AnimalPhotoInput({
  label = "फोटो",
  animalType = "cow",
  value,
  onChange
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(() => getInitialPreview(value));
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(getInitialPreview(value));
  }, [value]);

  async function buildFormData(file) {
    const formData = new FormData();
    let imageFile = file;
    let clientCompressed = false;
    let compressionRatio = 0;

    try {
      const compressed = await compressImageFileToWebP(file, { maxSize: 900000 });
      imageFile = compressed.compressedFile;
      clientCompressed = true;
      compressionRatio = compressed.compressionRatio;
    } catch {
      imageFile = file;
      clientCompressed = false;
    }

    formData.append("image", imageFile, imageFile.name || file.name || "animal-photo.jpg");
    formData.append("animalType", animalType);
    formData.append("originalFilename", file.name || "animal-photo.jpg");
    formData.append("originalSize", String(file.size || 0));
    formData.append("clientCompressed", clientCompressed ? "true" : "false");
    formData.append("compressionRatio", String(compressionRatio));

    return formData;
  }

  async function uploadPhoto(file) {
    if (!file) {
      return;
    }

    if (file.type && !isSupportedImageType(file.type)) {
      setError("फक्त फोटो फाइल निवडा.");
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("फोटो अपलोड करण्यासाठी इंटरनेट आवश्यक आहे.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("फोटो तयार होत आहे...");

    try {
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      const formData = await buildFormData(file);
      setMessage("फोटो अपलोड होत आहे...");
      const response = await fetch("/api/animal-photos", {
        method: "POST",
        headers: getAuthHeader(),
        body: formData
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "फोटो अपलोड झाला नाही.");
      }

      URL.revokeObjectURL(localPreview);
      setPreview(result.data.photo_url);
      onChange?.({
        photo_url: result.data.photo_url,
        photo_storage_path: result.data.photo_storage_path
      });
      setMessage("फोटो अपलोड झाला.");
    } catch (uploadError) {
      setError(uploadError.message || "फोटो अपलोड झाला नाही.");
      setPreview(getInitialPreview(value));
      setMessage("");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function removePhoto() {
    setPreview("");
    setError("");
    setMessage("");
    onChange?.({
      photo_url: null,
      photo_storage_path: null
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100">
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[42px]">
              {animalType === "calf" ? "🐮" : "🐄"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-extrabold text-slate-950">{label}</p>
          <p className="mt-1 text-[16px] font-bold leading-snug text-slate-600">
            स्पष्ट फोटो घेतला तर गायी/वासरू पटकन ओळखता येते.
          </p>
          {message ? <p className="mt-2 text-[15px] font-extrabold text-green-700">{message}</p> : null}
          {error ? <p className="mt-2 text-[15px] font-extrabold text-red-700">{error}</p> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => uploadPhoto(event.target.files?.[0])}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="min-h-[52px] rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white disabled:opacity-70 active:bg-green-700"
        >
          {uploading ? "अपलोड होत आहे..." : "📷 फोटो जोडा"}
        </button>
        <button
          type="button"
          disabled={uploading || !preview}
          onClick={removePhoto}
          className="min-h-[52px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[18px] font-extrabold text-slate-700 disabled:opacity-50 active:bg-slate-100"
        >
          फोटो काढा
        </button>
      </div>
    </section>
  );
}
