"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import StatusBadge from "@/components/StatusBadge";
import { calfStatuses, getCalfMilkStatus } from "@/lib/calfLifecycle";
import {
  calculateAgeMarathi,
  formatCowBreed,
  formatCurrency,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { deleteCow, fetchCowProfile } from "@/lib/offlineActions";

const pregnancyLabels = {
  positive: "गर्भधारणा झाली",
  negative: "गर्भधारणा नाही",
  pending: "प्रलंबित"
};

function Section({ title, subtitle, actionHref, actionText, children }) {
  return (
    <section className="dashboard-panel overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[24px] font-extrabold leading-tight text-slate-950">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[17px] font-bold leading-snug text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actionHref && actionText ? (
          <Link
            href={actionHref}
            className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-center text-[18px] font-extrabold text-white shadow-sm active:bg-green-700"
          >
            {actionText}
          </Link>
        ) : null}
      </div>
      <div className="relative z-10 mt-4">{children}</div>
    </section>
  );
}

function EmptyMessage({ children }) {
  return (
    <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[19px] font-bold leading-relaxed text-slate-600">
      {children}
    </p>
  );
}

function QuickStat({ label, value, subtext, tone = "slate" }) {
  const tones = {
    slate: "bg-white text-slate-950 ring-slate-200",
    green: "bg-green-50 text-green-950 ring-green-100",
    blue: "bg-blue-50 text-blue-950 ring-blue-100",
    amber: "bg-amber-50 text-amber-950 ring-amber-100"
  };

  return (
    <article className={`rounded-lg p-4 shadow-sm ring-1 ${tones[tone] || tones.slate}`}>
      <p className="text-[15px] font-extrabold leading-tight opacity-70">{label}</p>
      <p className="mt-2 break-words text-[19px] font-black leading-tight sm:text-[25px]">
        {value}
      </p>
      {subtext ? (
        <p className="mt-1 text-[15px] font-bold leading-snug opacity-70">{subtext}</p>
      ) : null}
    </article>
  );
}

function DetailPill({ label, value }) {
  return (
    <div className="rounded-lg bg-white/95 px-3 py-2 shadow-sm ring-1 ring-white/60">
      <p className="text-[13px] font-extrabold leading-tight text-slate-500">{label}</p>
      <p className="mt-1 break-words text-[18px] font-extrabold leading-tight text-slate-950">
        {value || "माहिती नाही"}
      </p>
    </div>
  );
}

export default function GayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  const fetchCow = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchCowProfile(params.id);
      setProfile(result.data);
    } catch (fetchError) {
      setError(fetchError.message || "गायीची माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCow();
  }, [fetchCow]);

  const records = profile?.records || {};
  const cow = profile?.cow;
  const aiRecords = records.ai_records || [];
  const healthRecords = records.health_records || [];
  const calves = records.calves || [];

  const lastCalvingDate = useMemo(() => {
    const currentCalvingRecords = profile?.records?.calving_records || [];
    const calvingRecord = currentCalvingRecords.find(
      (record) => record.actual_date || record.expected_date
    );

    return calvingRecord
      ? formatMarathiDate(calvingRecord.actual_date || calvingRecord.expected_date)
      : "नाही";
  }, [profile]);

  async function removeCow() {
    if (!cow) {
      return;
    }

    const confirmed = window.confirm(
      `तुम्हाला खरंच ${cow.name} ला यादीतून काढायचे आहे का?`
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setDeleteMessage("");

    try {
      const result = await deleteCow(params.id, cow.name);

      if (result.offline) {
        setDeleteMessage("⏳ गाय फोनवरून काढली. इंटरनेट आल्यावर बदल समक्रमित होईल.");
      }

      router.push("/gayi");
    } catch (deleteFailure) {
      setDeleteError(deleteFailure.message || "गाय काढताना चूक झाली.");
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
    <div className="space-y-5">
      <section className="dashboard-hero overflow-hidden rounded-lg p-4 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/gayi"
              className="flex min-h-[44px] items-center justify-center rounded-lg bg-white/15 px-3 text-[17px] font-extrabold text-white ring-1 ring-white/20 backdrop-blur active:bg-white/25"
            >
              ← गायी
            </Link>
            <AdminOnly>
              <Link
                href={`/gayi/${cow.id}/edit`}
                className="flex min-h-[44px] items-center justify-center rounded-lg bg-white px-3 text-[17px] font-extrabold text-green-800 shadow-sm active:bg-green-50"
              >
                ✏️ संपादित करा
              </Link>
            </AdminOnly>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="h-40 w-full overflow-hidden rounded-lg border border-white/30 bg-white/15 shadow-soft ring-1 ring-white/20 sm:h-44 sm:w-44 sm:shrink-0">
              {cow.photo_url ? (
                <img src={cow.photo_url} alt={cow.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-[72px]">
                  🐄
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex rounded-full bg-white/15 p-1 ring-1 ring-white/20 backdrop-blur">
                <StatusBadge status={cow.status} />
              </div>
              <h1 className="mt-3 break-words text-[38px] font-black leading-tight">
                {cow.name}
              </h1>
              <p className="mt-2 text-[19px] font-bold leading-snug text-green-50">
                {formatCowBreed(cow.breed)} {cow.color ? `• ${cow.color}` : ""}
              </p>
            </div>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-2 gap-2 rounded-lg p-2 sm:grid-cols-4">
            <DetailPill label="वय" value={calculateAgeMarathi(cow.date_of_birth)} />
            <DetailPill label="रंग" value={cow.color || "माहिती नाही"} />
            <DetailPill label="जात" value={formatCowBreed(cow.breed)} />
            <DetailPill label="कान टॅग" value={cow.tag_number || "नाही"} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2" aria-label="झटपट माहिती">
        <QuickStat
          label="रेतन"
          value={`${toMarathiNumerals(aiRecords.length)} वेळा`}
          subtext="इतिहास"
          tone="green"
        />
        <QuickStat
          label="शेवटचे व्यायण"
          value={lastCalvingDate}
          subtext="नोंद"
          tone="blue"
        />
        <QuickStat
          label="वासरे"
          value={toMarathiNumerals(calves.length)}
          subtext="या गायीची"
          tone="amber"
        />
      </section>

      <Section
        title="वासरांचा इतिहास"
        subtitle="या गायीपासून झालेली वासरे"
        actionHref="/vasare"
        actionText="🐮 वासरे बघा"
      >
        {calves.length > 0 ? (
          <div className="space-y-3">
            {calves.map((calf) => (
              <article
                key={calf.id}
                className="dashboard-card overflow-hidden rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-green-50 p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-white bg-white shadow-sm ring-1 ring-amber-100">
                    {calf.photo_url ? (
                      <img src={calf.photo_url} alt={calf.name || "वासरू"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[28px]">🐮</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[20px] font-extrabold leading-tight text-slate-950">
                      {calf.name || (calf.gender === "मादी" ? "मादी वासरी" : "नर वासरू")}
                    </p>
                    <p className="mt-1 text-[17px] font-bold leading-snug text-slate-700">
                      जन्म: {formatMarathiDate(calf.birth_date)}
                    </p>
                    <p className="mt-1 text-[17px] font-bold leading-snug text-slate-700">
                      वय: {calculateAgeMarathi(calf.birth_date)}
                    </p>
                    <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-[17px] font-bold leading-snug text-green-900 ring-1 ring-green-100">
                      दूध स्थिती: {getCalfMilkStatus(calf)}
                    </p>
                    {calf.status === "sold" ? (
                      <p className="mt-2 text-[17px] font-extrabold leading-snug text-green-700">
                        विक्री: {formatMarathiDate(calf.sold_date)} | {formatCurrency(calf.sale_amount || 0)}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 rounded-full bg-white px-3 py-1 text-[15px] font-extrabold text-sheti shadow-sm ring-1 ring-green-100">
                    {calfStatuses[calf.status] || calf.status}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage>या गायीची वासरांची नोंद नाही.</EmptyMessage>
        )}
      </Section>

      <Section
        title="कृत्रिम रेतन इतिहास"
        subtitle="रेतन, बैल कोड आणि गर्भधारणा निकाल"
        actionHref={`/nondi/ai?cow_id=${cow.id}`}
        actionText="➕ कृत्रिम रेतन नोंद करा"
      >
        {aiRecords.length > 0 ? (
          <div className="space-y-3">
            {aiRecords.map((record) => (
              <article
                key={record.id}
                className="dashboard-card rounded-lg border border-green-100 bg-gradient-to-br from-green-50 via-white to-slate-50 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[20px] font-extrabold text-slate-950">
                      {formatMarathiDate(record.ai_date)}
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-slate-700">
                      बैल कोड: {record.bull_code || "नाही"}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-[15px] font-extrabold text-green-800">
                    {pregnancyLabels[record.pregnancy_result] || "प्रलंबित"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage>कृत्रिम रेतन नोंद अजून नाही.</EmptyMessage>
        )}
      </Section>

      <Section
        title="आरोग्य इतिहास"
        subtitle="उपचार, लसीकरण आणि आरोग्य नोंदी"
        actionHref={`/nondi/arogya?cow_id=${cow.id}`}
        actionText="🏥 आरोग्य नोंद करा"
      >
        {healthRecords.length > 0 ? (
          <div className="space-y-3">
            {healthRecords.map((record) => (
              <article
                key={record.id}
                className="dashboard-card rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[20px] font-extrabold text-slate-950">
                      {formatMarathiDate(record.date)}
                    </p>
                    <p className="mt-1 text-[18px] font-bold text-slate-700">
                      वर्णन: {record.description || "नोंद नाही"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-[15px] font-extrabold text-blue-800">
                    {record.type}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage>आरोग्य नोंद अजून नाही.</EmptyMessage>
        )}
      </Section>

      <AdminOnly>
        <section className="rounded-lg border-2 border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50 p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-red-800">धोक्याची कृती</h2>
          <p className="mt-2 text-[18px] font-semibold leading-relaxed text-red-700">
            गाय यादीतून काढली तरी जुनी माहिती जतन राहील.
          </p>
          {deleteError ? (
            <p className="mt-3 text-[18px] font-extrabold text-red-800">{deleteError}</p>
          ) : null}
          {deleteMessage ? (
            <p className="mt-3 text-[18px] font-extrabold text-yellow-900">{deleteMessage}</p>
          ) : null}
          <button
            type="button"
            onClick={removeCow}
            className="mt-4 min-h-[52px] w-full rounded-lg bg-tatkal px-4 text-[19px] font-extrabold text-white shadow-sm active:bg-red-700"
          >
            🗑️ ही गाय काढून टाका
          </button>
        </section>
      </AdminOnly>
    </div>
  );
}
