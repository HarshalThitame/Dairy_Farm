export const COW_FIELDS = [
  "name",
  "breed",
  "date_of_birth",
  "tag_number",
  "color",
  "status",
  "purchased_on",
  "notes",
  "photo_url",
  "photo_storage_path",
  "is_active"
];

export const DEFAULT_COW_BREED = "जर्सी";
export const ALLOWED_COW_STATUSES = new Set(["गाभण", "रिकामी", "व्याललेली", "उपचार सुरू", "वाळलेली"]);

function cleanText(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanNullableText(value, maxLength = 160) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function normalizeDate(value) {
  if (value === null || value === "") {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return cleanText(value, 10);
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function parseISODate(value) {
  if (!value) {
    return null;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return value;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function buildCowPayload(body = {}, mode = "update") {
  const payload = {};

  for (const field of COW_FIELDS) {
    if (body[field] === undefined) {
      continue;
    }

    if (["name", "breed", "tag_number", "color", "notes", "photo_url", "photo_storage_path", "status"].includes(field)) {
      payload[field] = cleanNullableText(body[field], field === "notes" ? 1000 : 180);
      continue;
    }

    if (field === "date_of_birth" || field === "purchased_on") {
      payload[field] = normalizeDate(body[field]);
      continue;
    }

    if (field === "is_active") {
      const nextBoolean = normalizeBoolean(body[field]);
      if (nextBoolean !== undefined) {
        payload[field] = nextBoolean;
      }
    }
  }

  if (mode === "create") {
    payload.name = cleanText(body.name, 180);
    payload.breed = cleanText(body.breed, 120) || DEFAULT_COW_BREED;
    payload.is_active = true;
  }

  if (payload.status === null) {
    delete payload.status;
  }

  if (payload.breed === null && mode === "create") {
    payload.breed = DEFAULT_COW_BREED;
  }

  return payload;
}

export function validateCowPayload(payload = {}, { requireName = false } = {}) {
  const errors = [];

  if (requireName || payload.name !== undefined) {
    if (!payload.name || String(payload.name).trim().length < 2) {
      errors.push("गायीचे नाव किमान २ अक्षरे असावे.");
    }
  }

  if (payload.status !== undefined && payload.status !== null && !ALLOWED_COW_STATUSES.has(payload.status)) {
    errors.push("गायीची स्थिती चुकीची आहे.");
  }

  const today = todayISO();

  for (const [field, label] of [
    ["date_of_birth", "जन्म तारीख"],
    ["purchased_on", "खरेदी तारीख"]
  ]) {
    if (payload[field] === undefined || payload[field] === null) {
      continue;
    }

    const parsed = parseISODate(payload[field]);
    if (!parsed) {
      errors.push(`${label} योग्य स्वरूपात लिहा.`);
      continue;
    }

    if (parsed > today) {
      errors.push(`${label} भविष्यातील नसावी.`);
    }
  }

  if (payload.date_of_birth && payload.purchased_on) {
    const dob = parseISODate(payload.date_of_birth);
    const purchasedOn = parseISODate(payload.purchased_on);
    if (dob && purchasedOn && purchasedOn < dob) {
      errors.push("खरेदी तारीख जन्म तारखेपूर्वी नसावी.");
    }
  }

  if (payload.tag_number && String(payload.tag_number).length > 60) {
    errors.push("कान टॅग नंबर ६० अक्षरांपेक्षा कमी असावा.");
  }

  return errors;
}
