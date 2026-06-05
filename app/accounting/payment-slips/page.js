"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import {
  formatCurrency,
  formatLitres,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";

function getCurrentYear() {
  return Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Kolkata",
      year: "numeric"
    }).format(new Date())
  );
}

function statusTone(status) {
  if (status === "uploaded") {
    return {
      card: "border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 text-green-950",
      badge: "bg-green-600 text-white",
      dot: "bg-green-500"
    };
  }

  if (status === "missing") {
    return {
      card: "border-red-200 bg-gradient-to-br from-red-50 via-white to-rose-50 text-red-950",
      badge: "bg-red-600 text-white",
      dot: "bg-red-500"
    };
  }

  if (status === "not_due") {
    return {
      card: "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 text-blue-950",
      badge: "bg-blue-600 text-white",
      dot: "bg-blue-500"
    };
  }

  return {
    card: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800",
    badge: "bg-slate-500 text-white",
    dot: "bg-slate-400"
  };
}

function PeriodStatusCard({ period }) {
  const tone = statusTone(period?.status);

  if (!period) {
    return null;
  }

  return (
    <article className={`min-h-[238px] rounded-2xl border p-4 shadow-soft ${tone.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-black text-slate-500">{period.period_label}</p>
          <h3 className="mt-1 text-[21px] font-black leading-tight">{period.status_label}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-black ${tone.badge}`}>
          {period.status === "uploaded" ? "जतन" : period.status === "missing" ? "बाकी" : "माहिती"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[14px] font-extrabold">
        <p className="rounded-xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-white/80">
          सुरू<br />
          <span className="text-[15px] text-slate-950">{formatMarathiDate(period.start_date)}</span>
        </p>
        <p className="rounded-xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-white/80">
          शेवट<br />
          <span className="text-[15px] text-slate-950">{formatMarathiDate(period.end_date)}</span>
        </p>
      </div>

      {period.status === "uploaded" ? (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <p className="rounded-xl bg-white/80 px-3 py-2 text-[14px] font-extrabold shadow-sm ring-1 ring-white/80">
              दूध<br />
              <span className="text-[17px] text-slate-950">
                {formatLitres(period.settlement?.total_liters || 0)}
              </span>
            </p>
            <p className="rounded-xl bg-white/80 px-3 py-2 text-[14px] font-extrabold shadow-sm ring-1 ring-white/80">
              दूध उत्पन्न<br />
              <span className="text-[17px] text-green-800">
                {formatCurrency(period.settlement?.total_milk_income || 0)}
              </span>
            </p>
          </div>
          <p className="rounded-xl bg-white/80 px-3 py-2 text-[14px] font-extrabold shadow-sm ring-1 ring-white/80">
            खाद्य कपात:{" "}
            <span className="text-red-700">{formatCurrency(period.settlement?.cattle_feed_deduction || 0)}</span>
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-white/80 px-3 py-1 text-[13px] font-black text-slate-700 shadow-sm ring-1 ring-white/80">
              {period.source} नोंद
            </span>
            <Link
              href={`/accounting/settlements/${period.settlement?.id}/edit`}
              className="rounded-full bg-slate-950 px-3 py-1 text-[13px] font-black text-white shadow-sm active:bg-slate-800"
            >
              तपशील →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="min-h-[72px] rounded-xl bg-white/75 px-3 py-3 text-[16px] font-extrabold leading-snug shadow-sm ring-1 ring-white/80">
            {period.message}
          </p>
          {period.status === "missing" ? (
            <Link
              href={period.upload_href || "/accounting/slip-scan"}
              className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl bg-sheti px-4 text-[17px] font-black text-white shadow-sm active:bg-green-800"
            >
              📷 ही स्लिप upload करा
            </Link>
          ) : (
            <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[14px] font-extrabold text-slate-600 shadow-sm ring-1 ring-white/80">
              Due date: {formatMarathiDate(period.due_date)}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function SummaryCard({ emoji, label, value, tone }) {
  const tones = {
    green: "border-green-100 bg-green-50 text-green-950",
    red: "border-red-100 bg-red-50 text-red-950",
    blue: "border-blue-100 bg-blue-50 text-blue-950",
    slate: "border-slate-200 bg-slate-950 text-white"
  };

  return (
    <article className={`rounded-2xl border p-4 shadow-soft ${tones[tone] || tones.green}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[30px]" aria-hidden="true">{emoji}</span>
        <span className="text-[28px] font-black leading-none">{toMarathiNumerals(value)}</span>
      </div>
      <p className="mt-2 text-[15px] font-black leading-tight opacity-75">{label}</p>
    </article>
  );
}

export default function PaymentSlipsStatusPage() {
  const currentYear = getCurrentYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const yearOptions = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => currentYear - index);
  }, [currentYear]);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchJson(`/api/accounting/payment-slips/status?year=${year}`, {
        cacheTtlMs: 10 * 1000
      });
      setData(response || null);
    } catch (loadError) {
      setError(loadError.message || "Payment slip माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (loading) {
    return <LoadingState text="१५ दिवसांच्या payment slips तपासत आहे..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadStatus} />;
  }

  const summary = data?.summary || {};
  const months = data?.months || [];

  return (
    <div className="dashboard-enter space-y-6 pb-4">
      <PageHeader
        title="🧾 Payment Slip स्थिती"
        subtitle="वर्षानुसार १५ दिवसांच्या payment slips upload/save झाल्या आहेत का ते इथे पहा"
      />

      <section className="dashboard-hero overflow-hidden rounded-2xl px-4 pb-5 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[16px] font-black text-green-100">फक्त १५ दिवसांच्या slips</p>
              <h1 className="mt-1 text-[34px] font-black leading-tight">
                {toMarathiNumerals(year)} वर्षाचा हिशोब
              </h1>
              <p className="mt-2 text-[18px] font-bold leading-snug text-green-50">
                प्रत्येक महिन्यात १-१५ आणि १६-अखेर अशा दोन payment slips तपासल्या जातात.
              </p>
            </div>
            <label className="block shrink-0">
              <span className="mb-2 block text-[14px] font-black text-green-100">वर्ष निवडा</span>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="min-h-[52px] rounded-xl border-0 bg-white px-4 text-[18px] font-black text-slate-950 shadow-sm outline-none"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-4 gap-2 rounded-2xl p-2">
            <div className="rounded-xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15">
              <p className="text-[12px] font-black text-green-50/90">एकूण</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(summary.totalPeriods || 0)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15">
              <p className="text-[12px] font-black text-green-50/90">झाल्या</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(summary.uploaded || 0)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15">
              <p className="text-[12px] font-black text-green-50/90">बाकी</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(summary.missing || 0)}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15">
              <p className="text-[12px] font-black text-green-50/90">Due नाही</p>
              <p className="mt-1 text-[24px] font-black">{toMarathiNumerals(summary.notDue || 0)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard emoji="✅" label="अपलोड/जतन झाल्या" value={summary.uploaded || 0} tone="green" />
        <SummaryCard emoji="⚠️" label="अपलोड केलेल्या नाहीत" value={summary.missing || 0} tone="red" />
        <SummaryCard emoji="⏳" label="अजून due नाहीत" value={summary.notDue || 0} tone="blue" />
        <SummaryCard emoji="📋" label="एकूण periods" value={summary.totalPeriods || 0} tone="slate" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[26px] font-black text-slate-950">वर्षानुसार table</h2>
            <p className="mt-1 text-[16px] font-bold text-slate-500">
              हिरवे = जतन झाले, लाल = upload बाकी, निळे = अजून due नाही.
            </p>
          </div>
          <Link
            href="/accounting/pending-slips"
            className="inline-flex min-h-[46px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-[16px] font-black text-slate-800 active:bg-slate-100"
          >
            फक्त बाकी slips →
          </Link>
        </div>

        <div className="space-y-4">
          {months.map((month) => (
            <section key={month.month_key} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[23px] font-black text-slate-950">{month.month_label}</h3>
                  <p className="mt-0.5 text-[14px] font-bold text-slate-500">
                    {toMarathiNumerals(month.uploaded_count || 0)} जतन · {toMarathiNumerals(month.missing_count || 0)} बाकी
                  </p>
                </div>
                {month.missing_count > 0 ? (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-[13px] font-black text-red-800">
                    upload बाकी
                  </span>
                ) : month.uploaded_count === 2 ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-[13px] font-black text-green-800">
                    पूर्ण
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[13px] font-black text-blue-800">
                    चालू
                  </span>
                )}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <PeriodStatusCard period={month.first} />
                <PeriodStatusCard period={month.second} />
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
