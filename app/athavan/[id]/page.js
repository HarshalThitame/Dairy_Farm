"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { getCalvingRecordHref, isCalvingReminder } from "@/lib/calvingReminder";
import {
  getReminderEmoji,
  getReminderDayDistance,
  MISSED_PREGNANCY_REMINDER_TYPE,
  NEXT_BREEDING_READY_REMINDER_TYPE,
  PREGNANCY_CHECK_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE
} from "@/lib/reminderUtils";
import {
  calculateAgeMarathi,
  formatCowBreed,
  formatMarathiDate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchReminderDetail, updateReminderAction } from "@/lib/offlineActions";

function routeForReminder(reminder) {
  const cowQuery = reminder.cow_id ? `cow_id=${reminder.cow_id}` : "";
  const reminderQuery = `reminder_id=${reminder.id}`;
  const query = [cowQuery, reminderQuery].filter(Boolean).join("&");

  if (reminder.type === "व्यायण") {
    return `/nondi/vyayan?${query}`;
  }

  if (reminder.type === "लसीकरण" || reminder.type === "जंतनाशक") {
    return `/nondi/lasikaran?${query}`;
  }

  if (reminder.type === "तपासणी") {
    return `/nondi/arogya?${query}`;
  }

  if (reminder.type === "दूध बंद") {
    return `/nondi/dudh?${query}`;
  }

  if (
    reminder.type === NEXT_BREEDING_READY_REMINDER_TYPE ||
    reminder.type === REPEAT_BREEDING_REMINDER_TYPE
  ) {
    return `/nondi/ai?${query}`;
  }

  if (reminder.type === "शिंग काढणे" || reminder.type === "वासरी दूध कमी" || reminder.type === "वासरी दूध बंद") {
    return "/vasare";
  }

  return `/nondi/ai?${query}`;
}

export default function AthavanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reminder, setReminder] = useState(null);
  const [cowProfile, setCowProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchReminder = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchReminderDetail(params.id);
      setReminder(result.reminder);
      setCowProfile(result.cowProfile);
    } catch (fetchError) {
      setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchReminder();
  }, [fetchReminder]);

  const lastAI = useMemo(() => {
    return cowProfile?.records?.ai_records?.[0] || null;
  }, [cowProfile]);

  const lastCalving = useMemo(() => {
    return cowProfile?.records?.calving_records?.[0] || null;
  }, [cowProfile]);

  async function patchReminder(action, days) {
    if (!reminder?.id || actionLoading) {
      return;
    }

    setActionLoading(action);
    setError("");

    try {
      const result = await updateReminderAction(reminder.id, action, days);

      if (action === "snooze") {
        const updatedReminder = result?.data || null;
        setReminder((current) => ({
          ...(current || reminder),
          ...(updatedReminder || {}),
          reminder_date: updatedReminder?.reminder_date || current?.reminder_date || reminder.reminder_date
        }));
        setMessage("आठवण पुढे ढकलली");
        return;
      }

      router.back();
    } catch (patchError) {
      setError(patchError.message || "आठवण बदलली नाही.");
    } finally {
      setActionLoading("");
    }
  }

  async function recordPregnancyResult(result) {
    if (!reminder?.id || actionLoading) {
      return;
    }

    const action = result === "positive" ? "pregnancy-positive" : "pregnancy-negative";
    const successMessage =
      result === "positive"
        ? "गर्भधारणा झाली म्हणून नोंद झाली."
        : "गर्भधारणा नाही म्हणून नोंद झाली. पुन्हा रेतन सूचना तयार झाली.";

    setActionLoading(action);
    setError("");

    try {
      await updateReminderAction(reminder.id, action);
      setMessage(successMessage);
      window.setTimeout(() => router.back(), 900);
    } catch (patchError) {
      setError(patchError.message || "गर्भधारणा निकाल जतन झाला नाही.");
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return <LoadingState text="आठवण लोड होत आहे..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReminder} />;
  }

  const cow = cowProfile?.cow || reminder.cows;
  const overdueDays = Math.abs(Math.min(getReminderDayDistance(reminder.reminder_date), 0));
  const calvingReminder = isCalvingReminder(reminder);
  const pregnancyReminder =
    reminder.type === PREGNANCY_CHECK_REMINDER_TYPE ||
    reminder.type === MISSED_PREGNANCY_REMINDER_TYPE;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${getReminderEmoji(reminder.type)} ${reminder.type}`}
        subtitle={formatMarathiDate(reminder.reminder_date)}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h1 className="text-[30px] font-extrabold leading-tight text-sheti">
          {cow?.name || "गाय"}
        </h1>
        <p className="mt-3 text-[20px] font-semibold leading-relaxed text-slate-700">
          {reminder.message}
        </p>
        {overdueDays > 0 ? (
          <p className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-[18px] font-extrabold text-red-800">
            ⚠️ {toMarathiNumerals(overdueDays)} दिवस उशीर
          </p>
        ) : null}
      </section>

      {cow ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-slate-950">गायीची माहिती</h2>
          <div className="mt-3 space-y-2 text-[19px] font-semibold text-slate-700">
            <p>नाव: {cow.name}</p>
            <p>जात: {formatCowBreed(cow.breed)}</p>
            <p>वय: {calculateAgeMarathi(cow.date_of_birth)}</p>
            <div className="pt-1">
              <StatusBadge status={cow.status} />
            </div>
            <p>शेवटचे रेतन: {lastAI ? formatMarathiDate(lastAI.ai_date) : "नाही"}</p>
            <p>
              शेवटचे व्यायण:{" "}
              {lastCalving
                ? formatMarathiDate(lastCalving.actual_date || lastCalving.expected_date)
                : "नाही"}
            </p>
          </div>
        </section>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-[20px] font-extrabold text-yellow-900">
          {message}
        </p>
      ) : null}

      <section className="grid gap-3">
        {pregnancyReminder ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => recordPregnancyResult("positive")}
              disabled={Boolean(actionLoading)}
              className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
            >
              {actionLoading === "pregnancy-positive" ? "⏳ जतन होत आहे..." : "✅ गर्भधारणा झाली"}
            </button>
            <button
              type="button"
              onClick={() => recordPregnancyResult("negative")}
              disabled={Boolean(actionLoading)}
              className="min-h-[56px] rounded-lg border-2 border-orange-200 bg-orange-50 px-4 text-[20px] font-extrabold text-orange-900 disabled:opacity-70 active:bg-orange-100"
            >
              {actionLoading === "pregnancy-negative" ? "⏳ जतन होत आहे..." : "🔁 गर्भधारणा नाही"}
            </button>
          </div>
        ) : calvingReminder ? (
          <Link
            href={getCalvingRecordHref(reminder)}
            className="flex min-h-[56px] items-center justify-center rounded-lg bg-sheti px-4 text-center text-[20px] font-extrabold text-white shadow-sm active:bg-green-700"
          >
            🐄 व्यायण नोंद करा
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => patchReminder("done")}
            disabled={Boolean(actionLoading)}
            className="min-h-[56px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
          >
            {actionLoading === "done" ? "⏳ जतन होत आहे..." : "✅ हे काम झाले"}
          </button>
        )}
        {!calvingReminder && !pregnancyReminder ? (
          <Link
            href={routeForReminder(reminder)}
            className="flex min-h-[56px] items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 px-4 text-[20px] font-extrabold text-sheti active:bg-green-100"
          >
            📝 नोंद करा
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => patchReminder("snooze", 1)}
          disabled={Boolean(actionLoading)}
          className="min-h-[56px] rounded-lg border-2 border-yellow-200 bg-yellow-50 px-4 text-[20px] font-extrabold text-yellow-900 disabled:opacity-70 active:bg-yellow-100"
        >
          {actionLoading === "snooze" ? "⏳ पुढे ढकलत आहे..." : "⏭️ पुढे ढकला"}
        </button>
      </section>
    </div>
  );
}
