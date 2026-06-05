"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { isCalfMilkReminder } from "@/lib/calfReminderDisplay";
import { getCalvingRecordHref, isCalvingReminder } from "@/lib/calvingReminder";
import { cacheCowSnapshot } from "@/lib/cowInstantCache";
import { cacheReminderSnapshot } from "@/lib/reminderInstantCache";
import {
  getReminderDayDistance,
  getReminderEmoji,
  getUrgencyLevel,
  MISSED_PREGNANCY_REMINDER_TYPE,
  PREGNANCY_CHECK_REMINDER_TYPE
} from "@/lib/reminderUtils";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

const cardStyles = {
  overdue: "border-l-red-600 bg-gradient-to-br from-red-50 via-white to-red-50",
  today: "border-l-tatkal bg-gradient-to-br from-white via-red-50/50 to-green-50",
  tomorrow: "border-l-athavan bg-gradient-to-br from-amber-50 via-white to-yellow-50",
  week: "border-l-blue-500 bg-gradient-to-br from-blue-50 via-white to-green-50",
  future: "border-l-slate-300 bg-gradient-to-br from-white via-slate-50 to-green-50"
};

function urgencyText(reminderDate) {
  const urgency = getUrgencyLevel(reminderDate);
  const distance = getReminderDayDistance(reminderDate);

  if (urgency === "overdue") {
    return `${toMarathiNumerals(Math.abs(distance))} दिवस उशीर`;
  }

  if (urgency === "today") {
    return "आज करायचे आहे";
  }

  if (urgency === "tomorrow") {
    return "उद्या करायचे आहे";
  }

  if (distance > 0) {
    return `${toMarathiNumerals(distance)} दिवस राहिले`;
  }

  return formatMarathiDate(reminderDate);
}

export default function ReminderCard({
  reminder,
  onDone,
  onSnooze,
  onSkip,
  compact = false
}) {
  const router = useRouter();
  const urgency = getUrgencyLevel(reminder.reminder_date);
  const emoji = getReminderEmoji(reminder.type);
  const calfReminder = isCalfMilkReminder(reminder);
  const cowName = calfReminder
    ? reminder.related_calf?.name || reminder.calf_name || "वासरी"
    : reminder.cows?.name || (reminder.cow_id ? "गाय" : "सर्व गायी");
  const actionHref = reminder.action_href || reminder.actionHref || "";
  const actionLabel = reminder.action_label || reminder.actionLabel || "उघडा";
  const infoHref = calfReminder ? "/vasare" : reminder.cow_id ? `/gayi/${reminder.cow_id}` : "";
  const infoLabel = calfReminder ? "🐮 वासरे बघा" : "📋 माहिती बघा";
  const canComplete = !actionHref && (urgency === "overdue" || urgency === "today");
  const calvingReminder = isCalvingReminder(reminder);
  const pregnancyReminder =
    reminder.type === PREGNANCY_CHECK_REMINDER_TYPE ||
    reminder.type === MISSED_PREGNANCY_REMINDER_TYPE;
  const detailHref = `/athavan/${reminder.id}`;

  const warmReminderRoutes = useCallback(() => {
    cacheReminderSnapshot(reminder);
    if (reminder.cows) {
      cacheCowSnapshot(reminder.cows);
    }
    if (detailHref) router.prefetch(detailHref);
    if (infoHref) router.prefetch(infoHref);
    if (actionHref) router.prefetch(actionHref);
    if (calvingReminder) router.prefetch(getCalvingRecordHref(reminder));
  }, [actionHref, calvingReminder, detailHref, infoHref, reminder, router]);

  const colorClass =
    compact && urgency === "today" ? "border-l-athavan bg-yellow-50" : cardStyles[urgency];

  return (
    <article
      onMouseEnter={warmReminderRoutes}
      onFocus={warmReminderRoutes}
      onPointerDown={warmReminderRoutes}
      onTouchStart={warmReminderRoutes}
      className={`dashboard-card relative overflow-hidden rounded-lg border border-l-4 border-slate-200 p-4 shadow-soft ${
        colorClass
      }`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-white/80 to-transparent" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[19px] font-extrabold leading-tight text-slate-800">
            {emoji} {reminder.type}
          </p>
          <h3
            className={`mt-2 font-extrabold leading-tight text-sheti ${
              compact ? "text-[21px]" : "text-[24px]"
            }`}
          >
            {cowName}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[18px] font-extrabold ${
            urgency === "overdue"
              ? "bg-red-100 text-red-900"
              : urgency === "today"
                ? "bg-red-100 text-red-800"
                : urgency === "tomorrow"
                  ? "bg-yellow-100 text-yellow-900"
                  : "bg-blue-100 text-blue-800"
          }`}
        >
          {urgencyText(reminder.reminder_date)}
        </span>
      </div>

      {!compact ? (
        <p className="relative z-10 mt-3 text-[19px] font-semibold leading-relaxed text-slate-700">
          {reminder.message}
        </p>
      ) : (
        <p className="relative z-10 mt-2 text-[18px] font-semibold leading-snug text-slate-700">
          {reminder.message}
        </p>
      )}

      <p className="relative z-10 mt-2 text-[18px] font-bold text-slate-600">
        तारीख: {formatMarathiDate(reminder.reminder_date)}
      </p>

      <div className={`relative z-10 mt-4 grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        {actionHref ? (
          <Link
            href={actionHref}
            prefetch
            onClick={warmReminderRoutes}
            className={`flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-center text-[18px] font-extrabold text-white shadow-sm active:bg-green-700 ${
              compact ? "" : "col-span-2"
            }`}
          >
            {actionLabel}
          </Link>
        ) : null}

        {canComplete && calvingReminder ? (
          <Link
            href={getCalvingRecordHref(reminder)}
            prefetch
            onClick={warmReminderRoutes}
            className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-center text-[18px] font-extrabold text-white shadow-sm active:bg-green-700"
          >
            🐄 व्यायण नोंद
          </Link>
        ) : null}

        {canComplete && pregnancyReminder ? (
          <Link
            href={detailHref}
            prefetch
            onClick={warmReminderRoutes}
            className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-center text-[18px] font-extrabold text-white shadow-sm active:bg-green-700"
          >
            🤰 निकाल नोंदवा
          </Link>
        ) : null}

        {canComplete && !calvingReminder && !pregnancyReminder && onDone ? (
          <button
            type="button"
            onClick={() => onDone(reminder)}
            className="min-h-[52px] rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white shadow-sm active:bg-green-700"
          >
            ✅ झाले
          </button>
        ) : null}

        {infoHref ? (
          <Link
            href={infoHref}
            prefetch
            onClick={warmReminderRoutes}
            className="flex min-h-[52px] items-center justify-center rounded-lg border-2 border-green-200 bg-white px-4 text-center text-[18px] font-extrabold text-sheti shadow-sm active:bg-green-100"
          >
            {infoLabel}
          </Link>
        ) : null}

        {!compact && !actionHref && urgency === "overdue" && onSkip ? (
          <button
            type="button"
            onClick={() => onSkip(reminder)}
            className="min-h-[52px] rounded-lg border-2 border-red-200 bg-white px-4 text-[18px] font-extrabold text-red-800 shadow-sm active:bg-red-50"
          >
            ⏭️ वगळा
          </button>
        ) : null}

        {!compact && onSnooze && canComplete ? (
          <button
            type="button"
            onClick={() => onSnooze(reminder)}
            className="min-h-[52px] rounded-lg border-2 border-yellow-200 bg-yellow-50 px-4 text-[18px] font-extrabold text-yellow-900 shadow-sm active:bg-yellow-100"
          >
            ⏭️ पुढे ढकला
          </button>
        ) : null}
      </div>
    </article>
  );
}
