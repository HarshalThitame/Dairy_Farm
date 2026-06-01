const INDIA_TIME_ZONE = "Asia/Kolkata";
const MAX_RANGE_DAYS = 370;

export function getIndiaTodayISODate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function parseISODate(dateString) {
  const match = String(dateString || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function addDaysISO(dateString, days) {
  const date = parseISODate(dateString);

  if (!date) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetweenInclusive(startDate, endDate) {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  if (!start || !end) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function normalizeToolDateRange(args = {}) {
  const startDate = String(args.startDate || "").slice(0, 10);
  const endDate = String(args.endDate || "").slice(0, 10);
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  if (!start || !end) {
    throw new Error("तारीख YYYY-MM-DD format मध्ये द्या.");
  }

  if (end < start) {
    throw new Error("शेवटची तारीख सुरू तारखेपेक्षा आधी असू शकत नाही.");
  }

  const dayCount = daysBetweenInclusive(startDate, endDate);

  if (dayCount > MAX_RANGE_DAYS) {
    throw new Error("एकावेळी ३७० दिवसांपेक्षा मोठा कालावधी विचारू नका.");
  }

  return { startDate, endDate, dayCount };
}

export function getCurrentDateContext() {
  const today = getIndiaTodayISODate();
  const [year, month] = today.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const monthEnd = addDaysISO(nextMonthDate.toISOString().slice(0, 10), -1);
  const previousMonthDate = new Date(Date.UTC(year, month - 2, 1));
  const previousMonthYear = previousMonthDate.getUTCFullYear();
  const previousMonth = previousMonthDate.getUTCMonth() + 1;
  const previousMonthStart = `${previousMonthYear}-${String(previousMonth).padStart(2, "0")}-01`;
  const previousMonthEnd = addDaysISO(monthStart, -1);

  return {
    today,
    yesterday: addDaysISO(today, -1),
    currentMonthStart: monthStart,
    currentMonthEnd: monthEnd,
    previousMonthStart,
    previousMonthEnd,
    currentYear: year
  };
}
