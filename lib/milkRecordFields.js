import { getTodayISODate } from "@/lib/reminderUtils";

export const milkFields = [
  "date",
  "morning_litres",
  "evening_litres",
  "price_per_litre",
  "morning_price_per_litre",
  "evening_price_per_litre",
  "fat_percentage",
  "morning_fat_percentage",
  "evening_fat_percentage",
  "snf_value",
  "morning_snf_value",
  "evening_snf_value",
  "degree_reading",
  "morning_degree_reading",
  "evening_degree_reading",
  "notes"
];

const zeroDefaultNumberFields = new Set(["morning_litres", "evening_litres"]);
const nullableNumberFields = new Set([
  "price_per_litre",
  "morning_price_per_litre",
  "evening_price_per_litre",
  "fat_percentage",
  "morning_fat_percentage",
  "evening_fat_percentage",
  "snf_value",
  "morning_snf_value",
  "evening_snf_value",
  "degree_reading",
  "morning_degree_reading",
  "evening_degree_reading"
]);

const numericFieldLabels = {
  morning_litres: "सकाळचे दूध",
  evening_litres: "संध्याकाळचे दूध",
  price_per_litre: "दर/लि.",
  morning_price_per_litre: "सकाळचा दर/लि.",
  evening_price_per_litre: "संध्याकाळचा दर/लि.",
  fat_percentage: "फॅट",
  morning_fat_percentage: "सकाळचा फॅट",
  evening_fat_percentage: "संध्याकाळचा फॅट",
  snf_value: "SNF",
  morning_snf_value: "सकाळचा SNF",
  evening_snf_value: "संध्याकाळचा SNF",
  degree_reading: "डिग्री",
  morning_degree_reading: "सकाळची डिग्री",
  evening_degree_reading: "संध्याकाळची डिग्री"
};

const numericFieldLimits = {
  morning_litres: { min: 0, max: 5000 },
  evening_litres: { min: 0, max: 5000 },
  price_per_litre: { min: 0, max: 200 },
  morning_price_per_litre: { min: 0, max: 200 },
  evening_price_per_litre: { min: 0, max: 200 },
  fat_percentage: { min: 0, max: 20 },
  morning_fat_percentage: { min: 0, max: 20 },
  evening_fat_percentage: { min: 0, max: 20 },
  snf_value: { min: 0, max: 20 },
  morning_snf_value: { min: 0, max: 20 },
  evening_snf_value: { min: 0, max: 20 },
  degree_reading: { min: 0, max: 100 },
  morning_degree_reading: { min: 0, max: 100 },
  evening_degree_reading: { min: 0, max: 100 }
};

function normalizeDigits(value) {
  const digitMap = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9"
  };

  return String(value ?? "").replace(/[०-९]/g, (digit) => digitMap[digit] || digit);
}

function isBlank(value) {
  return value === "" || value === null || value === undefined;
}

function normalizeNumber(value, fallback) {
  if (isBlank(value)) {
    return fallback;
  }

  const numberValue = Number(normalizeDigits(value));
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function isISODate(value) {
  const text = String(value || "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }

  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function getRawNumber(value) {
  if (isBlank(value)) {
    return null;
  }

  const numberValue = Number(normalizeDigits(value));
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function validateMilkRecordInput(body = {}, { requireDate = false, requireMilk = false } = {}) {
  const errors = [];

  if (requireDate && !body.date) {
    errors.push("तारीख आवश्यक आहे.");
  }

  if (body.date !== undefined) {
    if (!isISODate(body.date)) {
      errors.push("तारीख चुकीची आहे.");
    } else if (body.date > getTodayISODate()) {
      errors.push("भविष्यातील तारीख वापरता येणार नाही.");
    }
  }

  [...zeroDefaultNumberFields, ...nullableNumberFields].forEach((field) => {
    if (body[field] === undefined || (nullableNumberFields.has(field) && isBlank(body[field]))) {
      return;
    }

    const numberValue = getRawNumber(body[field]);
    const label = numericFieldLabels[field] || field;

    if (numberValue === undefined) {
      errors.push(`${label} योग्य आकड्यात लिहा.`);
      return;
    }

    const limits = numericFieldLimits[field];

    if (limits && numberValue < limits.min) {
      errors.push(`${label} ० पेक्षा कमी नसावे.`);
    }

    if (limits && numberValue > limits.max) {
      errors.push(`${label} असामान्य आहे. कृपया तपासा.`);
    }
  });

  const morningLitres = getRawNumber(body.morning_litres) ?? 0;
  const eveningLitres = getRawNumber(body.evening_litres) ?? 0;

  if (requireMilk && morningLitres + eveningLitres <= 0) {
    errors.push("सकाळचे किंवा संध्याकाळचे दूध लिटर भरा.");
  }

  return errors;
}

export function validateMilkRecordPayload(payload = {}, options = {}) {
  return validateMilkRecordInput(payload, options);
}

export function pickMilkFields(body = {}) {
  return milkFields.reduce((payload, field) => {
    if (body[field] === undefined) {
      return payload;
    }

    if (zeroDefaultNumberFields.has(field)) {
      payload[field] = normalizeNumber(body[field], 0);
      return payload;
    }

    if (nullableNumberFields.has(field)) {
      payload[field] = normalizeNumber(body[field], null);
      return payload;
    }

    payload[field] = field === "notes" ? String(body[field] || "").trim() || null : body[field];
    return payload;
  }, {});
}
