"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import CowForm from "@/components/CowForm";
import PageHeader from "@/components/PageHeader";
import { isOnline } from "@/lib/networkStatus";
import { saveCalvingRecord, saveCow } from "@/lib/offlineActions";

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

function shouldCreateCalf(form) {
  return form.status === "व्याललेली";
}

function cleanInitialCalvingPayload(form, cow) {
  const calf = form.calf || {};
  return {
    cow_id: cow.id,
    cow,
    cowName: cow.name,
    actual_date: calf.birth_date,
    calf_count: Number(calf.calf_count || 1),
    calf_gender: calf.gender,
    calf_name: calf.calf_name?.trim() || null,
    calving_notes: calf.calving_notes?.trim() || null,
    raise_calf: calf.gender === "मादी" && calf.raise_calf === "हो",
    calf_photo_url: calf.calf_photo_url || null,
    calf_photo_storage_path: calf.calf_photo_storage_path || null,
    calf_breed: form.breed || cow.breed || null
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
      const createCalf = shouldCreateCalf(form);

      if (createCalf && !isOnline()) {
        setError("गाय आणि वासराची नोंद एकत्र जोडण्यासाठी इंटरनेट आवश्यक आहे.");
        return;
      }

      if (createCalf && !form.calf?.birth_date) {
        setError("वासराची जन्म तारीख आवश्यक आहे.");
        return;
      }

      const result = await saveCow(cleanCowPayload(form));

      if (createCalf && result.data?.id) {
        await saveCalvingRecord(cleanInitialCalvingPayload(form, result.data));
      }

      setSuccess(
        result.offline
          ? "⏳ गाय फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल."
          : createCalf
            ? "गाय आणि वासराची नोंद यशस्वीरित्या जोडली! 🐄🐮"
            : "गाय यशस्वीरित्या जोडली! 🐄"
      );
      window.setTimeout(() => router.push("/gayi"), 900);
    } catch (saveError) {
      setError(saveError.message || "गाय जतन करताना चूक झाली.");
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
          enableCalfForCalved
        />
      </div>
    </AdminOnly>
  );
}
