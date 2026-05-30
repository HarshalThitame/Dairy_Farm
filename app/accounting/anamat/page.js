"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { showToast } from "@/components/Toast";
import { fetchJson } from "@/lib/offlineActions";
import { formatMarathiDate, toMarathiCurrency, toMarathiNumerals } from "@/lib/marathiUtils";

function availableAmount(record) {
  return Math.max(0, Number(record.amount_cut || 0) - Number(record.claimed_amount || 0));
}

export default function AnamatPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  const [error, setError] = useState("");

  const loadAnamat = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchJson("/api/accounting/anamat/status");
      setData(result);
    } catch (fetchError) {
      setError(fetchError.message || "अनामत माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnamat();
  }, [loadAnamat]);

  async function submitClaim(event) {
    event.preventDefault();
    const amount = Number(claimAmount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("क्लेम रक्कम नीट भरा.");
      return;
    }

    if (amount > Number(data?.totalAvailableToClaim || 0)) {
      setError("क्लेम रक्कम उपलब्ध शिल्लकपेक्षा जास्त आहे.");
      return;
    }

    const confirmed = window.confirm(`तुम्हाला ${toMarathiCurrency(amount)} अनामत क्लेम करायची आहे का?`);
    if (!confirmed) {
      return;
    }

    setClaiming(true);
    setError("");
    try {
      const result = await fetchJson("/api/accounting/anamat/claim", {
        method: "POST",
        body: JSON.stringify({
          claimAmount: amount,
          claimNotes
        })
      });
      showToast(result.message || "✅ अनामत मिळाली म्हणून नोंद झाली.", "success");
      setClaimOpen(false);
      setClaimAmount("");
      setClaimNotes("");
      await loadAnamat();
    } catch (claimError) {
      setError(claimError.message || "अनामत क्लेम झाला नाही.");
    } finally {
      setClaiming(false);
    }
  }

  const available = Number(data?.totalAvailableToClaim || 0);
  const records = data?.records || [];
  const oldestDate = data?.oldestCutDate;
  const eligible = Boolean(data?.eligibleForFullClaim);

  return (
    <div className="space-y-6">
      <PageHeader title="🏦 अनामत खाते" subtitle="साठवलेली रक्कम, दावा आणि शिल्लक" />

      {loading ? <LoadingState text="अनामत माहिती लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={loadAnamat} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <SummaryCard emoji="💰" title="एकूण जमा" value={toMarathiCurrency(data?.totalAccumulated || 0)} subtext={`${toMarathiNumerals(data?.recordCount || 0)} नोंदी`} color="yellow" />
            <SummaryCard emoji="📤" title="परत मिळाले" value={toMarathiCurrency(data?.totalClaimed || 0)} subtext="डेअरीकडून मिळाले" color="green" />
            <SummaryCard emoji="🏦" title="उपलब्ध शिल्लक" value={toMarathiCurrency(available)} subtext="आत्ता क्लेम करू शकता" color="blue" />
            <SummaryCard emoji="⏰" title="१ वर्ष पूर्ण" value={eligible ? "हो" : "नाही"} subtext={oldestDate ? `पहिली कपात: ${formatMarathiDate(oldestDate)}` : "नोंद नाही"} color={eligible ? "green" : "yellow"} />
          </section>

          <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-soft">
            <h2 className="text-[23px] font-extrabold text-yellow-950">अनामत म्हणजे काय?</h2>
            <p className="mt-2 text-[18px] font-bold leading-relaxed text-yellow-900">
              डेअरी सेटलमेंटमधून काही रक्कम साठवून ठेवली जाते. ही खर्च नसून बचत आहे. डेअरीच्या नियमानुसार साधारण १ वर्षानंतर किंवा गरजेनुसार परत मिळू शकते.
            </p>
          </section>

          <button
            type="button"
            disabled={available <= 0}
            onClick={() => {
              setClaimAmount(String(available || ""));
              setClaimOpen(true);
            }}
            className="min-h-[60px] w-full rounded-lg bg-sheti px-4 text-[21px] font-extrabold text-white shadow-soft disabled:bg-slate-400"
          >
            💰 अनामत मिळाली
          </button>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[24px] font-extrabold text-slate-950">अनामत नोंदी</h2>
            <div className="mt-4 space-y-3">
              {records.length > 0 ? (
                records.map((record) => (
                  <article key={record.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[19px] font-extrabold text-slate-950">
                          {formatMarathiDate(record.cut_date)}
                        </p>
                        <p className="mt-1 text-[16px] font-bold text-slate-600">
                          {formatMarathiDate(record.settlement_period_start)} - {formatMarathiDate(record.settlement_period_end)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[20px] font-extrabold text-yellow-900">{toMarathiCurrency(record.amount_cut)}</p>
                        <p className="mt-1 text-[15px] font-bold text-slate-600">
                          शिल्लक {toMarathiCurrency(availableAmount(record))}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-[19px] font-bold text-slate-600">
                  अजून अनामत नोंद नाही.
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}

      {claimOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <form onSubmit={submitClaim} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-2xl">
            <h2 className="text-[25px] font-extrabold text-slate-950">अनामत मिळाली</h2>
            <p className="mt-2 text-[18px] font-bold text-slate-700">
              उपलब्ध: {toMarathiCurrency(available)}
            </p>
            <label className="mt-4 block">
              <span className="text-[20px] font-extrabold text-slate-900">किती रक्कम मिळाली?</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max={available}
                step="0.01"
                value={claimAmount}
                onChange={(event) => setClaimAmount(event.target.value)}
                className="mt-2 min-h-[56px] w-full rounded-lg border-2 border-slate-200 px-4 text-[22px] font-extrabold outline-none focus:border-sheti"
              />
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[0.25, 0.5, 1].map((part) => (
                <button
                  key={part}
                  type="button"
                  onClick={() => setClaimAmount(String(Number((available * part).toFixed(2))))}
                  className="min-h-[46px] rounded-lg border border-green-200 bg-green-50 text-[17px] font-extrabold text-sheti"
                >
                  {toMarathiNumerals(part * 100)}%
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-[20px] font-extrabold text-slate-900">नोंद</span>
              <textarea
                value={claimNotes}
                onChange={(event) => setClaimNotes(event.target.value)}
                className="mt-2 min-h-[90px] w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-[19px] font-bold outline-none focus:border-sheti"
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setClaimOpen(false)}
                className="min-h-[54px] rounded-lg border-2 border-slate-200 px-4 text-[19px] font-extrabold text-slate-700"
              >
                बंद करा
              </button>
              <button
                type="submit"
                disabled={claiming}
                className="min-h-[54px] rounded-lg bg-sheti px-4 text-[19px] font-extrabold text-white disabled:bg-slate-400"
              >
                {claiming ? "नोंद होत आहे..." : "✅ नोंद करा"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
