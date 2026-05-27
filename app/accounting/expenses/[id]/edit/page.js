"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ExpenseForm from "@/components/accounting/ExpenseForm";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { fetchJson } from "@/lib/offlineActions";

export default function EditExpensePage() {
  const params = useParams();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExpense = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchJson(`/api/accounting/expenses/${params.id}`);
      setExpense(data);
    } catch (fetchError) {
      setError(fetchError.message || "खर्च नोंद मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadExpense();
  }, [loadExpense]);

  if (loading) {
    return <LoadingState text="खर्च नोंद लोड होत आहे..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadExpense} />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="💸 खर्च संपादित करा" subtitle="रक्कम किंवा तपशील बदला" />
      <ExpenseForm initialData={expense} />
    </div>
  );
}
