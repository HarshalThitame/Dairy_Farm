"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { fetchJson } from "@/lib/offlineActions";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

function PeriodCard({ period }) {
  return (
    <article className="dashboard-card rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-green-50 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-amber-700">अपलोड बाकी</p>
          <h3 className="mt-1 text-[23px] font-black leading-tight text-slate-950">
            {period.period_label}
          </h3>
          <p className="mt-2 text-[16px] font-bold leading-snug text-slate-600">
            देय तारीख: {formatMarathiDate(period.due_date)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-2 text-[16px] font-extrabold text-amber-900 shadow-sm ring-1 ring-amber-100">
          {toMarathiNumerals(period.days_overdue || 0)} दिवस
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[15px] font-extrabold">
        <p className="rounded-lg bg-white/80 px-3 py-2 text-slate-700">
          सुरू: {formatMarathiDate(period.start_date)}
        </p>
        <p className="rounded-lg bg-white/80 px-3 py-2 text-slate-700">
          शेवट: {formatMarathiDate(period.end_date)}
        </p>
      </div>

      <Link
        href={period.upload_href || "/accounting/slip-scan"}
        className="mt-4 flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white shadow-sm active:bg-green-800"
      >
        📷 ही स्लिप अपलोड करा
      </Link>
    </article>
  );
}

export default function PendingSettlementSlipsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPendingSlips = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchJson("/api/accounting/pending-settlement-slips", {
        cacheTtlMs: 10 * 1000
      });
      setData(response || null);
    } catch (loadError) {
      setError(loadError.message || "बाकी स्लिप माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingSlips();
  }, [loadPendingSlips]);

  if (loading) {
    return <LoadingState text="बाकी देयक स्लिप तपासत आहे..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadPendingSlips} />;
  }

  const pendingCount = Number(data?.pendingCount || 0);
  const months = data?.months || [];

  return (
    <div className="dashboard-enter space-y-5 pb-2">
      <PageHeader
        title="📋 बाकी देयक स्लिप"
        subtitle="कोणत्या महिन्याची १५ दिवसांची स्लिप अपलोड करायची राहिली आहे ते इथे दिसेल"
      />

      <section className="dashboard-hero overflow-hidden rounded-lg px-4 pb-4 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <p className="text-[16px] font-extrabold text-green-100">स्लिप तपासणी</p>
          <h1 className="mt-1 text-[34px] font-black leading-tight">
            {toMarathiNumerals(pendingCount)} स्लिप बाकी
          </h1>
          <p className="mt-2 text-[18px] font-bold leading-snug text-green-50">
            १-१५ ची स्लिप १६ तारखेपासून आणि १६-शेवटची स्लिप पुढच्या महिन्याच्या १ तारखेपासून बाकी धरली जाते.
          </p>
          <div className="dashboard-glass mt-5 grid grid-cols-2 gap-2 rounded-lg p-2">
            <div className="rounded-lg bg-white/10 px-3 py-3 text-center ring-1 ring-white/20">
              <p className="text-[13px] font-extrabold text-green-50/90">आजपासून बाकी</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(data?.dueTodayCount || 0)}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-3 text-center ring-1 ring-white/20">
              <p className="text-[13px] font-extrabold text-green-50/90">मागील बाकी</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(data?.overdueCount || 0)}</p>
            </div>
          </div>
        </div>
      </section>

      {pendingCount === 0 ? (
        <section className="dashboard-panel rounded-lg border border-green-200 bg-green-50 p-6 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[36px] shadow-sm">
            ✅
          </div>
          <h2 className="mt-4 text-[25px] font-black text-green-900">
            सध्या कोणतीही देयक स्लिप बाकी नाही.
          </h2>
          <p className="mt-2 text-[17px] font-bold leading-snug text-green-800">
            १५ दिवसांची पुढील due तारीख आल्यावर इथे banner दिसेल.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {months.map((month) => (
            <section key={month.month_key} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[24px] font-black text-slate-950">
                  {month.month_label}
                </h2>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-[16px] font-extrabold text-white">
                  {toMarathiNumerals(month.count)}
                </span>
              </div>
              <div className="space-y-3">
                {(month.periods || []).map((period) => (
                  <PeriodCard key={period.id} period={period} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
