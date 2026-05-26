export const milkFields = [
  "cow_id",
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

function normalizeNumber(value, fallback) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
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

    payload[field] = body[field];
    return payload;
  }, {});
}
