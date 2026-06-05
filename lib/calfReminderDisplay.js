import {
  CALF_DEHORNING_END_DAYS,
  CALF_DEHORNING_START_DAYS,
  CALF_REMINDER_DEHORNING,
  CALF_MILK_REDUCE_DAYS,
  CALF_MILK_STOP_DAYS,
  CALF_REMINDER_MILK_REDUCE,
  CALF_REMINDER_MILK_STOP,
  addDaysToISODate,
  getCalfAgeText
} from "@/lib/calfLifecycle";
import { getTodayISODate } from "@/lib/reminderUtils";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const calfReminderTypes = new Set([CALF_REMINDER_DEHORNING, CALF_REMINDER_MILK_REDUCE, CALF_REMINDER_MILK_STOP]);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
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
  const separators = [" आता ", " आज ", " १५ ", " ४० ", " ६० ", " शिंग ", " दूध ", " दुध"];
  const separatorIndex = separators
    .map((separator) => text.indexOf(separator))
    .filter((index) => index > 0)
    .sort((first, second) => first - second)[0];

  if (!separatorIndex) {
    return "";
  }

  const name = text.slice(0, separatorIndex).trim();
  return name.endsWith("चे") ? name.slice(0, -2).trim() : name;
}

export function isCalfMilkReminder(reminder) {
  return calfReminderTypes.has(reminder?.type);
}

export function isCalfDehorningReminder(reminder) {
  return reminder?.type === CALF_REMINDER_DEHORNING;
}

function getTargetDays(type) {
  if (type === CALF_REMINDER_DEHORNING) {
    return CALF_DEHORNING_START_DAYS;
  }

  return type === CALF_REMINDER_MILK_STOP ? CALF_MILK_STOP_DAYS : CALF_MILK_REDUCE_DAYS;
}

function getActionText(type) {
  if (type === CALF_REMINDER_DEHORNING) {
    return "शिंग काढण्याची योग्य वेळ";
  }

  return type === CALF_REMINDER_MILK_STOP
    ? "दूध बंद करा"
    : "दूध कमी करण्यास सुरुवात करा";
}

function isActiveTrackedCalf(calf, reminderType) {
  return Boolean(
    calf &&
      calf.status === "active" &&
      calf.is_raised &&
      (reminderType === CALF_REMINDER_DEHORNING || calf.gender === "मादी")
  );
}

function getReminderTargetDate(calf, reminderType) {
  if (reminderType === CALF_REMINDER_DEHORNING) {
    return calf?.birth_date ? addDaysToISODate(calf.birth_date, CALF_DEHORNING_START_DAYS) : null;
  }

  return reminderType === CALF_REMINDER_MILK_STOP ? calf?.milk_stop_date : calf?.milk_reduce_date;
}

function findLegacyCalfMatch(reminder, calvesByName) {
  const messageName = normalizeName(extractNameFromReminderMessage(reminder.message));

  if (!messageName) {
    return null;
  }

  const namedMatches = calvesByName.get(messageName) || [];

  if (!namedMatches.length) {
    return null;
  }

  const exactDateMatch = namedMatches.find(
    (calf) => getReminderTargetDate(calf, reminder.type) === reminder.reminder_date
  );

  if (exactDateMatch) {
    return exactDateMatch;
  }

  return namedMatches.length === 1 ? namedMatches[0] : null;
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

  if (isCalfDehorningReminder(reminder)) {
    const daysAfterStart = Math.abs(Math.min(distance, 0));

    if (distance > 0) {
      return `${calfName} आज ${currentAge} आहे. ${toMarathiNumerals(distance)} दिवसांनी शिंग काढण्याची योग्य वेळ सुरू होईल.`;
    }

    if (daysAfterStart <= CALF_DEHORNING_END_DAYS - CALF_DEHORNING_START_DAYS) {
      return `${calfName} आज ${currentAge} आहे. शिंग काढण्याची योग्य वेळ झाली आहे.`;
    }

    return `${calfName} आता ${currentAge} आहे. शिंग काढण्याची योग्य वेळ निघून गेली आहे; पशुवैद्यकाचा सल्ला घ्या.`;
  }

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

      const hasRelatedId = isUuid(reminder.related_record_id);
      const calf = calvesById.get(reminder.related_record_id) || findLegacyCalfMatch(reminder, calvesByName);

      if (calf && !isActiveTrackedCalf(calf, reminder.type) && !reminder.is_done) {
        return null;
      }

      if (!calf && hasRelatedId && !reminder.is_done) {
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
