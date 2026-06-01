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
    <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft" aria-label="आठवड्याचे दिवस">
      <div className="relative z-10 mb-3">
        <h2 className="text-[22px] font-extrabold text-slate-950">आठवड्याचे दिवस</h2>
        <p className="mt-1 text-[16px] font-bold text-slate-500">दिवस निवडा आणि आठवणी बघा</p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelectDate(day.date)}
            className={`min-h-[86px] min-w-[78px] rounded-lg border-2 px-2 text-center shadow-sm ${
              activeDate === day.date
                ? "border-green-300 bg-green-100 text-sheti ring-2 ring-green-100"
                : "border-slate-200 bg-white text-slate-700 active:bg-green-50"
            }`}
          >
            <span className="block text-[18px] font-extrabold">{day.name}</span>
            <span className="mt-1 block text-[18px] font-bold">
              {formatMarathiDate(day.date).split(" ")[0]}
            </span>
            <span className={`mt-2 inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full px-2 text-[18px] font-extrabold ${
              day.count > 0 ? "bg-sheti text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {toMarathiNumerals(day.count)}
            </span>
          </button>
        ))}
      </div>
      </div>
    </section>
  );
}
