const INDIA_TIME_ZONE = "Asia/Kolkata";
export const PREGNANCY_CHECK_REMINDER_TYPE = "गर्भधारणा तपासणी";
export const MISSED_PREGNANCY_REMINDER_TYPE = "गर्भधारणा तपासणी बाकी";
export const REPEAT_BREEDING_REMINDER_TYPE = "पुन्हा रेतन सूचना";
export const NEXT_BREEDING_READY_REMINDER_TYPE = "पुढील रेतन तयारी";
export const DRY_OFF_REMINDER_TYPE = "दूध बंद";
export const CALVING_REMINDER_TYPE = "व्यायण";

const marathiDayNames = [
  "रविवार",
  "सोमवार",
  "मंगळवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार"
];

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function parseISODate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString || ""))) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function addDaysToISODate(dateString, days) {
  const date = parseISODate(dateString);
  const daysToAdd = Number(days);

  if (!date || !Number.isFinite(daysToAdd)) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function daysBetween(firstDate, secondDate) {
  const first = parseISODate(firstDate);
  const second = parseISODate(secondDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  if (!first || !second) {
    return 0;
  }

  return Math.round((first - second) / millisecondsPerDay);
}

export function getTodayISODate() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;
  const day = parts.find((part) => part.type === "day").value;

  return `${year}-${month}-${day}`;
}

export function calculateAIReminders(aiDate, cowName) {
  return [
    {
      reminder_date: addDaysToISODate(aiDate, 60),
      type: PREGNANCY_CHECK_REMINDER_TYPE,
      message: `${cowName} ची गर्भधारणा तपासणी करा`
    },
    {
      reminder_date: addDaysToISODate(aiDate, 61),
      type: MISSED_PREGNANCY_REMINDER_TYPE,
      message: `${cowName} साठी ६० दिवस झाले आहेत. गर्भधारणा तपासणी नोंद करा.`
    },
    {
      reminder_date: addDaysToISODate(aiDate, 210),
      type: DRY_OFF_REMINDER_TYPE,
      message: `${cowName} चे दूध काढणे बंद करण्याची वेळ जवळ आली आहे`
    },
    {
      reminder_date: addDaysToISODate(aiDate, 270),
      type: CALVING_REMINDER_TYPE,
      message: `${cowName} व्यायण्याची वेळ जवळ आली आहे`
    }
  ];
}

export function calculateCalvingFollowupReminders(actualDate, cowName) {
  return [
    {
      reminder_date: addDaysToISODate(actualDate, 60),
      type: NEXT_BREEDING_READY_REMINDER_TYPE,
      message: `${cowName || "गाय"} पुढील रेतनासाठी तयार आहे का तपासा.`
    }
  ];
}

export function buildRepeatBreedingReminder(reminderDate, cowName) {
  return {
    reminder_date: reminderDate,
    type: REPEAT_BREEDING_REMINDER_TYPE,
    message: `${cowName || "गाय"} पुन्हा रेतनासाठी तयार असू शकते.`
  };
}

export async function getTodayReminders() {
  const { getSupabaseServerClient } = await import("@/lib/supabase");
  const supabase = getSupabaseServerClient();
  const today = getTodayISODate();

  return supabase
    .from("reminders")
    .select("*, cows(id, name, breed)")
    .eq("is_done", false)
    .eq("reminder_date", today)
    .order("reminder_date", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function getUpcomingReminders(days = 7) {
  const { getSupabaseServerClient } = await import("@/lib/supabase");
  const supabase = getSupabaseServerClient();
  const today = getTodayISODate();
  const endDate = addDaysToISODate(today, days);

  return supabase
    .from("reminders")
    .select("*, cows(id, name, breed)")
    .eq("is_done", false)
    .gte("reminder_date", today)
    .lte("reminder_date", endDate)
    .order("reminder_date", { ascending: true })
    .order("created_at", { ascending: true });
}

export function groupRemindersByDate(reminders) {
  return reminders.reduce((groups, reminder) => {
    const date = reminder.reminder_date;

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(reminder);
    return groups;
  }, {});
}

export function getUrgencyLevel(reminderDate) {
  const today = getTodayISODate();
  const tomorrow = addDaysToISODate(today, 1);
  const weekEnd = addDaysToISODate(today, 7);

  if (reminderDate < today) {
    return "overdue";
  }

  if (reminderDate === today) {
    return "today";
  }

  if (reminderDate === tomorrow) {
    return "tomorrow";
  }

  if (reminderDate <= weekEnd) {
    return "week";
  }

  return "future";
}

export function getReminderEmoji(type) {
  const emojiMap = {
    [PREGNANCY_CHECK_REMINDER_TYPE]: "🤰",
    [MISSED_PREGNANCY_REMINDER_TYPE]: "⚠️",
    [REPEAT_BREEDING_REMINDER_TYPE]: "🔁",
    [NEXT_BREEDING_READY_REMINDER_TYPE]: "🐄",
    [CALVING_REMINDER_TYPE]: "🐄",
    "लसीकरण": "💉",
    "जंतनाशक": "💊",
    "तपासणी": "🏥",
    [DRY_OFF_REMINDER_TYPE]: "🥛",
    "शिंग काढणे": "🐮",
    "वासरी दूध कमी": "🐮",
    "वासरी दूध बंद": "🥛"
  };

  return emojiMap[type] || "🔔";
}

export function getMarathiDayName(date) {
  const parsedDate = typeof date === "string" ? new Date(`${date}T00:00:00`) : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return marathiDayNames[parsedDate.getDay()];
}

export function getReminderDayDistance(reminderDate) {
  return daysBetween(reminderDate, getTodayISODate());
}

export function sortRemindersByUrgency(reminders) {
  const urgencyOrder = {
    overdue: 0,
    today: 1,
    tomorrow: 2,
    week: 3,
    future: 4
  };

  return [...reminders].sort((first, second) => {
    const firstUrgency = urgencyOrder[getUrgencyLevel(first.reminder_date)];
    const secondUrgency = urgencyOrder[getUrgencyLevel(second.reminder_date)];

    if (firstUrgency !== secondUrgency) {
      return firstUrgency - secondUrgency;
    }

    return first.reminder_date.localeCompare(second.reminder_date);
  });
}
