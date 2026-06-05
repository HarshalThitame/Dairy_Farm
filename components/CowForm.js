"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnimalPhotoInput from "@/components/AnimalPhotoInput";
import MarathiTextInput from "@/components/MarathiTextInput";
import { cowStatuses } from "@/components/StatusBadge";
import { getTodayISODate } from "@/lib/marathiUtils";

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

const emptyCalfForm = {
  birth_date: getTodayISODate(),
  gender: "मादी",
  calf_count: "1",
  raise_calf: "हो",
  calf_name: "",
  calf_photo_url: "",
  calf_photo_storage_path: "",
  calving_notes: ""
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
    notes: cow.notes || "",
    calf: emptyCalfForm
  };
}

export default function CowForm({
  initialCow,
  submitLabel,
  submittingLabel,
  onSubmit,
  backHref = "/gayi",
  error,
  success,
  enableCalfForCalved = false
}) {
  const [form, setForm] = useState(() => ({
    ...normalizeInitialCow(initialCow),
    calf: emptyCalfForm
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      ...normalizeInitialCow(initialCow),
      calf: emptyCalfForm
    });
  }, [initialCow]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function updateCalfField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      calf: {
        ...(currentForm.calf || emptyCalfForm),
        [field]: value
      }
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

      {enableCalfForCalved && form.status === "व्याललेली" ? (
        <section className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-green-50 p-4 shadow-soft">
          <div className="mb-4">
            <p className="text-[22px] font-black text-slate-950">🐮 वासराची नोंद</p>
            <p className="mt-1 text-[16px] font-bold leading-snug text-slate-600">
              गाय व्याललेली असल्यास वासराची माहिती लगेच जोडा. ओळख खूण किंवा वजन विचारले जाणार नाही.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
                व्यायण / जन्म तारीख *
              </span>
              <input
                type="date"
                value={form.calf?.birth_date || ""}
                onChange={(event) => updateCalfField("birth_date", event.target.value)}
                required={form.status === "व्याललेली"}
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <div>
              <p className="mb-2 text-[20px] font-extrabold text-slate-900">वासराचे लिंग *</p>
              <div className="grid grid-cols-2 gap-3">
                {["मादी", "नर"].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => updateCalfField("gender", gender)}
                    className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                      form.calf?.gender === gender
                        ? "border-purple-300 bg-purple-100 text-purple-900"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {gender === "मादी" ? "🐄 मादी" : "🐂 नर"}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
                वासरांची संख्या
              </span>
              <select
                value={form.calf?.calf_count || "1"}
                onChange={(event) => updateCalfField("calf_count", event.target.value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              >
                <option value="1">१</option>
                <option value="2">२ - जुळे</option>
              </select>
            </label>

            {form.calf?.gender === "मादी" ? (
              <div>
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">
                  ही वासरी पाळायची आहे का?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {["हो", "नाही"].map((answer) => (
                    <button
                      key={answer}
                      type="button"
                      onClick={() => updateCalfField("raise_calf", answer)}
                      className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                        form.calf?.raise_calf === answer
                          ? "border-green-300 bg-green-100 text-sheti"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {answer === "हो" ? "✅ हो" : "नाही"}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[15px] font-bold leading-snug text-slate-500">
                  “हो” निवडल्यास शिंग काढणे, दूध कमी करणे आणि दूध बंद करण्याच्या आठवणी तयार होतील.
                </p>
              </div>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
                वासराचे नाव
              </span>
              <MarathiTextInput
                value={form.calf?.calf_name || ""}
                onValueChange={(value) => updateCalfField("calf_name", value)}
                autoComplete="off"
                className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              />
            </label>

            <AnimalPhotoInput
              label="वासराचा फोटो"
              animalType="calf"
              value={{
                photo_url: form.calf?.calf_photo_url || "",
                photo_storage_path: form.calf?.calf_photo_storage_path || ""
              }}
              onChange={(photo) => {
                updateCalfField("calf_photo_url", photo.photo_url || "");
                updateCalfField("calf_photo_storage_path", photo.photo_storage_path || "");
              }}
            />

            <label className="block">
              <span className="mb-2 block text-[20px] font-extrabold text-slate-900">
                वासराची नोंद
              </span>
              <MarathiTextInput
                multiline
                value={form.calf?.calving_notes || ""}
                onValueChange={(value) => updateCalfField("calving_notes", value)}
                rows={3}
                className="min-h-[108px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              />
            </label>
          </div>
        </section>
      ) : null}

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
