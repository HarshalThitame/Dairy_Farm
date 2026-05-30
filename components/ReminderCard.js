"use client";

import Link from "next/link";
import { getCalvingRecordHref, isCalvingReminder } from "@/lib/calvingReminder";
import {
  getReminderDayDistance,
  getReminderEmoji,
  getUrgencyLevel
} from "@/lib/reminderUtils";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

const cardStyles = {
  overdue: "border-l-red-900 bg-red-50",
  today: "border-l-tatkal bg-white",
  tomorrow: "border-l-athavan bg-yellow-50",
  week: "border-l-blue-500 bg-white",
  future: "border-l-slate-300 bg-white"
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
  const urgency = getUrgencyLevel(reminder.reminder_date);
  const emoji = getReminderEmoji(reminder.type);
  const cowName = reminder.cows?.name || (reminder.cow_id ? "गाय" : "सर्व गायी");
  const canComplete = urgency === "overdue" || urgency === "today";
  const calvingReminder = isCalvingReminder(reminder);

  const colorClass =
    compact && urgency === "today" ? "border-l-athavan bg-yellow-50" : cardStyles[urgency];

  return (
    <article
      className={`dashboard-card rounded-lg border border-l-4 border-slate-200 p-4 shadow-soft ${
        colorClass
      }`}
    >
      <div className="flex items-start justify-between gap-3">
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
        <p className="mt-3 text-[19px] font-semibold leading-relaxed text-slate-700">
          {reminder.message}
        </p>
      ) : (
        <p className="mt-2 text-[18px] font-semibold leading-snug text-slate-700">
          {reminder.message}
        </p>
      )}

      <p className="mt-2 text-[18px] font-bold text-slate-600">
        तारीख: {formatMarathiDate(reminder.reminder_date)}
      </p>

      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        {canComplete && calvingReminder ? (
          <Link
            href={getCalvingRecordHref(reminder)}
            className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-4 text-center text-[18px] font-extrabold text-white active:bg-green-700"
          >
            🐄 व्यायण नोंद
          </Link>
        ) : null}

        {canComplete && !calvingReminder && onDone ? (
          <button
            type="button"
            onClick={() => onDone(reminder)}
            className="min-h-[52px] rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white active:bg-green-700"
          >
            ✅ झाले
          </button>
        ) : null}

        {reminder.cow_id ? (
          <Link
            href={`/gayi/${reminder.cow_id}`}
            className="flex min-h-[52px] items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 px-4 text-center text-[18px] font-extrabold text-sheti active:bg-green-100"
          >
            📋 माहिती बघा
          </Link>
        ) : null}

        {!compact && urgency === "overdue" && onSkip ? (
          <button
            type="button"
            onClick={() => onSkip(reminder)}
            className="min-h-[52px] rounded-lg border-2 border-red-200 bg-white px-4 text-[18px] font-extrabold text-red-800 active:bg-red-50"
          >
            ⏭️ वगळा
          </button>
        ) : null}

        {!compact && onSnooze && canComplete ? (
          <button
            type="button"
            onClick={() => onSnooze(reminder)}
            className="min-h-[52px] rounded-lg border-2 border-yellow-200 bg-yellow-50 px-4 text-[18px] font-extrabold text-yellow-900 active:bg-yellow-100"
          >
            ⏭️ पुढे ढकला
          </button>
        ) : null}
      </div>
    </article>
  );
}
