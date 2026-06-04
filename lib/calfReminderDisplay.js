import {
  CALF_MILK_REDUCE_DAYS,
  CALF_MILK_STOP_DAYS,
  CALF_REMINDER_MILK_REDUCE,
  CALF_REMINDER_MILK_STOP,
  getCalfAgeText
} from "@/lib/calfLifecycle";
import { getTodayISODate } from "@/lib/reminderUtils";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const calfReminderTypes = new Set([CALF_REMINDER_MILK_REDUCE, CALF_REMINDER_MILK_STOP]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function daysBetween(firstDate, secondDate) {
  const first = new Date(`${firstDate}T00:00:00Z`);
  const second = new Date(`${secondDate}T00:00:00Z`);

  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) {
    return 0;
  }

  return Math.round((first - second) / 86400000);
}

function extractNameFromReminderMessage(message = "") {
  const text = String(message || "").trim();
  const separators = [" आता ", " आज ", " ४० ", " ६० ", " दूध ", " दुध"];
  const separatorIndex = separators
    .map((separator) => text.indexOf(separator))
    .filter((index) => index > 0)
    .sort((first, second) => first - second)[0];

  if (!separatorIndex) {
    return "";
  }

  return text.slice(0, separatorIndex).trim();
}

export function isCalfMilkReminder(reminder) {
  return calfReminderTypes.has(reminder?.type);
}

function getTargetDays(type) {
  return type === CALF_REMINDER_MILK_STOP ? CALF_MILK_STOP_DAYS : CALF_MILK_REDUCE_DAYS;
}

function getActionText(type) {
  return type === CALF_REMINDER_MILK_STOP
    ? "दूध बंद करा"
    : "दूध कमी करण्यास सुरुवात करा";
}

function isActiveTrackedCalf(calf) {
  return Boolean(calf && calf.status === "active" && calf.is_raised && calf.gender === "मादी");
}

export function buildCalfReminderMessage(reminder, calf, today = getTodayISODate()) {
  if (!calf?.birth_date) {
    return reminder.message;
  }

  const calfName = calf.name || "वासरी";
  const targetDays = getTargetDays(reminder.type);
  const actionText = getActionText(reminder.type);
  const distance = daysBetween(reminder.reminder_date, today);
  const currentAge = getCalfAgeText(calf.birth_date, today);

  if (distance > 0) {
    return `${calfName} आज ${currentAge} आहे. ${toMarathiNumerals(distance)} दिवसांनी ${toMarathiNumerals(targetDays)} दिवसांची होईल; तेव्हा ${actionText}.`;
  }

  if (distance === 0) {
    return `${calfName} आज ${toMarathiNumerals(targetDays)} दिवसांची झाली आहे. ${actionText}.`;
  }

  return `${calfName} आता ${currentAge} आहे. ${toMarathiNumerals(Math.abs(distance))} दिवसांपूर्वी ${toMarathiNumerals(targetDays)} दिवसांची झाली होती; ${actionText}.`;
}

export async function enrichActiveCalfMilkReminders(supabase, farmId, reminders = [], options = {}) {
  const today = options.today || getTodayISODate();
  const rows = Array.isArray(reminders) ? reminders : [];
  const calfReminderRows = rows.filter(isCalfMilkReminder);

  if (!calfReminderRows.length) {
    return rows;
  }

  const relatedIds = [
    ...new Set(calfReminderRows.map((reminder) => reminder.related_record_id).filter(isUuid))
  ];

  const needsLegacyNameMatch = calfReminderRows.some((reminder) => !isUuid(reminder.related_record_id));
  let query = supabase
    .from("calves")
    .select("id, farm_id, name, birth_date, gender, status, is_raised, milk_reduce_date, milk_stop_date, mother_cow_id")
    .eq("farm_id", farmId);

  if (relatedIds.length && !needsLegacyNameMatch) {
    query = query.in("id", relatedIds);
  }

  const { data: calves, error } = await query;

  if (error) {
    throw error;
  }

  const calvesById = new Map((calves || []).map((calf) => [calf.id, calf]));
  const calvesByName = new Map();

  (calves || []).forEach((calf) => {
    const name = normalizeName(calf.name);
    if (!name) return;
    const existing = calvesByName.get(name) || [];
    existing.push(calf);
    calvesByName.set(name, existing);
  });

  return rows
    .map((reminder) => {
      if (!isCalfMilkReminder(reminder)) {
        return reminder;
      }

      const messageName = normalizeName(extractNameFromReminderMessage(reminder.message));
      const namedMatches = messageName ? calvesByName.get(messageName) || [] : [];
      const calf = calvesById.get(reminder.related_record_id) || namedMatches[0] || null;

      if (calf && !isActiveTrackedCalf(calf) && !reminder.is_done) {
        return null;
      }

      if (!calf) {
        return reminder;
      }

      return {
        ...reminder,
        related_calf: calf,
        calf_name: calf.name,
        message: buildCalfReminderMessage(reminder, calf, today)
      };
    })
    .filter(Boolean);
}
