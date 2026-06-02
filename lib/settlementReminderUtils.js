import { addDaysToISODate, getTodayISODate } from "@/lib/reminderUtils";

const LOOKBACK_MONTHS = 6;
const MARATHI_MONTHS = [
  "जानेवारी",
  "फेब्रुवारी",
  "मार्च",
  "एप्रिल",
  "मे",
  "जून",
  "जुलै",
  "ऑगस्ट",
  "सप्टेंबर",
  "ऑक्टोबर",
  "नोव्हेंबर",
  "डिसेंबर"
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function isoDate(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseISODate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getMonthLength(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths(year, month, offset) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}

function compareISO(first, second) {
  return String(first || "").localeCompare(String(second || ""));
}

function getPeriodLabel(period) {
  const monthName = MARATHI_MONTHS[period.month - 1] || "";
  return `${period.startDay}-${period.endDay} ${monthName} ${period.year}`;
}

function getMonthLabel(period) {
  const monthName = MARATHI_MONTHS[period.month - 1] || "";
  return `${monthName} ${period.year}`;
}

function daysBetween(start, end) {
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
}

function buildPeriodsThroughToday(today = getTodayISODate()) {
  const todayDate = parseISODate(today);
  const todayYear = todayDate.getUTCFullYear();
  const todayMonth = todayDate.getUTCMonth() + 1;
  const periods = [];

  for (let offset = -LOOKBACK_MONTHS; offset <= 0; offset += 1) {
    const { year, month } = addMonths(todayYear, todayMonth, offset);
    const lastDay = getMonthLength(year, month);
    const nextMonth = addMonths(year, month, 1);

    periods.push({
      key: `${year}-${pad(month)}-first`,
      year,
      month,
      startDay: 1,
      endDay: 15,
      start: isoDate(year, month, 1),
      end: isoDate(year, month, 15),
      dueDate: isoDate(year, month, 16)
    });

    periods.push({
      key: `${year}-${pad(month)}-second`,
      year,
      month,
      startDay: 16,
      endDay: lastDay,
      start: isoDate(year, month, 16),
      end: isoDate(year, month, lastDay),
      dueDate: isoDate(nextMonth.year, nextMonth.month, 1)
    });
  }

  return periods.filter((period) => compareISO(period.dueDate, today) <= 0);
}

async function getFarmStartDate(supabase, farmId) {
  const { data, error } = await supabase
    .from("farms")
    .select("created_at")
    .eq("id", farmId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.created_at ? String(data.created_at).slice(0, 10) : null;
}

function settlementCoversPeriod(settlement, period) {
  if (!settlement?.period_start || !settlement?.period_end) {
    return false;
  }

  const start = String(settlement.period_start).slice(0, 10);
  const end = String(settlement.period_end).slice(0, 10);
  const previousDay = addDaysToISODate(period.start, -1);

  if (start === period.start && end === period.end) {
    return true;
  }

  if (compareISO(start, period.start) <= 0 && compareISO(end, period.end) >= 0) {
    return true;
  }

  return end === period.end && (start === period.start || start === previousDay);
}

function buildPendingPeriod(period, today) {
  const label = getPeriodLabel(period);

  return {
    id: `pending-settlement-slip-${period.start}-${period.end}`,
    key: period.key,
    year: period.year,
    month: period.month,
    month_key: `${period.year}-${pad(period.month)}`,
    month_label: getMonthLabel(period),
    period_label: label,
    start_date: period.start,
    end_date: period.end,
    due_date: period.dueDate,
    start_day: period.startDay,
    end_day: period.endDay,
    days_overdue: daysBetween(period.dueDate, today),
    upload_href: "/accounting/slip-scan"
  };
}

function filterByRange(reminders, { from, to } = {}) {
  return reminders.filter((reminder) => {
    if (from && compareISO(reminder.reminder_date, from) < 0) {
      return false;
    }

    if (to && compareISO(reminder.reminder_date, to) > 0) {
      return false;
    }

    return true;
  });
}

export async function getMissingSettlementSlipPeriods(
  supabase,
  farmId,
  { today = getTodayISODate(), from = null, to = null } = {}
) {
  const farmStartDate = await getFarmStartDate(supabase, farmId);
  const duePeriods = buildPeriodsThroughToday(today).filter(
    (period) => !farmStartDate || compareISO(period.end, farmStartDate) >= 0
  );

  if (!duePeriods.length) {
    return [];
  }

  const firstPeriodStart = duePeriods[0].start;
  const lastPeriodEnd = duePeriods[duePeriods.length - 1].end;
  const { data, error } = await supabase
    .from("dairy_settlements")
    .select("id, period_start, period_end")
    .eq("farm_id", farmId)
    .gte("period_end", firstPeriodStart)
    .lte("period_end", lastPeriodEnd);

  if (error) {
    throw error;
  }

  const pendingPeriods = duePeriods
    .filter((period) => !(data || []).some((settlement) => settlementCoversPeriod(settlement, period)))
    .map((period) => buildPendingPeriod(period, today));

  return filterByRange(
    pendingPeriods.map((period) => ({
      ...period,
      reminder_date: period.due_date
    })),
    { from, to }
  ).map(({ reminder_date, ...period }) => period);
}
