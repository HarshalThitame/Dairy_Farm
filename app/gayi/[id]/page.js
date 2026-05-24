"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import StatusBadge from "@/components/StatusBadge";
import {
  calculateAgeMarathi,
  formatCowBreed,
  formatLitres,
  formatMarathiDate,
  getCurrentMonthRange,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { deleteCow, fetchCowProfile } from "@/lib/offlineActions";

const pregnancyLabels = {
  positive: "गर्भधारणा झाली",
  negative: "गर्भधारणा नाही",
  pending: "प्रलंबित"
};

function Section({ title, actionHref, actionText, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[24px] font-extrabold leading-tight text-slate-950">
          {title}
        </h2>
        <Link
          href={actionHref}
          className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-center text-[18px] font-extrabold text-white shadow-sm active:bg-green-700"
        >
          {actionText}
        </Link>
      </div>
      <div className="mt-4">{children}</div>
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
  const milkRecords = records.milk_records || [];
  const aiRecords = records.ai_records || [];
  const healthRecords = records.health_records || [];

  const thisMonthMilk = useMemo(() => {
    const currentMonth = getCurrentMonthRange();
    const currentMilkRecords = profile?.records?.milk_records || [];

    return currentMilkRecords
      .filter((record) => record.date?.startsWith(currentMonth))
      .reduce((total, record) => total + Number(record.total_litres || 0), 0);
  }, [profile]);

  const lastCalvingDate = useMemo(() => {
    const currentCalvingRecords = profile?.records?.calving_records || [];
    const calvingRecord = currentCalvingRecords.find(
      (record) => record.actual_date || record.expected_date
    );

    return calvingRecord
      ? formatMarathiDate(calvingRecord.actual_date || calvingRecord.expected_date)
      : "नाही";
  }, [profile]);

  const lastSevenDaysMilk = useMemo(() => {
    const currentMilkRecords = profile?.records?.milk_records || [];
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);

    return currentMilkRecords
      .filter((record) => {
        const recordDate = new Date(`${record.date}T00:00:00`);
        return recordDate >= cutoff;
      })
      .sort((first, second) => second.date.localeCompare(first.date));
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
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[30px] font-extrabold leading-tight text-slate-950">
              {cow.name}
            </h1>
            <div className="mt-3">
              <StatusBadge status={cow.status} />
            </div>
          </div>
          <AdminOnly>
            <Link
              href={`/gayi/${cow.id}/edit`}
              className="flex min-h-[52px] shrink-0 items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 px-3 text-[18px] font-extrabold text-sheti active:bg-green-100"
            >
              ✏️ संपादित करा
            </Link>
          </AdminOnly>
        </div>

        <div className="mt-4 space-y-2 text-[19px] font-semibold leading-snug text-slate-700">
          <p>
            जात: {formatCowBreed(cow.breed)} <span className="text-slate-300">|</span>{" "}
            रंग: {cow.color || "माहिती नाही"}
          </p>
          <p>वय: {calculateAgeMarathi(cow.date_of_birth)}</p>
          {cow.tag_number ? <p>कान टॅग नंबर: {cow.tag_number}</p> : null}
        </div>
      </section>

      <section className="-mx-4 overflow-x-auto px-4" aria-label="झटपट माहिती">
        <div className="flex gap-3 pb-1">
          <article className="min-w-[170px] rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-[18px] font-bold text-slate-600">या महिन्याचे दूध</p>
            <p className="mt-2 text-[25px] font-extrabold text-slate-950">
              {formatLitres(thisMonthMilk)} लिटर
            </p>
          </article>
          <article className="min-w-[150px] rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-[18px] font-bold text-slate-600">रेतन नोंदी</p>
            <p className="mt-2 text-[25px] font-extrabold text-slate-950">
              {toMarathiNumerals(aiRecords.length)} वेळा
            </p>
          </article>
          <article className="min-w-[190px] rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-[18px] font-bold text-slate-600">शेवटचे व्यायण</p>
            <p className="mt-2 text-[20px] font-extrabold leading-snug text-slate-950">
              {lastCalvingDate}
            </p>
          </article>
        </div>
      </section>

      <Section
        title="कृत्रिम रेतन इतिहास"
        actionHref={`/nondi/ai?cow_id=${cow.id}`}
        actionText="➕ कृत्रिम रेतन नोंद करा"
      >
        {aiRecords.length > 0 ? (
          <div className="space-y-3">
            {aiRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-[19px] font-extrabold text-slate-950">
                  तारीख: {formatMarathiDate(record.ai_date)}
                </p>
                <p className="mt-1 text-[18px] font-semibold text-slate-700">
                  बैल कोड: {record.bull_code || "नाही"}
                </p>
                <p className="mt-1 text-[18px] font-semibold text-slate-700">
                  परिणाम: {pregnancyLabels[record.pregnancy_result] || "प्रलंबित"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage>कृत्रिम रेतन नोंद अजून नाही.</EmptyMessage>
        )}
      </Section>

      <Section
        title="आरोग्य इतिहास"
        actionHref={`/nondi/arogya?cow_id=${cow.id}`}
        actionText="🏥 आरोग्य नोंद करा"
      >
        {healthRecords.length > 0 ? (
          <div className="space-y-3">
            {healthRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-[19px] font-extrabold text-slate-950">
                  तारीख: {formatMarathiDate(record.date)}
                </p>
                <p className="mt-1 text-[18px] font-semibold text-slate-700">
                  प्रकार: {record.type}
                </p>
                <p className="mt-1 text-[18px] font-semibold text-slate-700">
                  वर्णन: {record.description || "नोंद नाही"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage>आरोग्य नोंद अजून नाही.</EmptyMessage>
        )}
      </Section>

      <Section
        title="दूध उत्पादन"
        actionHref={`/nondi/dudh?cow_id=${cow.id}`}
        actionText="🥛 दूध नोंद करा"
      >
        {lastSevenDaysMilk.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[18px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 pr-3 font-extrabold">तारीख</th>
                  <th className="py-2 pr-3 font-extrabold">सकाळ</th>
                  <th className="py-2 pr-3 font-extrabold">संध्याकाळ</th>
                  <th className="py-2 pr-3 font-extrabold">एकूण</th>
                </tr>
              </thead>
              <tbody>
                {lastSevenDaysMilk.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3 font-bold text-slate-900">
                      {formatMarathiDate(record.date)}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-slate-700">
                      {formatLitres(record.morning_litres)}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-slate-700">
                      {formatLitres(record.evening_litres)}
                    </td>
                    <td className="py-3 pr-3 font-extrabold text-slate-950">
                      {formatLitres(record.total_litres)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyMessage>मागील सात दिवसांत दूध नोंद नाही.</EmptyMessage>
        )}
      </Section>

      <AdminOnly>
        <section className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
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
