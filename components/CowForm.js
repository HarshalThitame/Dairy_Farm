"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnimalPhotoInput from "@/components/AnimalPhotoInput";
import MarathiTextInput from "@/components/MarathiTextInput";
import { cowStatuses } from "@/components/StatusBadge";

const breedOptions = [
  { value: "HF", label: "एच एफ" },
  { value: "गीर", label: "गीर" },
  { value: "साहिवाल", label: "साहिवाल" },
  { value: "देशी", label: "देशी" },
  { value: "जर्सी", label: "जर्सी" },
  { value: "इतर", label: "इतर" }
];

const defaultBreed = "जर्सी";

const emptyForm = {
  name: "",
  breed: defaultBreed,
  color: "",
  date_of_birth: "",
  tag_number: "",
  purchased_on: "",
  status: "रिकामी",
  photo_url: "",
  photo_storage_path: "",
  notes: ""
};

function normalizeInitialCow(cow) {
  if (!cow) {
    return emptyForm;
  }

  return {
    name: cow.name || "",
    breed: cow.breed || "",
    color: cow.color || "",
    date_of_birth: cow.date_of_birth || "",
    tag_number: cow.tag_number || "",
    purchased_on: cow.purchased_on || "",
    status: cow.status || "रिकामी",
    photo_url: cow.photo_url || "",
    photo_storage_path: cow.photo_storage_path || "",
    notes: cow.notes || ""
  };
}

export default function CowForm({
  initialCow,
  submitLabel,
  submittingLabel,
  onSubmit,
  backHref = "/gayi",
  error,
  success
}) {
  const [form, setForm] = useState(() => normalizeInitialCow(initialCow));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(normalizeInitialCow(initialCow));
  }, [initialCow]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);

    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submitForm} className="space-y-5">
      <p className="text-[18px] font-bold text-tatkal">* आवश्यक माहिती</p>

      {success ? (
        <div
          className={`rounded-lg border p-4 text-[20px] font-extrabold ${
            success.startsWith("⏳")
              ? "border-yellow-200 bg-yellow-50 text-yellow-900"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">
          {error}
        </div>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          गायीचे नाव *
        </span>
        <MarathiTextInput
          value={form.name}
          onValueChange={(value) => updateField("name", value)}
          required
          autoComplete="off"
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        />
      </label>

      <AnimalPhotoInput
        label="गायीचा फोटो"
        animalType="cow"
        value={{ photo_url: form.photo_url, photo_storage_path: form.photo_storage_path }}
        onChange={(photo) => {
          updateField("photo_url", photo.photo_url || "");
          updateField("photo_storage_path", photo.photo_storage_path || "");
        }}
      />

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          जात *
        </span>
        <select
          value={form.breed}
          onChange={(event) => updateField("breed", event.target.value)}
          required
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        >
          <option value="">जात निवडा</option>
          {breedOptions.map((breed) => (
            <option key={breed.value} value={breed.value}>
              {breed.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          रंग
        </span>
        <MarathiTextInput
          value={form.color}
          onValueChange={(value) => updateField("color", value)}
          autoComplete="off"
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          जन्म तारीख
        </span>
        <input
          type="date"
          value={form.date_of_birth}
          onChange={(event) => updateField("date_of_birth", event.target.value)}
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          कान टॅग नंबर
        </span>
        <input
          type="text"
          value={form.tag_number}
          onChange={(event) => updateField("tag_number", event.target.value)}
          autoComplete="off"
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          खरेदी तारीख
        </span>
        <input
          type="date"
          value={form.purchased_on}
          onChange={(event) => updateField("purchased_on", event.target.value)}
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          सद्यस्थिती *
        </span>
        <select
          value={form.status}
          onChange={(event) => updateField("status", event.target.value)}
          required
          className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        >
          {cowStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
          इतर नोंद
        </span>
        <MarathiTextInput
          multiline
          value={form.notes}
          onValueChange={(value) => updateField("notes", value)}
          rows={4}
          className="min-h-[132px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
        />
      </label>

      <div className="grid gap-3">
        <button
          type="submit"
          disabled={saving || Boolean(success)}
          className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
        >
          {saving ? submittingLabel : submitLabel}
        </button>
        <Link
          href={backHref}
          className="flex min-h-[52px] items-center justify-center rounded-lg border-2 border-slate-300 bg-white px-4 text-[19px] font-extrabold text-slate-800 active:bg-slate-100"
        >
          ⬅ मागे जा
        </Link>
      </div>
    </form>
  );
}
