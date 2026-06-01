"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import ReminderCard from "@/components/ReminderCard";
import WeekCalendar from "@/components/WeekCalendar";
import {
  addDaysToISODate,
  getMarathiDayName,
  getTodayISODate,
  groupRemindersByDate,
  sortRemindersByUrgency
} from "@/lib/reminderUtils";
import { formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";
import { fetchRemindersByFilter, updateReminderAction } from "@/lib/offlineActions";

const typeFilters = [
  { value: "सर्व", label: "सर्व" },
  { value: "माज तपासणी", label: "माज तपासणी" },
  { value: "गर्भधारणा तपासणी", label: "गर्भधारणा" },
  { value: "व्यायण", label: "व्यायण" },
  { value: "लसीकरण", label: "लसीकरण" },
  { value: "जंतनाशक", label: "जंतनाशक" },
  { value: "तपासणी", label: "तपासणी" },
  { value: "दूध बंद", label: "दूध बंद" },
  { value: "वासरी दूध कमी", label: "वासरी दूध" },
  { value: "वासरी दूध बंद", label: "वासरी दूध बंद" }
];

function filterByType(reminders, typeFilter) {
  if (typeFilter === "सर्व") {
    return reminders;
  }

  return reminders.filter((reminder) => reminder.type === typeFilter);
}

function DateGroup({ date, reminders, onDone, onSnooze }) {
  return (
    <section id={`date-${date}`} className="dashboard-panel space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft scroll-mt-4">
      <div className="relative z-10 flex items-center justify-between gap-3">
        <h3 className="text-[22px] font-extrabold text-slate-950">
          {getMarathiDayName(date)}
        </h3>
        <span className="rounded-full bg-green-50 px-3 py-1 text-[16px] font-extrabold text-sheti ring-1 ring-green-100">
          {formatMarathiDate(date)}
        </span>
      </div>
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          onDone={onDone}
          onSnooze={onSnooze}
          compact
        />
      ))}
    </section>
  );
}

function HeroMetric({ label, value, tone = "green" }) {
  const tones = {
    green: "bg-green-50 text-green-950 ring-green-100",
    red: "bg-red-50 text-red-950 ring-red-100",
    amber: "bg-amber-50 text-amber-950 ring-amber-100",
    white: "bg-white text-slate-950 ring-white/60"
  };

  return (
    <article className={`rounded-lg p-3 text-center shadow-sm ring-1 ${tones[tone] || tones.green}`}>
      <p className="text-[13px] font-extrabold leading-tight opacity-70">{label}</p>
      <p className="mt-1 text-[25px] font-black leading-none">{toMarathiNumerals(value)}</p>
    </article>
  );
}

function SectionTitle({ emoji, title, count }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[24px] font-extrabold text-slate-950">
        {emoji} {title}
      </h2>
      {count !== undefined ? (
        <span className="rounded-full bg-slate-950 px-3 py-1 text-[16px] font-extrabold text-white">
          {toMarathiNumerals(count)}
        </span>
      ) : null}
    </div>
  );
}

function EmptyState({ tone = "slate", children }) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-800",
    slate: "border-slate-200 bg-white text-slate-600"
  };

  return (
    <p className={`rounded-lg border-2 border-dashed p-5 text-center text-[19px] font-bold shadow-sm ${tones[tone] || tones.slate}`}>
      {children}
    </p>
  );
}

function pillClass(active, tone = "green") {
  if (active && tone === "red") {
    return "border-red-300 bg-red-100 text-red-900 ring-2 ring-red-100";
  }

  if (active && tone === "amber") {
    return "border-amber-300 bg-amber-100 text-amber-950 ring-2 ring-amber-100";
  }

  if (active) {
    return "border-green-300 bg-green-100 text-sheti ring-2 ring-green-100";
  }

  return "border-slate-200 bg-white text-slate-700 active:bg-green-50";
}

export default function AthavanPage() {
  const today = getTodayISODate();
  const tomorrow = addDaysToISODate(today, 1);
  const [weekReminders, setWeekReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);
  const [doneReminders, setDoneReminders] = useState([]);
  const [summaryFilter, setSummaryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("सर्व");
  const [activeDate, setActiveDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [weekResult, overdueResult, doneResult] = await Promise.all([
        fetchRemindersByFilter("week"),
        fetchRemindersByFilter("overdue"),
        fetchRemindersByFilter("done")
      ]);

      setWeekReminders(sortRemindersByUrgency(weekResult.data || []));
      setOverdueReminders(sortRemindersByUrgency(overdueResult.data || []));
      setDoneReminders(doneResult.data || []);
    } catch (fetchError) {
      setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const todayReminders = useMemo(
    () => weekReminders.filter((reminder) => reminder.reminder_date === today),
    [today, weekReminders]
  );
  const tomorrowReminders = useMemo(
    () => weekReminders.filter((reminder) => reminder.reminder_date === tomorrow),
    [tomorrow, weekReminders]
  );
  const laterWeekReminders = useMemo(
    () =>
      weekReminders.filter(
        (reminder) => reminder.reminder_date > tomorrow && reminder.reminder_date <= addDaysToISODate(today, 7)
      ),
    [today, tomorrow, weekReminders]
  );

  const summaryPills = [
    { id: "today", label: "🔴 आज", count: todayReminders.length, tone: "red" },
    { id: "week", label: "🟡 या आठवड्यात", count: weekReminders.length, tone: "amber" },
    { id: "overdue", label: "⚪ मागील राहिलेल्या", count: overdueReminders.length, tone: "red" },
    { id: "done", label: "✅ या महिन्यात झालेल्या", count: doneReminders.length, tone: "green" }
  ];

  async function patchReminder(reminder, action, days) {
    try {
      await updateReminderAction(reminder.id, action, days);
      fetchReminders();
    } catch (patchError) {
      setError(patchError.message || "आठवण बदलली नाही.");
    }
  }

  function selectDate(date) {
    setActiveDate(date);
    setSummaryFilter("week");
    window.setTimeout(() => {
      document.getElementById(`date-${date}`)?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  if (loading) {
    return <LoadingState text="आठवणी लोड होत आहेत..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReminders} />;
  }

  const filteredToday = filterByType(todayReminders, typeFilter);
  const filteredTomorrow = filterByType(tomorrowReminders, typeFilter);
  const filteredWeek = filterByType(laterWeekReminders, typeFilter);
  const filteredOverdue = filterByType(overdueReminders, typeFilter);
  const filteredDone = filterByType(doneReminders, typeFilter);
  const groupedWeek = groupRemindersByDate(filteredWeek);
  const groupDates = Object.keys(groupedWeek).sort();

  return (
    <div className="space-y-6">
      <header className="dashboard-hero overflow-hidden rounded-lg px-4 pb-4 pt-5 text-white shadow-soft">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[16px] font-extrabold text-green-100">
                माझी डेअरी
              </p>
              <h1 className="mt-1 text-[34px] font-black leading-tight">
                🔔 आठवणी
              </h1>
              <p className="mt-1 text-[18px] font-bold leading-snug text-green-50">
                {formatMarathiDate(today)}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchReminders}
              className="flex min-h-[52px] shrink-0 items-center justify-center rounded-lg bg-white px-4 text-[18px] font-extrabold text-green-800 shadow-sm active:bg-green-50"
            >
              ↻ अपडेट
            </button>
          </div>

          <div className="dashboard-glass mt-5 grid grid-cols-4 gap-2 rounded-lg p-2">
            <HeroMetric label="आज" value={todayReminders.length} tone="red" />
            <HeroMetric label="आठवडा" value={weekReminders.length} tone="amber" />
            <HeroMetric label="मागील" value={overdueReminders.length} tone="red" />
            <HeroMetric label="पूर्ण" value={doneReminders.length} tone="white" />
          </div>
        </div>
      </header>

      <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft" aria-label="आठवणी सारांश">
        <div className="relative z-10 mb-3">
          <h2 className="text-[23px] font-extrabold text-slate-950">आठवणी सारांश</h2>
          <p className="mt-1 text-[17px] font-bold text-slate-500">काय बघायचे ते निवडा</p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-3 pb-1">
          {summaryPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSummaryFilter(summaryFilter === pill.id ? "all" : pill.id)}
              className={`min-h-[52px] shrink-0 rounded-full border-2 px-4 text-[18px] font-extrabold shadow-sm ${pillClass(
                summaryFilter === pill.id,
                pill.tone
              )}`}
            >
              {pill.label}: {toMarathiNumerals(pill.count)}
            </button>
          ))}
        </div>
        </div>
      </section>

      <WeekCalendar reminders={weekReminders} activeDate={activeDate} onSelectDate={selectDate} />

      <section className="dashboard-panel rounded-lg border border-slate-200 bg-white p-4 shadow-soft" aria-label="आठवण प्रकार">
        <div className="relative z-10 mb-3">
          <h2 className="text-[23px] font-extrabold text-slate-950">आठवण प्रकार</h2>
          <p className="mt-1 text-[17px] font-bold text-slate-500">फक्त हवा तो प्रकार दाखवा</p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`min-h-[52px] shrink-0 rounded-full border-2 px-4 text-[18px] font-extrabold shadow-sm ${pillClass(
                typeFilter === filter.value
              )}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        </div>
      </section>

      {(summaryFilter === "all" || summaryFilter === "today") && (
        <section className="space-y-3">
          <SectionTitle emoji="🔴" title="आजच्या आठवणी" count={filteredToday.length} />
          {filteredToday.length > 0 ? (
            filteredToday.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDone={(item) => patchReminder(item, "done")}
                onSnooze={(item) => patchReminder(item, "snooze", 1)}
              />
            ))
          ) : (
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center shadow-soft">
              <div className="mx-auto flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-green-100 text-[36px]">
                ✅
              </div>
              <p className="mt-4 text-[22px] font-extrabold text-green-800">
                🎉 आज सर्व आठवणी पूर्ण झाल्या आहेत!
              </p>
            </div>
          )}
        </section>
      )}

      {(summaryFilter === "all" || summaryFilter === "week") && (
        <section className="space-y-3">
          <SectionTitle emoji="🟡" title="उद्याच्या आठवणी" count={filteredTomorrow.length} />
          {filteredTomorrow.length > 0 ? (
            filteredTomorrow.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} compact />
            ))
          ) : (
            <EmptyState>उद्या आठवण नाही.</EmptyState>
          )}
        </section>
      )}

      {(summaryFilter === "all" || summaryFilter === "week") && (
        <section className="space-y-4">
          <SectionTitle emoji="📅" title="या आठवड्यातील आठवणी" count={filteredWeek.length} />
          {groupDates.length > 0 ? (
            groupDates.map((date) => (
              <DateGroup
                key={date}
                date={date}
                reminders={groupedWeek[date]}
                onDone={(item) => patchReminder(item, "done")}
                onSnooze={(item) => patchReminder(item, "snooze", 1)}
              />
            ))
          ) : (
            <EmptyState>या आठवड्यात पुढील आठवण नाही.</EmptyState>
          )}
        </section>
      )}

      {(summaryFilter === "all" || summaryFilter === "overdue") && (
        <section className="space-y-3">
          <SectionTitle emoji="⚪" title="मागील राहिलेल्या आठवणी" count={filteredOverdue.length} />
          {filteredOverdue.length > 0 ? (
            filteredOverdue.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onDone={(item) => patchReminder(item, "done")}
                onSkip={(item) => patchReminder(item, "skip")}
                onSnooze={(item) => patchReminder(item, "snooze", 1)}
              />
            ))
          ) : (
            <EmptyState tone="green">मागील राहिलेली आठवण नाही.</EmptyState>
          )}
        </section>
      )}

      {summaryFilter === "done" ? (
        <section className="space-y-3">
          <SectionTitle emoji="✅" title="या महिन्यात झालेल्या" count={filteredDone.length} />
          {filteredDone.length > 0 ? (
            filteredDone.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} compact />
            ))
          ) : (
            <EmptyState>या महिन्यात पूर्ण झालेली आठवण नाही.</EmptyState>
          )}
        </section>
      ) : null}
    </div>
  );
}
