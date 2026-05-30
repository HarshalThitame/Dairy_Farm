"use client";

import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";
import { addDaysToISODate, getTodayISODate } from "@/lib/reminderUtils";

const shortDayNames = ["सोम", "मंगळ", "बुध", "गुरु", "शुक्र", "शनि", "रवि"];

function startOfWeekISO() {
  const today = getTodayISODate();
  const [year, month, dayOfMonth] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + mondayOffset);
  return date.toISOString().slice(0, 10);
}

export default function WeekCalendar({ reminders = [], activeDate, onSelectDate }) {
  const monday = startOfWeekISO();
  const days = shortDayNames.map((name, index) => {
    const date = addDaysToISODate(monday, index);
    const count = reminders.filter((reminder) => reminder.reminder_date === date).length;

    return { name, date, count };
  });

  return (
    <section className="-mx-4 overflow-x-auto px-4" aria-label="आठवड्याचे दिवस">
      <div className="flex gap-2 pb-1">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDate(day.date)}
            className={`min-h-[78px] min-w-[74px] rounded-lg border-2 px-2 text-center ${
              activeDate === day.date
                ? "border-green-300 bg-green-100 text-sheti"
                : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
            }`}
          >
            <span className="block text-[18px] font-extrabold">{day.name}</span>
            <span className="mt-1 block text-[18px] font-bold">
              {formatMarathiDate(day.date).split(" ")[0]}
            </span>
            <span className="mt-1 inline-flex min-h-[26px] min-w-[26px] items-center justify-center rounded-full bg-slate-100 px-2 text-[18px] font-extrabold">
              {toMarathiNumerals(day.count)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
