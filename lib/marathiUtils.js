const marathiDigits = {
  0: "०",
  1: "१",
  2: "२",
  3: "३",
  4: "४",
  5: "५",
  6: "६",
  7: "७",
  8: "८",
  9: "९"
};

const marathiMonths = [
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

const breedLabels = {
  HF: "एच एफ",
  hf: "एच एफ",
  Gir: "गीर",
  gir: "गीर",
  Sahiwal: "साहिवाल",
  sahiwal: "साहिवाल",
  Deshi: "देशी",
  deshi: "देशी",
  Jersey: "जर्सी",
  jersey: "जर्सी"
};

export function toMarathiNumerals(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value).replace(/[0-9]/g, (digit) => marathiDigits[digit]);
}

export function calculateAgeMarathi(dateOfBirth) {
  if (!dateOfBirth) {
    return "माहिती नाही";
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return "माहिती नाही";
  }

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return "माहिती नाही";
  }

  if (years > 0 && months > 0) {
    return `${toMarathiNumerals(years)} वर्षे ${toMarathiNumerals(months)} महिने`;
  }

  if (years > 0) {
    return `${toMarathiNumerals(years)} वर्षे`;
  }

  if (months > 0) {
    return `${toMarathiNumerals(months)} महिने`;
  }

  return "१ महिन्यापेक्षा कमी";
}

export function formatMarathiDate(date) {
  if (!date) {
    return "नाही";
  }

  const textDate = String(date);
  const parsedDate = date instanceof Date
    ? new Date(date)
    : new Date(textDate.includes("T") ? textDate : `${textDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "नाही";
  }

  const day = toMarathiNumerals(parsedDate.getDate());
  const month = marathiMonths[parsedDate.getMonth()];
  const year = toMarathiNumerals(parsedDate.getFullYear());

  return `${day} ${month} ${year}`;
}

export function getTodayISODate() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function getCurrentMonthRange() {
  const today = getTodayISODate();
  return today.slice(0, 7);
}

export function formatCowBreed(breed) {
  if (!breed) {
    return "माहिती नाही";
  }

  return breedLabels[breed] || breed;
}

export function formatLitres(value) {
  const numberValue = Number(value || 0);
  const roundedValue = Number.isInteger(numberValue)
    ? numberValue
    : Number(numberValue.toFixed(2));

  return toMarathiNumerals(roundedValue);
}

export function addDaysToDate(date, days) {
  const baseDate = typeof date === "string" ? new Date(`${date}T00:00:00`) : new Date(date);
  baseDate.setDate(baseDate.getDate() + days);
  return baseDate;
}

export function toISODate(date) {
  if (!date) {
    return "";
  }

  const parsedDate = typeof date === "string" ? new Date(`${date}T00:00:00`) : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function autoSuggestVaccinationDate(vaccineName, baseDate = getTodayISODate()) {
  const nextDate = typeof baseDate === "string" ? new Date(`${baseDate}T00:00:00`) : new Date(baseDate);
  const normalizedName = String(vaccineName || "").toLocaleLowerCase("mr-IN");

  if (
    normalizedName.includes("fmd") ||
    normalizedName.includes("खुरपका") ||
    normalizedName.includes("तोंडपका")
  ) {
    nextDate.setMonth(nextDate.getMonth() + 6);
    return nextDate;
  }

  if (
    normalizedName.includes("bq") ||
    normalizedName.includes("hs") ||
    normalizedName.includes("घटसर्प") ||
    normalizedName.includes("हेमोरेजिक")
  ) {
    nextDate.setMonth(nextDate.getMonth() + 12);
    return nextDate;
  }

  if (
    normalizedName.includes("deworming") ||
    normalizedName.includes("जंतनाशक")
  ) {
    nextDate.setMonth(nextDate.getMonth() + 3);
    return nextDate;
  }

  nextDate.setMonth(nextDate.getMonth() + 6);
  return nextDate;
}

export function calculateMilkTotal(morningLitres, eveningLitres) {
  const total = Number(morningLitres || 0) + Number(eveningLitres || 0);
  return `${formatLitres(total)} लिटर`;
}

export function formatCurrency(amount) {
  const numberValue = Number(amount || 0);
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(numberValue);

  return `₹ ${toMarathiNumerals(formattedAmount)}`;
}

export function toMarathiCurrency(amount, options = {}) {
  const numberValue = Number(amount || 0);
  const hasDecimals = !Number.isInteger(numberValue);
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: options.minimumFractionDigits ?? (hasDecimals ? 2 : 0),
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  }).format(numberValue);

  return `₹ ${toMarathiNumerals(formattedAmount)}`;
}
