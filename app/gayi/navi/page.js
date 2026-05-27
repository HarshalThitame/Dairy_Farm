"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import CowForm from "@/components/CowForm";
import PageHeader from "@/components/PageHeader";
import { saveCow } from "@/lib/offlineActions";

function cleanCowPayload(form) {
  return {
    name: form.name.trim(),
    breed: form.breed,
    color: form.color.trim() || null,
    date_of_birth: form.date_of_birth || null,
    tag_number: form.tag_number.trim() || null,
    purchased_on: form.purchased_on || null,
    status: form.status,
    photo_url: form.photo_url || null,
    photo_storage_path: form.photo_storage_path || null,
    notes: form.notes.trim() || null
  };
}

export default function NaviGayPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function addCow(form) {
    setError("");
    setSuccess("");

    try {
      const result = await saveCow(cleanCowPayload(form));
      setSuccess(
        result.offline
          ? "⏳ गाय फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल."
          : "गाय यशस्वीरित्या जोडली! 🐄"
      );
      window.setTimeout(() => router.push("/gayi"), 900);
    } catch {
      setError("गाय जतन करताना चूक झाली.");
      return;
    }
  }

  return (
    <AdminOnly
      fallback={
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-[20px] font-extrabold text-slate-700 shadow-soft">
          🔒 ही कृती फक्त मालकासाठी आहे.
        </div>
      }
    >
      <div className="space-y-5">
        <PageHeader title="➕ नवीन गाय जोडा" subtitle="गायीची माहिती भरा" />
        <CowForm
          submitLabel="✅ गाय जोडा"
          submittingLabel="⏳ गाय जतन होत आहे..."
          onSubmit={addCow}
          error={error}
          success={success}
        />
      </div>
    </AdminOnly>
  );
}
