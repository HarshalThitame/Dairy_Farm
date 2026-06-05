"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getStatusBorderClass } from "@/components/StatusBadge";
import { cacheCowSnapshot } from "@/lib/cowInstantCache";
import {
  calculateAgeMarathi,
  formatCowBreed,
  formatMarathiDate
} from "@/lib/marathiUtils";

function compactDate(value) {
  return value ? formatMarathiDate(value) : "नोंद नाही";
}

function getCalvingDate(cow) {
  const calving = cow.latest_calving_record;
  if (!calving) {
    return "";
  }

  return calving.actual_date || calving.expected_date || "";
}

function getNextReminderText(cow) {
  const reminder = cow.next_reminder;
  if (!reminder) {
    return "नाही";
  }

  return `${reminder.type || "आठवण"} · ${compactDate(reminder.reminder_date)}`;
}

export default function CowCard({ cow }) {
  const router = useRouter();
  const borderClass = getStatusBorderClass(cow.status);
  const href = `/gayi/${cow.id}`;
  const importantDates = [
    {
      label: "जन्म",
      value: compactDate(cow.date_of_birth),
      tone: "bg-slate-50 text-slate-900 ring-slate-100"
    },
    {
      label: "खरेदी",
      value: compactDate(cow.purchased_on),
      tone: "bg-amber-50 text-amber-950 ring-amber-100"
    },
    {
      label: "शेवटचे रेतन",
      value: compactDate(cow.latest_ai_record?.ai_date),
      tone: "bg-blue-50 text-blue-950 ring-blue-100"
    },
    {
      label: "शेवटचे व्यायण",
      value: compactDate(getCalvingDate(cow)),
      tone: "bg-purple-50 text-purple-950 ring-purple-100"
    }
  ];

  const warmCowDetails = useCallback(() => {
    cacheCowSnapshot(cow);
    router.prefetch(href);
  }, [cow, href, router]);

  return (
    <Link
      href={href}
      prefetch
      onClick={warmCowDetails}
      onFocus={warmCowDetails}
      onMouseEnter={warmCowDetails}
      onPointerDown={warmCowDetails}
      onTouchStart={warmCowDetails}
      className={`dashboard-card group block overflow-hidden rounded-lg border border-l-4 border-slate-200 bg-white/95 shadow-soft backdrop-blur active:bg-green-50 ${borderClass}`}
      aria-label={`${cow.name} माहिती बघा`}
    >
      <article className="relative p-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-sky-400 to-amber-400" />
        <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-green-100/70 via-sky-50/80 to-transparent" />

        <div className="relative flex items-start gap-3">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white bg-gradient-to-br from-green-50 via-white to-sky-50 shadow-sm ring-1 ring-slate-100 sm:h-28 sm:w-28">
            {cow.photo_url ? (
              <img src={cow.photo_url} alt={cow.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[44px]">🐄</div>
            )}
            {cow.tag_number ? (
              <span className="absolute bottom-1 left-1 rounded bg-white/90 px-2 py-0.5 text-[12px] font-extrabold text-slate-700 shadow-sm">
                #{cow.tag_number}
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <h2 className="break-words text-[25px] font-extrabold leading-tight text-slate-950">
                {cow.name}
              </h2>
              <p className="mt-1 break-words text-[17px] font-bold leading-snug text-slate-500">
                {formatCowBreed(cow.breed)}
                {cow.color ? ` • ${cow.color}` : ""}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[16px] font-bold leading-snug text-slate-700">
              <div className="rounded-lg bg-slate-50 px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <span className="block text-[13px] font-extrabold text-slate-400">वय</span>
                {calculateAgeMarathi(cow.date_of_birth)}
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2 text-green-900 shadow-sm ring-1 ring-green-100">
                <span className="block text-[13px] font-extrabold text-green-500">शेवटचे दूध</span>
                {compactDate(cow.latest_milk_record?.date)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-[14px] font-black uppercase tracking-wide text-slate-400">
            महत्त्वाच्या तारखा
          </p>
          <div className="grid grid-cols-2 gap-2">
            {importantDates.map((item) => (
              <div
                key={item.label}
                className={`min-h-[62px] rounded-lg px-3 py-2 shadow-sm ring-1 ${item.tone}`}
              >
                <span className="block text-[12px] font-black leading-tight opacity-70">
                  {item.label}
                </span>
                <span className="mt-1 block truncate text-[15px] font-extrabold leading-tight">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <p className="min-w-0 truncate text-[15px] font-extrabold leading-snug text-slate-600">
            पुढील: {getNextReminderText(cow)}
          </p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[20px] font-extrabold text-white transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </div>
      </article>
    </Link>
  );
}
