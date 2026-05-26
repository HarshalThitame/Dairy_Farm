import { toMarathiNumerals } from "@/lib/marathiUtils";

export const CALF_MILK_REDUCE_DAYS = 40;
export const CALF_MILK_STOP_DAYS = 60;
export const CALF_REMINDER_MILK_REDUCE = "वासरी दूध कमी";
export const CALF_REMINDER_MILK_STOP = "वासरी दूध बंद";

export const calfStatuses = {
  active: "सक्रिय",
  historical: "फक्त जन्म नोंद",
  sold: "विकली",
  dead: "मृत",
  converted_to_cow: "गाय झाली"
};

export function addDaysToISODate(dateString, days) {
  const [year, month, day] = String(dateString || "")
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day + Number(days || 0)));
  return date.toISOString().slice(0, 10);
}

export function getCalfLifecycleDates(birthDate) {
  return {
    milkReduceDate: addDaysToISODate(birthDate, CALF_MILK_REDUCE_DAYS),
    milkStopDate: addDaysToISODate(birthDate, CALF_MILK_STOP_DAYS)
  };
}

export function getCalfAgeDays(birthDate, today = new Date()) {
  if (!birthDate) {
    return 0;
  }

  const birth = new Date(`${birthDate}T00:00:00`);
  const current = typeof today === "string" ? new Date(`${today}T00:00:00`) : new Date(today);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(current.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((current - birth) / 86400000));
}

export function getCalfAgeText(birthDate, today) {
  const days = getCalfAgeDays(birthDate, today);
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (months > 0 && remainingDays > 0) {
    return `${toMarathiNumerals(months)} महिने ${toMarathiNumerals(remainingDays)} दिवस`;
  }

  if (months > 0) {
    return `${toMarathiNumerals(months)} महिने`;
  }

  return `${toMarathiNumerals(days)} दिवस`;
}

export function getCalfMilkStatus(calf, today) {
  if (!calf?.is_raised) {
    return "फक्त जन्म नोंद";
  }

  if (calf.status && calf.status !== "active") {
    return calfStatuses[calf.status] || calf.status;
  }

  const currentDate = typeof today === "string" ? today : new Date(today || Date.now()).toISOString().slice(0, 10);
  const reduceDate = calf.milk_reduce_date || getCalfLifecycleDates(calf.birth_date).milkReduceDate;
  const stopDate = calf.milk_stop_date || getCalfLifecycleDates(calf.birth_date).milkStopDate;

  if (currentDate < reduceDate) {
    return "दूध पाजायचे सुरू आहे";
  }

  if (currentDate < stopDate) {
    return "दूध कमी करायचे";
  }

  return "दूध बंद";
}
