"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SettlementForm from "@/components/accounting/SettlementForm";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { fetchJson } from "@/lib/offlineActions";

export default function EditSettlementPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSettlement = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJson(`/api/accounting/settlements/${params.id}`);
      setData(result);
    } catch (fetchError) {
      setError(fetchError.message || "सेटलमेंट मिळाले नाही.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadSettlement();
  }, [loadSettlement]);

  if (loading) {
    return <LoadingState text="सेटलमेंट लोड होत आहे..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSettlement} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="📋 सेटलमेंट संपादित करा" subtitle="देयक आणि फरक तपासा" />
      <SettlementForm initialData={data.settlement} initialReconciliation={data.reconciliation} />
    </div>
  );
}
