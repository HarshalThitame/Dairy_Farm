"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import MonthSelector from "@/components/accounting/MonthSelector";
import ReconciliationViewer from "@/components/accounting/ReconciliationViewer";
import SettlementCard from "@/components/accounting/SettlementCard";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { fetchJson, fetchSettlements } from "@/lib/offlineActions";
import { toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";
import { getIndiaMonthParts } from "@/lib/reportUtils";

function getInitialMonth() {
  return getIndiaMonthParts();
}

export default function SettlementsPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchSettlements(monthValue.month, monthValue.year);
      setData(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "सेटलमेंट माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  async function markPaid(settlement) {
    try {
      await fetchJson(`/api/accounting/settlements/${settlement.id}`, {
        method: "PATCH",
        body: JSON.stringify({ payment_received: true })
      });
      loadSettlements();
    } catch (patchError) {
      setError(patchError.message || "पेमेंट स्थिती बदलली नाही.");
    }
  }

  async function deleteSettlement(settlement) {
    if (!window.confirm("हे सेटलमेंट काढायचे का?")) {
      return;
    }

    try {
      await fetchJson(`/api/accounting/settlements/${settlement.id}`, { method: "DELETE" });
      loadSettlements();
    } catch (deleteError) {
      setError(deleteError.message || "सेटलमेंट काढले नाही.");
    }
  }

  const summary = data?.summary || {};
  const currentSettlement = data?.settlements?.[0] || null;
  const currentReconciliation = currentSettlement
    ? data?.reconciliation?.find((item) => item.settlement_id === currentSettlement.id)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="📋 १५ दिवसांचे पेमेंट"
        subtitle="दुग्ध देयक / Settlement"
        action={
          <Link href="/accounting/settlements/new" className="flex min-h-[52px] items-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white active:bg-green-700">
            + नवीन
          </Link>
        }
      />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="सेटलमेंट लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadSettlements} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard emoji="💰" title="उत्पन्न" value={toMarathiCurrency(summary.totalMilkIncome || 0)} subtext="दूध विक्रीतून" color="green" />
            <SummaryCard emoji="📉" title="कुल कपात" value={toMarathiCurrency(summary.totalDeductions || 0)} subtext="खाद्य + इतर" color="red" />
            <SummaryCard emoji="✅" title="शुद्ध देय" value={toMarathiCurrency(summary.netPayable || 0)} subtext="देय रक्कम" color={Number(summary.netPayable || 0) >= 0 ? "green" : "red"} />
            <SummaryCard
              emoji="⏳"
              title="पेमेंट स्थिती"
              value={`${toMarathiNumerals(summary.received || 0)}/${toMarathiNumerals(data?.settlements?.length || 0)}`}
              subtext="प्राप्त सेटलमेंट"
              color="yellow"
            />
          </section>

          {currentReconciliation ? <ReconciliationViewer reconciliation={currentReconciliation} /> : null}

          <section className="space-y-3">
            <h2 className="text-[24px] font-extrabold text-slate-950">सेटलमेंट इतिहास</h2>
            {data?.settlements?.length > 0 ? (
              data.settlements.map((settlement) => (
                <SettlementCard key={settlement.id} settlement={settlement} onMarkPaid={markPaid} onDelete={deleteSettlement} />
              ))
            ) : (
              <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-soft">
                <p className="text-[22px] font-extrabold text-slate-700">अजून सेटलमेंट नोंद नाही.</p>
                <Link href="/accounting/settlements/new" className="mt-4 inline-flex min-h-[56px] items-center rounded-lg bg-sheti px-5 text-[20px] font-extrabold text-white active:bg-green-700">
                  + सेटलमेंट जोडा
                </Link>
              </div>
            )}
          </section>
        </>
      ) : null}

      <Link href="/accounting/settlements/new" className="fixed bottom-24 right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-sheti text-[34px] font-extrabold text-white shadow-lg active:bg-green-700" aria-label="नवीन सेटलमेंट">
        +
      </Link>
    </div>
  );
}
