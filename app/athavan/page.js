"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
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
    <section id={`date-${date}`} className="space-y-3 scroll-mt-4">
      <h3 className="text-[22px] font-extrabold text-slate-950">
        {getMarathiDayName(date)}, {formatMarathiDate(date)}
      </h3>
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
    { id: "today", label: "🔴 आज", count: todayReminders.length },
    { id: "week", label: "🟡 या आठवड्यात", count: weekReminders.length },
    { id: "overdue", label: "⚪ मागील राहिलेल्या", count: overdueReminders.length },
    { id: "done", label: "✅ या महिन्यात झालेल्या", count: doneReminders.length }
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
      <PageHeader title="🔔 आठवणी" subtitle={formatMarathiDate(today)} />

      <section className="-mx-4 overflow-x-auto px-4" aria-label="आठवणी सारांश">
        <div className="flex gap-3 pb-1">
          {summaryPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setSummaryFilter(summaryFilter === pill.id ? "all" : pill.id)}
              className={`min-h-[52px] shrink-0 rounded-full border-2 px-4 text-[18px] font-extrabold ${
                summaryFilter === pill.id
                  ? "border-green-300 bg-green-100 text-sheti"
                  : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
              }`}
            >
              {pill.label}: {toMarathiNumerals(pill.count)}
            </button>
          ))}
        </div>
      </section>

      <WeekCalendar reminders={weekReminders} activeDate={activeDate} onSelectDate={selectDate} />

      <section className="-mx-4 overflow-x-auto px-4" aria-label="आठवण प्रकार">
        <div className="flex gap-2 pb-1">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={`min-h-[52px] shrink-0 rounded-full border-2 px-4 text-[18px] font-extrabold ${
                typeFilter === filter.value
                  ? "border-green-300 bg-green-100 text-sheti"
                  : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {(summaryFilter === "all" || summaryFilter === "today") && (
        <section className="space-y-3">
          <h2 className="text-[24px] font-extrabold text-slate-950">🔴 आजच्या आठवणी</h2>
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
          <h2 className="text-[24px] font-extrabold text-slate-950">🟡 उद्याच्या आठवणी</h2>
          {filteredTomorrow.length > 0 ? (
            filteredTomorrow.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} compact />
            ))
          ) : (
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-5 text-center text-[19px] font-bold text-slate-600">
              उद्या आठवण नाही.
            </p>
          )}
        </section>
      )}

      {(summaryFilter === "all" || summaryFilter === "week") && (
        <section className="space-y-4">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            📅 या आठवड्यातील आठवणी
          </h2>
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
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-5 text-center text-[19px] font-bold text-slate-600">
              या आठवड्यात पुढील आठवण नाही.
            </p>
          )}
        </section>
      )}

      {(summaryFilter === "all" || summaryFilter === "overdue") && (
        <section className="space-y-3">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            ⚪ मागील राहिलेल्या आठवणी
          </h2>
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
            <p className="rounded-lg border-2 border-dashed border-green-200 bg-green-50 p-5 text-center text-[19px] font-bold text-green-800">
              मागील राहिलेली आठवण नाही.
            </p>
          )}
        </section>
      )}

      {summaryFilter === "done" ? (
        <section className="space-y-3">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            ✅ या महिन्यात झालेल्या
          </h2>
          {filteredDone.length > 0 ? (
            filteredDone.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} compact />
            ))
          ) : (
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-5 text-center text-[19px] font-bold text-slate-600">
              या महिन्यात पूर्ण झालेली आठवण नाही.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
