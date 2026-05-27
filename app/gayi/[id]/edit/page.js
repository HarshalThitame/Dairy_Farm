"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import CowForm from "@/components/CowForm";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { getCachedCow } from "@/lib/localDB";
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

export default function GayEditPage() {
  const params = useParams();
  const router = useRouter();
  const [cow, setCow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCow = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/cows/${params.id}`, { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "गायीची माहिती मिळाली नाही.");
      }

      setCow(result.data.cow);
    } catch (fetchError) {
      const cachedCow = await getCachedCow(params.id);

      if (cachedCow) {
        setCow(cachedCow);
      } else {
        setError(fetchError.message || "गायीची माहिती मिळाली नाही.");
      }
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCow();
  }, [fetchCow]);

  async function updateCow(form) {
    setSaveError("");
    setSuccess("");

    try {
      const result = await saveCow(cleanCowPayload(form), params.id);
      setSuccess(
        result.offline
          ? "⏳ बदल फोनवर साठवले. इंटरनेट आल्यावर आपोआप समक्रमण होतील."
          : "बदल यशस्वीरित्या जतन झाले! 🐄"
      );
      window.setTimeout(() => router.push(`/gayi/${params.id}`), 900);
    } catch {
      setSaveError("बदल जतन करताना चूक झाली.");
      return;
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCow} />;
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
        <PageHeader title="✏️ गाय संपादित करा" subtitle={cow?.name} />
        <CowForm
          initialCow={cow}
          submitLabel="✅ बदल जतन करा"
          submittingLabel="⏳ बदल जतन होत आहेत..."
          onSubmit={updateCow}
          backHref={`/gayi/${params.id}`}
          error={saveError}
          success={success}
        />
      </div>
    </AdminOnly>
  );
}
