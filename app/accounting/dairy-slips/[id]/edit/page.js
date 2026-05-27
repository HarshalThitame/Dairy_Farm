"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import { fetchJson } from "@/lib/offlineActions";

export default function EditDairySlipPage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState("");

  const loadAndRedirect = useCallback(async () => {
    setError("");

    try {
      const slip = await fetchJson(`/api/accounting/dairy-slips/${params.id}`);
      router.replace(`/nondi/dudh?date=${encodeURIComponent(slip.slip_date)}`);
    } catch (fetchError) {
      setError(fetchError.message || "दूध नोंद मिळाली नाही.");
    }
  }, [params.id, router]);

  useEffect(() => {
    loadAndRedirect();
  }, [loadAndRedirect]);

  if (error) {
    return <ErrorState message={error} onRetry={loadAndRedirect} />;
  }

  return <LoadingState text="दैनिक दूध नोंदीकडे जात आहे..." />;
}
