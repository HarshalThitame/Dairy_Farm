import OpenAI from "openai";

export const DEFAULT_SLIP_OCR_MODEL =
  process.env.OPENAI_MODEL_PRIMARY ||
  process.env.OPENAI_OCR_PRIMARY_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4o-mini";

export const FALLBACK_SLIP_OCR_MODEL =
  process.env.OPENAI_MODEL_FALLBACK ||
  process.env.OPENAI_OCR_FALLBACK_MODEL ||
  "gpt-4.1-mini";

const MODEL_PRICE_PER_MILLION = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4-turbo": { input: 10, output: 30 }
};

const OCR_MAX_TOKENS = Math.max(4000, Number(process.env.OPENAI_OCR_MAX_TOKENS || 7000));

const SYSTEM_PROMPT = `You are an expert OCR system for INDIAN DAIRY SLIPS used by Maharashtra dairy cooperatives.

Primary target: thermal-printer daily milk slips. They may be faded, worn, tilted, cropped, or printed with weak ink.

REAL DAILY THERMAL SLIP FORMAT:
- Serial/barcode-like numeric lines at top and middle, for example 6600000000000000 or 9900000000000000. IGNORE these.
- DATE              DD/MM/YYYY
- TIME              HH:MM:SS
- SHIFT             MORNING or EVENING
- MILK_TYPE         COW or BUFFALO
- CODE_NO           farmer dairy code
- LITRE             decimal milk quantity
- FAT               decimal percentage
- CLR               numeric score, for example 30.0. This is NOT a letter grade.
- SNF               decimal percentage
- RATE              rupees per liter
- AMOUNT            total rupees

CRITICAL RULES:
1. Return ONLY valid JSON, no explanation or markdown.
2. NEVER guess or estimate unreadable numbers.
3. Use null for unclear or missing fields.
4. Ignore serial/barcode numbers completely.
5. Financial accuracy is paramount. Preserve decimal precision and never round.
6. DATE on thermal slips is usually DD/MM/YYYY and MUST be converted to YYYY-MM-DD.
   Example: 27/05/2026 -> 2026-05-27.
7. SHIFT must become Marathi session:
   MORNING or सकाळ -> "सकाळ"
   EVENING or संध्याकाळ -> "संध्याकाळ"
8. MILK_TYPE must be "cow" or "buffalo".
   COW or गाय -> "cow"
   BUFFALO or म्हैस -> "buffalo"
9. CODE_NO must be returned as dairy_member_code string.
10. CLR must be returned as numeric clr_score.
11. AMOUNT printed on the slip must be returned as slip_printed_amount exactly as read.
12. If LITRE and RATE are readable, also calculate total_amount = LITRE x RATE.
    If slip_printed_amount and calculated total_amount do not match, do not guess. Return both values.
13. Detect slip_type: "daily" or "settlement".
14. Return confidence_score from 0.0 to 1.0 based on text clarity.
15. List all missing important fields in missing_fields.

RETURN JSON FORMAT FOR DAILY THERMAL SLIP:
{
  "slip_type": "daily",
  "dairy_name": "string or null",
  "member_number": "string or null",
  "dairy_member_code": "52",
  "slip_date": "2026-05-27",
  "slip_time": "07:06:54",
  "session": "संध्याकाळ",
  "milk_type": "cow",
  "liters": 139.40,
  "fat_percentage": 3.3,
  "snf_percentage": 8.6,
  "clr_score": 30.0,
  "rate_per_liter": 36.40,
  "slip_printed_amount": 5074.16,
  "total_amount": 5074.16,
  "confidence_score": 0.95,
  "missing_fields": [],
  "notes": "Thermal printer slip, clear readability"
}

SETTLEMENT SLIP FIELDS:
{
  "slip_type": "settlement",
  "dairy_name": "string or null",
  "farmer_name": "string or null",
  "farmer_code": "string or null",
  "member_number": "string or null",
  "dairy_member_code": "string or null",
  "settlement_date": "YYYY-MM-DD or null",
  "period_start": "YYYY-MM-DD or null",
  "period_end": "YYYY-MM-DD or null",
  "animal_type": "गाय or म्हैस or null",
  "session_entries": [
    {
      "date": "YYYY-MM-DD",
      "session": "सकाळ",
      "liters": number,
      "fat_percent": number,
      "snf_percent": number,
      "rate_per_liter": number,
      "amount": number
    },
    {
      "date": "YYYY-MM-DD",
      "session": "संध्याकाळ",
      "liters": number,
      "fat_percent": number,
      "snf_percent": number,
      "rate_per_liter": number,
      "amount": number
    }
  ],
  "daily_entries": [
    {
      "date": "YYYY-MM-DD",
      "morning": { "liters": number, "fat_percent": number, "snf_percent": number, "rate_per_liter": number, "amount": number },
      "evening": { "liters": number, "fat_percent": number, "snf_percent": number, "rate_per_liter": number, "amount": number },
      "total_liters": number,
      "total_amount": number
    }
  ],
  "daily_total_liters": number or null,
  "daily_total_amount": number or null,
  "bank_account_no": "string or null",
  "bank_name": "string or null",
  "account_no": "string or null",
  "avg_rate": number or null,
  "total_liters_section2": number or null,
  "total_amount_section2": number or null,
  "total_liters": number or null,
  "total_milk_income": number or null,
  "deductions": {
    "feed_deduction": number or null,
    "anamat_cut": number or 0,
    "other_deductions": number or null,
    "total_deductions": number or null
  },
  "balance_before_round": number or null,
  "round_adjustment": number or null,
  "net_payable": number or null,
  "confidence_score": 0.0-1.0,
  "missing_fields": ["array of missing fields"],
  "notes": "any additional observations"
}

15-DAY MARATHI SETTLEMENT SLIPS:
- These are printed paper bills, not thermal daily slips.
- Real Maharashtra slips usually have TWO side-by-side tables:
  left table "सकाळ" and right table "संध्याकाळ".
- Extract EVERY visible row from BOTH tables. A 16-day period can have 32 session rows.
- Put all raw session rows in session_entries with exact session = "सकाळ" or "संध्याकाळ".
- To keep JSON valid and compact, prefer returning session_entries only. You may omit daily_entries or return [].
- The application will combine session_entries into date-wise daily_entries.
- Do not confuse the left and right table totals with the final settlement totals.
- Extract fields from each table row: तारीख, लिटर, फॅट, SNF, दर/लि, रक्कम.
- Convert dates such as १६/०३/२०२६ or 16/03/2026 to YYYY-MM-DD.
- Important labels:
  एकूण रक्कम / एकूण उत्पन्न in the bottom-right summary = total_milk_income
  एकूण कपात = deductions.total_deductions
  खाद्य कपात / पशुखाद्य / कपात रु = deductions.feed_deduction
  अनामत कपात / भरती अनामत / अनामत = deductions.anamat_cut
  इतर कपात = deductions.other_deductions
  शिल्लक रक्कम = balance_before_round
  राऊंड रक्कम = round_adjustment
  निर्बळ रक्कम / निव्वळ रक्कम = net_payable
- Anamat is a farmer savings/deposit deduction. If not present, return anamat_cut as 0. If unclear, return null and add it to missing_fields.
- NEVER mix anamat_cut into other_deductions. Keep it separate.
- If a box/header says "भरती अनामत" or "अनामत" and nearby line says "कपात रु ####.##", that amount is deductions.anamat_cut.
- If a deduction label says "खाद्य", "पशुखाद्य", "feed", or "cattle feed", that amount is deductions.feed_deduction.
- If only "एकूण कपात" is readable but individual labels are unclear, set total_deductions to that amount, set unclear individual fields to null, and add them to missing_fields. Do not guess.
- "सहाय्याची बाकी", "जमा", bank account numbers, bill number, and account number are NOT deductions unless there is a clear कपात label.
- If the bottom-right summary says:
  सरासरी भाव, एकूण लिटर, एकूण रक्कम, एकूण उत्पन्न, एकूण कपात, शिल्लक रक्कम, राऊंड रक्कम, निव्वळ रक्कम
  then those values are authoritative for settlement totals.
- CRITICAL VALIDATION:
  1. Final summary fields are highest priority: एकूण लिटर, एकूण रक्कम/एकूण उत्पन्न, एकूण कपात, शिल्लक रक्कम, राऊंड रक्कम, निव्वळ रक्कम.
  2. If daily rows and summary totals conflict, trust summary totals and mark daily rows as suspect.
  3. Never replace summary totals with generated daily rows.
  4. Compare extracted daily/session liters against the summary "एकूण लिटर".
  5. Compare sum of daily/session amounts against "एकूण रक्कम".
  6. If any daily/session row has unrealistic liters (>500) while neighboring rows are around 50-200, mark that row as OCR error; do not output 999/1999 style values.
  7. Never duplicate one day's values across all dates. Repeated identical rows are an OCR failure.
  8. If financial field confidence is below 0.95, lower confidence_score and add a warning.
  9. If daily rows and summary totals conflict, preserve summary totals exactly and require farmer review.
- For the sample-style Marathi settlement summary, values like सरासरी भाव, एकूण लिटर, एकूण रक्कम, एकूण उत्पन्न, एकूण कपात, शिल्लक रक्कम, राऊंड रक्कम, निव्वळ रक्कम are settlement-level totals. Do not derive them from row OCR if they are visible.
- NEVER output impossible totals such as joining two numbers together. If unsure, use null.
- Return compact/minified JSON. Do not pretty-print large arrays.

THERMAL PRINTER CHALLENGES:
- Paper may be faded, old, shiny, or partly torn.
- Digits may look alike: 0/O, 1/l/I, 5/S, 8/B.
- If unclear, set that field to null and add field name to missing_fields.
- Reduce confidence_score if date, liters, rate, amount, FAT, SNF, or CLR are unclear.`;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY सेट केलेली नाही.");
  }

  return new OpenAI({ apiKey });
}

function parseJsonResponse(text) {
  try {
    return JSON.parse(text);
  } catch (firstError) {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response मध्ये JSON सापडले नाही.");
    }
    try {
      return JSON.parse(match[0]);
    } catch (secondError) {
      throw new Error(
        `AI ने अपूर्ण/चुकीचा JSON दिला. पुन्हा AI वाचा करा. मूळ त्रुटी: ${secondError?.message || firstError?.message}`
      );
    }
  }
}

function normalizeConfidence(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, numberValue));
}

function normalizeSlipType(value) {
  if (value === "daily" || value === "settlement") {
    return value;
  }
  return null;
}

function normalizeMissingFields(fields) {
  if (!Array.isArray(fields)) {
    return [];
  }

  return fields
    .map((field) => String(field || "").trim())
    .filter(Boolean);
}

function normalizeNumerals(value) {
  const devanagariDigits = "०१२३४५६७८९";
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";

  return String(value ?? "")
    .replace(/[०-९]/g, (digit) => String(devanagariDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)));
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value)
    .replace(/[०-९٠-٩]/g, (digit) => normalizeNumerals(digit))
    .replace(/[,₹\s]/g, "")
    .replace(/[Oo]/g, "0");
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeDate(value, fallbackYear = null) {
  if (!value) {
    return value;
  }

  const text = normalizeNumerals(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (slashMatch) {
    const [, day, month, rawYear] = slashMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const partialMatch = text.match(/^(\d{1,2})[/-](\d{1,2})$/);

  if (partialMatch && fallbackYear) {
    const [, day, month] = partialMatch;
    return `${String(fallbackYear).padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return text;
}

function normalizeTime(value) {
  if (!value) {
    return null;
  }

  const text = normalizeNumerals(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);

  if (!match) {
    return text;
  }

  const [, hour, minute, second = "00"] = match;
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
}

function normalizeSession(value) {
  const text = String(value || "").trim();
  const upper = text.toUpperCase();

  if (upper.includes("MORNING") || text.includes("सकाळ")) {
    return "सकाळ";
  }

  if (upper.includes("EVENING") || text.includes("संध्याकाळ") || text.includes("सायंकाळ")) {
    return "संध्याकाळ";
  }

  return text || null;
}

function normalizeSettlementSession(value) {
  const session = normalizeSession(value);

  if (session === "सकाळ" || session === "संध्याकाळ") {
    return session;
  }

  return null;
}

function normalizeMilkType(value) {
  const text = String(value || "").trim();
  const upper = text.toUpperCase();

  if (upper.includes("BUFFALO") || text.includes("म्हैस")) {
    return "buffalo";
  }

  if (upper.includes("COW") || text.includes("गाय")) {
    return "cow";
  }

  return text ? text.toLowerCase() : null;
}

function mergeNotes(existing, addition) {
  const notes = [existing, addition].filter(Boolean);
  return notes.length ? notes.join(" ") : existing || null;
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function relativeDifference(first, second) {
  if (!hasNumber(first) || !hasNumber(second)) {
    return null;
  }

  const denominator = Math.max(Math.abs(Number(first)), Math.abs(Number(second)), 1);
  return Math.abs(Number(first) - Number(second)) / denominator;
}

function median(numbers) {
  const sorted = numbers
    .filter((number) => Number.isFinite(Number(number)))
    .map(Number)
    .sort((first, second) => first - second);

  if (!sorted.length) {
    return null;
  }

  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function buildAmountVerification(liters, ratePerLiter, printedAmount) {
  const calculatedAmount =
    liters !== null && ratePerLiter !== null ? roundMoney(Number(liters) * Number(ratePerLiter)) : null;
  const difference =
    calculatedAmount !== null && printedAmount !== null
      ? roundMoney(Number(printedAmount) - Number(calculatedAmount))
      : null;
  const status =
    calculatedAmount === null || printedAmount === null
      ? "not_checked"
      : Math.abs(difference) <= 0.01
        ? "matched"
        : "mismatch";

  return {
    printed_amount: printedAmount,
    calculated_amount: calculatedAmount,
    difference,
    status
  };
}

function normalizeSettlementRow(entry, defaultSession = null, defaultDate = null, fallbackYear = null) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const row = {
    date: normalizeDate(entry.date || entry.slip_date || defaultDate, fallbackYear),
    session: normalizeSettlementSession(entry.session || entry.shift || defaultSession),
    liters: parseNumber(entry.liters ?? entry.litre ?? entry.total_liters),
    fat_percent: parseNumber(entry.fat_percent ?? entry.fat_percentage ?? entry.fat),
    snf_percent: parseNumber(entry.snf_percent ?? entry.snf_percentage ?? entry.snf),
    rate_per_liter: parseNumber(entry.rate_per_liter ?? entry.rate ?? entry.rate_per_litre),
    amount: parseNumber(entry.amount ?? entry.total_amount)
  };

  if (!row.date && row.liters === null && row.amount === null) {
    return null;
  }

  return row;
}

function sessionRowScore(row) {
  return ["date", "session", "liters", "fat_percent", "snf_percent", "rate_per_liter", "amount"].reduce(
    (score, field) => score + (row?.[field] !== null && row?.[field] !== undefined && row?.[field] !== "" ? 1 : 0),
    0
  );
}

function addSettlementRows(rows, entries, defaultSession = null, defaultDate = null, fallbackYear = null) {
  if (!Array.isArray(entries)) {
    return;
  }

  entries.forEach((entry) => {
    const row = normalizeSettlementRow(entry, defaultSession, defaultDate, fallbackYear);
    if (row) {
      rows.push(row);
    }
  });
}

function normalizeSettlementSessionEntries(data = {}) {
  const rows = [];
  const normalizedPeriodStart = normalizeDate(data.period_start);
  const normalizedPeriodEnd = normalizeDate(data.period_end);
  const fallbackYear =
    String(normalizedPeriodStart || normalizedPeriodEnd || "").match(/^(\d{4})-/)?.[1] || null;

  addSettlementRows(rows, data.session_entries, null, null, fallbackYear);
  addSettlementRows(rows, data.milk_entries, null, null, fallbackYear);
  addSettlementRows(rows, data.entries, null, null, fallbackYear);
  addSettlementRows(rows, data.morning_entries, "सकाळ", null, fallbackYear);
  addSettlementRows(rows, data.sakal_entries, "सकाळ", null, fallbackYear);
  addSettlementRows(rows, data.evening_entries, "संध्याकाळ", null, fallbackYear);
  addSettlementRows(rows, data.sandhyakal_entries, "संध्याकाळ", null, fallbackYear);

  if (Array.isArray(data.daily_entries)) {
    data.daily_entries.forEach((entry) => {
      if (!entry || typeof entry !== "object") {
        return;
      }

      const date = entry.date || entry.slip_date;
      const morning = entry.morning || entry.sakal || entry["सकाळ"];
      const evening = entry.evening || entry.sandhyakal || entry["संध्याकाळ"];

      if (morning || evening) {
        const morningRow = normalizeSettlementRow(morning, "सकाळ", date, fallbackYear);
        const eveningRow = normalizeSettlementRow(evening, "संध्याकाळ", date, fallbackYear);
        if (morningRow) rows.push(morningRow);
        if (eveningRow) rows.push(eveningRow);
        return;
      }

      const morningFromFlat = normalizeSettlementRow(
        {
          date,
          liters: entry.morning_liters ?? entry.morning_litres,
          fat_percent: entry.morning_fat_percent ?? entry.morning_fat,
          snf_percent: entry.morning_snf_percent ?? entry.morning_snf,
          rate_per_liter: entry.morning_rate_per_liter ?? entry.morning_rate,
          amount: entry.morning_amount
        },
        "सकाळ",
        date,
        fallbackYear
      );
      const eveningFromFlat = normalizeSettlementRow(
        {
          date,
          liters: entry.evening_liters ?? entry.evening_litres,
          fat_percent: entry.evening_fat_percent ?? entry.evening_fat,
          snf_percent: entry.evening_snf_percent ?? entry.evening_snf,
          rate_per_liter: entry.evening_rate_per_liter ?? entry.evening_rate,
          amount: entry.evening_amount
        },
        "संध्याकाळ",
        date,
        fallbackYear
      );

      let pushedFlat = false;
      if (morningFromFlat && (morningFromFlat.liters !== null || morningFromFlat.amount !== null)) {
        rows.push(morningFromFlat);
        pushedFlat = true;
      }
      if (eveningFromFlat && (eveningFromFlat.liters !== null || eveningFromFlat.amount !== null)) {
        rows.push(eveningFromFlat);
        pushedFlat = true;
      }
      if (!pushedFlat) {
        const row = normalizeSettlementRow(entry, null, null, fallbackYear);
        if (row) rows.push(row);
      }
    });
  }

  const bestRows = new Map();
  rows.forEach((row, index) => {
    const key = `${row.date || `no-date-${index}`}|${row.session || `no-session-${index}`}`;
    const existing = bestRows.get(key);
    if (!existing || sessionRowScore(row) > sessionRowScore(existing)) {
      bestRows.set(key, row);
    }
  });

  return Array.from(bestRows.values()).sort((first, second) => {
    const dateCompare = String(first.date || "").localeCompare(String(second.date || ""));
    if (dateCompare !== 0) return dateCompare;
    const sessionOrder = { "सकाळ": 1, "संध्याकाळ": 2 };
    return (sessionOrder[first.session] || 9) - (sessionOrder[second.session] || 9);
  });
}

function weightedAverage(rows, field) {
  const weighted = rows
    .filter((row) => row[field] !== null && row[field] !== undefined && Number(row.liters || 0) > 0)
    .reduce(
      (total, row) => ({
        value: total.value + Number(row[field] || 0) * Number(row.liters || 0),
        liters: total.liters + Number(row.liters || 0)
      }),
      { value: 0, liters: 0 }
    );

  return weighted.liters > 0 ? roundMoney(weighted.value / weighted.liters) : null;
}

function combineSettlementDailyEntries(sessionEntries = []) {
  const grouped = new Map();

  sessionEntries.forEach((row) => {
    const key = row.date || "तारीख नाही";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(row);
  });

  return Array.from(grouped.entries())
    .map(([date, rows]) => {
      const morning = rows.find((row) => row.session === "सकाळ") || null;
      const evening = rows.find((row) => row.session === "संध्याकाळ") || null;
      const totalLiters = roundMoney(rows.reduce((sum, row) => sum + Number(row.liters || 0), 0));
      const totalAmount = roundMoney(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0));

      return {
        date,
        morning,
        evening,
        liters: totalLiters,
        total_liters: totalLiters,
        fat_percent: weightedAverage(rows, "fat_percent"),
        snf_percent: weightedAverage(rows, "snf_percent"),
        rate_per_liter: totalLiters > 0 ? roundMoney(totalAmount / totalLiters) : weightedAverage(rows, "rate_per_liter"),
        amount: totalAmount,
        total_amount: totalAmount
      };
    })
    .sort((first, second) => String(first.date || "").localeCompare(String(second.date || "")));
}

function normalizeSettlementDeductions(data) {
  const deductions = data?.deductions || {};
  const feedDeduction = parseNumber(
    data.cattle_feed_deduction ??
      data.feed_deduction ??
      data.khadya_deduction ??
      deductions.feed_deduction ??
      deductions.cattle_feed_deduction
  );
  const anamatCut = parseNumber(
    data.anamat_cut ??
      data.anamat_deduction ??
      data.deposit_deduction ??
      deductions.anamat_cut ??
      deductions.anamat_deduction
  );
  let otherDeductions = parseNumber(data.other_deductions ?? deductions.other_deductions);
  const explicitTotal = parseNumber(data.total_deductions ?? deductions.total_deductions);

  if (
    explicitTotal !== null &&
    (otherDeductions === null || otherDeductions <= 0) &&
    explicitTotal > Number(feedDeduction || 0) + Number(anamatCut || 0)
  ) {
    otherDeductions = roundMoney(explicitTotal - Number(feedDeduction || 0) - Number(anamatCut || 0));
  }

  const totalDeductions =
    explicitTotal ??
    (feedDeduction !== null || anamatCut !== null || otherDeductions !== null
      ? Number(
          Number(feedDeduction || 0) +
            Number(anamatCut || 0) +
            Number(otherDeductions || 0)
        ).toFixed(2)
      : null);

  return {
    feed_deduction: feedDeduction,
    anamat_cut: anamatCut ?? 0,
    other_deductions: otherDeductions,
    total_deductions: totalDeductions === null ? null : Number(totalDeductions)
  };
}

function findUnrealisticSettlementRows(sessionEntries = []) {
  const liters = sessionEntries
    .map((row) => Number(row?.liters))
    .filter((value) => Number.isFinite(value) && value > 0);
  const typicalLiters = median(liters.filter((value) => value <= 500));
  const threshold = Math.max(500, typicalLiters ? typicalLiters * 3 : 500);

  return sessionEntries
    .map((row, index) => ({
      index,
      date: row?.date || null,
      session: row?.session || null,
      liters: Number(row?.liters)
    }))
    .filter((row) => Number.isFinite(row.liters) && row.liters > threshold);
}

function findDuplicateSettlementRows(sessionEntries = []) {
  const signatures = new Map();

  sessionEntries.forEach((row) => {
    if (!row?.date || !hasNumber(row?.liters) || !hasNumber(row?.rate_per_liter)) {
      return;
    }

    const signature = [
      Number(row.liters).toFixed(2),
      hasNumber(row.fat_percent) ? Number(row.fat_percent).toFixed(2) : "-",
      hasNumber(row.snf_percent) ? Number(row.snf_percent).toFixed(2) : "-",
      Number(row.rate_per_liter).toFixed(2),
      hasNumber(row.amount) ? Number(row.amount).toFixed(2) : "-"
    ].join("|");

    if (!signatures.has(signature)) {
      signatures.set(signature, []);
    }
    signatures.get(signature).push(`${row.date}|${row.session || "-"}`);
  });

  return Array.from(signatures.entries())
    .filter(([, rows]) => rows.length >= 5)
    .map(([signature, rows]) => ({ signature, rows }));
}

function validateSettlementExtraction({
  sessionEntries,
  dailyEntries,
  dailyTotalLiters,
  dailyTotalAmount,
  summaryTotalLiters,
  summaryTotalIncome,
  deductions,
  netPayable,
  confidence
}) {
  const errors = [];
  const warnings = [];
  const rowIssues = {
    unrealistic_rows: findUnrealisticSettlementRows(sessionEntries),
    duplicate_groups: findDuplicateSettlementRows(sessionEntries)
  };

  if (rowIssues.unrealistic_rows.length) {
    errors.push("दैनिक/सत्र लिटर अवास्तव दिसते (>500). AI ने 999/1999 सारखा चुकीचा आकडा वाचला असू शकतो.");
  }

  if (rowIssues.duplicate_groups.length) {
    errors.push("एकाच दिवसाचा डेटा अनेक तारखांसाठी repeat झाल्यासारखा दिसतो.");
  }

  if (hasNumber(summaryTotalLiters) && hasNumber(dailyTotalLiters)) {
    const absoluteDiff = Math.abs(Number(summaryTotalLiters) - Number(dailyTotalLiters));
    const relative = relativeDifference(summaryTotalLiters, dailyTotalLiters);
    if (absoluteDiff > 5 && relative > 0.02) {
      warnings.push("दैनिक लिटरची बेरीज आणि स्लिपवरील एकूण लिटर जुळत नाही. स्लिपवरील एकूण लिटर वापरले आहे.");
    }
  }

  if (hasNumber(summaryTotalIncome) && hasNumber(dailyTotalAmount)) {
    const absoluteDiff = Math.abs(Number(summaryTotalIncome) - Number(dailyTotalAmount));
    const relative = relativeDifference(summaryTotalIncome, dailyTotalAmount);
    if (absoluteDiff > 100 && relative > 0.02) {
      warnings.push("दैनिक रकमेची बेरीज आणि स्लिपवरील एकूण रक्कम जुळत नाही. स्लिपवरील summary रक्कम वापरली आहे.");
    }
  }

  const dailyCount = Array.isArray(dailyEntries) ? dailyEntries.length : 0;
  const sessionCount = Array.isArray(sessionEntries) ? sessionEntries.length : 0;
  if (dailyCount < 10 && sessionCount < 20) {
    warnings.push("15 दिवसांची सर्व सकाळ/संध्याकाळ नोंद AI ला स्पष्ट वाचता आली नाही.");
  }

  if (Number(confidence || 0) < 0.95) {
    warnings.push("आर्थिक माहिती पूर्ण खात्रीशीर नाही. कृपया सर्व आकडे तपासा.");
  }

  if (hasNumber(summaryTotalIncome) && deductions?.total_deductions === null) {
    warnings.push("एकूण कपात स्पष्ट वाचता आली नाही. खाद्य/अनामत/इतर कपात हाताने तपासा.");
  }

  if (!hasNumber(netPayable)) {
    warnings.push("निव्वळ रक्कम स्पष्ट वाचता आली नाही.");
  }

  if (hasNumber(summaryTotalIncome) && hasNumber(deductions?.total_deductions) && hasNumber(netPayable)) {
    const calculatedNet = roundMoney(Number(summaryTotalIncome) - Number(deductions.total_deductions));
    if (Math.abs(calculatedNet - Number(netPayable)) > 1) {
      warnings.push("दूध उत्पन्न - एकूण कपात = निव्वळ रक्कम हा हिशोब जुळत नाही. summary आकडे तपासा.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    requires_manual_review: errors.length > 0 || warnings.length > 0,
    daily_liters_sum: dailyTotalLiters,
    daily_amount_sum: dailyTotalAmount,
    summary_total_liters: summaryTotalLiters,
    summary_total_income: summaryTotalIncome,
    summary_net_payable: netPayable,
    row_issues: rowIssues
  };
}

function chooseSettlementSummaryIncome(candidates, expectedFromNet) {
  const uniqueCandidates = Array.from(
    new Set(candidates.filter((value) => hasNumber(value)).map((value) => Number(value)))
  );

  if (!uniqueCandidates.length) {
    return null;
  }

  if (hasNumber(expectedFromNet)) {
    return uniqueCandidates
      .slice()
      .sort(
        (first, second) =>
          Math.abs(first - Number(expectedFromNet)) - Math.abs(second - Number(expectedFromNet))
      )[0];
  }

  return uniqueCandidates[0];
}

function normalizeSettlementFields(data) {
  const sessionEntries = normalizeSettlementSessionEntries(data);
  const dailyEntries = combineSettlementDailyEntries(sessionEntries);
  const dailyTotalLiters =
    parseNumber(data.daily_total_liters) ??
    parseNumber(data.session_total_liters) ??
    (dailyEntries.length
      ? roundMoney(dailyEntries.reduce((sum, entry) => sum + Number(entry.total_liters ?? entry.liters ?? 0), 0))
      : null);
  const dailyTotalAmount =
    parseNumber(data.daily_total_amount) ??
    parseNumber(data.session_total_amount) ??
    (dailyEntries.length
      ? roundMoney(dailyEntries.reduce((sum, entry) => sum + Number(entry.total_amount ?? entry.amount ?? 0), 0))
      : null);
  const deductions = normalizeSettlementDeductions(data);
  const extractedTotalIncome = parseNumber(
    data.total_milk_income ??
      data.total_income ??
      data.ekun_utpanna
  );
  const summaryAmount = parseNumber(
    data.total_amount_section2 ??
      data.summary_total_amount ??
      data.ekun_rakkam
  );
  const netPayable = parseNumber(data.net_payable ?? data.final_payable ?? data.nivval_rakkam);
  const summaryTotalLiters =
    parseNumber(data.total_liters) ??
    parseNumber(data.total_liters_section2) ??
    parseNumber(data.summary_total_liters) ??
    parseNumber(data.ekun_liter) ??
    parseNumber(data.ekun_litre);
  const summaryTotalIncome = chooseSettlementSummaryIncome(
    [extractedTotalIncome, summaryAmount],
    hasNumber(netPayable) && hasNumber(deductions.total_deductions)
      ? roundMoney(Number(netPayable) + Number(deductions.total_deductions))
      : null
  );
  const totalIncome = summaryTotalIncome ?? dailyTotalAmount;
  const initialTotalLiters = summaryTotalLiters ?? dailyTotalLiters;
  const validation = validateSettlementExtraction({
    sessionEntries,
    dailyEntries,
    dailyTotalLiters,
    dailyTotalAmount,
    summaryTotalLiters,
    summaryTotalIncome: totalIncome,
    deductions,
    netPayable,
    confidence: data.confidence_score
  });
  const validationNotes = [...validation.errors, ...validation.warnings].join(" ");
  const confidenceScore = normalizeConfidence(data.confidence_score);
  const adjustedConfidence = validation.errors.length
    ? Math.min(confidenceScore, 0.55)
    : validation.warnings.length
      ? Math.min(confidenceScore, 0.85)
      : confidenceScore;
  const notes = validationNotes ? mergeNotes(data.notes, validationNotes) : data.notes;
  const totalLiters =
    summaryTotalLiters !== null
      ? summaryTotalLiters
      : validation.errors.length
        ? null
        : initialTotalLiters;

  return {
    ...data,
    notes,
    confidence_score: adjustedConfidence,
    settlement_validation: validation,
    ocr_requires_manual_review: validation.requires_manual_review,
    farmer_name: data.farmer_name || data.member_name || data.customer_name || null,
    farmer_code: data.farmer_code || data.dairy_member_code || data.member_number || null,
    animal_type: data.animal_type || data.milk_type || null,
    settlement_date: normalizeDate(data.settlement_date),
    period_start: normalizeDate(data.period_start),
    period_end: normalizeDate(data.period_end),
    session_entries: sessionEntries,
    daily_entries: dailyEntries,
    daily_total_liters: dailyTotalLiters,
    daily_total_amount: dailyTotalAmount,
    bank_account_no: data.bank_account_no || data.bank_account || null,
    bank_name: data.bank_name || null,
    account_no: data.account_no || null,
    avg_rate: parseNumber(data.avg_rate ?? data.average_rate),
    total_liters_section2: parseNumber(data.total_liters_section2),
    total_amount_section2: parseNumber(data.total_amount_section2),
    total_liters: totalLiters,
    total_milk_income: totalIncome,
    cattle_feed_deduction: deductions.feed_deduction ?? 0,
    anamat_cut: deductions.anamat_cut ?? 0,
    other_deductions: deductions.other_deductions ?? 0,
    total_deductions: deductions.total_deductions,
    deductions,
    total_deductions_before_anamat: roundMoney(
      Number(deductions.feed_deduction || 0) + Number(deductions.other_deductions || 0)
    ),
    balance_before_round: parseNumber(data.balance_before_round ?? data.balance),
    round_adjustment: parseNumber(data.round_adjustment),
    net_payable:
      netPayable ??
      (totalIncome !== null && deductions.total_deductions !== null
        ? roundMoney(totalIncome - deductions.total_deductions)
        : null)
  };
}

function normalizeExtraction(data) {
  const slipType = normalizeSlipType(data?.slip_type);

  if (!slipType) {
    throw new Error("AI ला स्लिपचा प्रकार ओळखता आला नाही.");
  }

  if (slipType === "settlement") {
    const settlementData = normalizeSettlementFields({
      ...data,
      slip_type: slipType,
      confidence_score: normalizeConfidence(data.confidence_score),
      missing_fields: normalizeMissingFields(data.missing_fields)
    });

    return {
      ...settlementData,
      member_number:
        settlementData.member_number ||
        settlementData.farmer_code ||
        settlementData.dairy_member_code ||
        null,
      dairy_member_code:
        settlementData.dairy_member_code ||
        settlementData.farmer_code ||
        settlementData.member_number ||
        null
    };
  }

  const dairyMemberCode =
    data.dairy_member_code ??
    data.code_no ??
    data.CODE_NO ??
    data.member_number ??
    data.dairy_member_number ??
    null;
  const clrScore = parseNumber(data.clr_score ?? data.clr_degree ?? data.clr ?? data.CLR);
  const liters = parseNumber(data.liters ?? data.litre ?? data.LITRE);
  const ratePerLiter = parseNumber(data.rate_per_liter ?? data.rate ?? data.RATE);
  const printedAmount = parseNumber(
    data.slip_printed_amount ??
      data.printed_total_amount ??
      data.ocr_total_amount ??
      data.total_amount ??
      data.amount ??
      data.AMOUNT
  );
  const amountVerification = buildAmountVerification(liters, ratePerLiter, printedAmount);
  const normalizedData = {
    ...data,
    slip_type: slipType,
    slip_date: normalizeDate(data.slip_date || data.date),
    settlement_date: normalizeDate(data.settlement_date),
    period_start: normalizeDate(data.period_start),
    period_end: normalizeDate(data.period_end),
    slip_time: normalizeTime(data.slip_time || data.time),
    session: normalizeSession(data.session || data.shift),
    milk_type: normalizeMilkType(data.milk_type),
    dairy_member_code: dairyMemberCode === null || dairyMemberCode === undefined ? null : String(dairyMemberCode).trim(),
    member_number:
      data.member_number === null || data.member_number === undefined
        ? dairyMemberCode === null || dairyMemberCode === undefined
          ? null
          : String(dairyMemberCode).trim()
        : String(data.member_number).trim(),
    liters,
    fat_percentage: parseNumber(data.fat_percentage ?? data.fat ?? data.FAT),
    snf_percentage: parseNumber(data.snf_percentage ?? data.snf ?? data.SNF),
    clr_score: clrScore,
    clr_degree: clrScore,
    rate_per_liter: ratePerLiter,
    slip_printed_amount: printedAmount,
    calculated_total_amount: amountVerification.calculated_amount,
    total_amount: amountVerification.calculated_amount ?? printedAmount,
    amount_difference: amountVerification.difference,
    amount_matches: amountVerification.status === "matched",
    amount_verification: amountVerification,
    confidence_score: normalizeConfidence(data.confidence_score),
    missing_fields: normalizeMissingFields(data.missing_fields)
  };

  if (normalizedData.slip_type === "daily" && amountVerification.status === "mismatch") {
    normalizedData.notes = mergeNotes(
      normalizedData.notes,
      `[Warning: Amount mismatch. Calculated: ${amountVerification.calculated_amount.toFixed(2)}, Printed: ${printedAmount}]`
    );
  }

  return normalizedData;
}

function normalizeModelPrice(model) {
  return MODEL_PRICE_PER_MILLION[model] || MODEL_PRICE_PER_MILLION[DEFAULT_SLIP_OCR_MODEL] || MODEL_PRICE_PER_MILLION["gpt-4o-mini"];
}

export function calculateApproximateCost(usageOrTokens, model) {
  const price = normalizeModelPrice(model);

  if (!usageOrTokens) {
    return 0;
  }

  if (typeof usageOrTokens === "number") {
    return (usageOrTokens / 1000000) * price.input;
  }

  const inputTokens = Number(usageOrTokens.prompt_tokens || usageOrTokens.input_tokens || 0);
  const outputTokens = Number(usageOrTokens.completion_tokens || usageOrTokens.output_tokens || 0);

  return (inputTokens / 1000000) * price.input + (outputTokens / 1000000) * price.output;
}

function missingImportantFields(data) {
  const criticalFields =
    data?.slip_type === "settlement"
      ? ["period_start", "period_end", "total_milk_income", "net_payable", "total_liters"]
      : ["slip_date", "session", "liters", "rate_per_liter", "total_amount"];
  const missing = normalizeMissingFields(data?.missing_fields).map((field) => field.toLowerCase());

  const missingFields = criticalFields.filter((field) => {
    if (data?.[field] === null || data?.[field] === undefined || data?.[field] === "") {
      return true;
    }

    return missing.some((missingField) => missingField.includes(field.toLowerCase()));
  });

  if (data?.slip_type === "settlement") {
    const dailyCount = Array.isArray(data.daily_entries) ? data.daily_entries.length : 0;
    const sessionCount = Array.isArray(data.session_entries) ? data.session_entries.length : 0;
    const validation = data.settlement_validation || {};
    if (dailyCount < 10 && sessionCount < 20) {
      missingFields.push("daily_entries");
    }
    if (data.ocr_requires_manual_review || validation.errors?.length || validation.warnings?.length) {
      missingFields.push("settlement_manual_review");
    }
  }

  return missingFields;
}

function combineAttemptCost(...attempts) {
  return attempts.reduce((sum, attempt) => sum + Number(attempt?.cost_estimate || 0), 0);
}

function combineAttemptTokens(...attempts) {
  return attempts.reduce((sum, attempt) => sum + Number(attempt?.tokensUsed || 0), 0);
}

function attemptQualityScore(attempt) {
  if (!attempt?.success || !attempt.data) {
    return -1;
  }

  const validation = attempt.data.settlement_validation || {};
  const errorPenalty = Array.isArray(validation.errors) ? validation.errors.length * 0.25 : 0;
  const warningPenalty = Array.isArray(validation.warnings) ? validation.warnings.length * 0.08 : 0;
  return Number(attempt.confidence_score || 0) - errorPenalty - warningPenalty;
}

export async function extractFromDairySlipWithGPT(imageBase64, model = DEFAULT_SLIP_OCR_MODEL) {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model,
      max_tokens: OCR_MAX_TOKENS,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/webp;base64,${imageBase64}`,
                detail: "high"
              }
            },
            {
              type: "text",
              text:
                "Extract data from this Indian dairy slip. If it is a daily thermal printer slip, convert DD/MM/YYYY to YYYY-MM-DD, convert SHIFT to Marathi session, include slip_time, milk_type, dairy_member_code, numeric clr_score, and slip_printed_amount exactly as the printed AMOUNT value. If it is a 15-day Marathi settlement slip, it will usually have separate सकाळ and संध्याकाळ tables: extract every visible row from both tables into session_entries only; do not duplicate the same rows in daily_entries. Extract bottom-right settlement totals only from labels सरासरी भाव, एकूण लिटर, एकूण रक्कम/एकूण उत्पन्न, एकूण कपात, शिल्लक रक्कम, राऊंड रक्कम, निव्वळ रक्कम. These bottom totals are authoritative: if row sums conflict, still return the bottom totals exactly and add warning in notes. Reject row OCR values like 999/1999 liters when neighboring rows are 50-200. Extract खाद्य/पशुखाद्य कपात as feed_deduction and अनामत/भरती अनामत as anamat_cut. Keep anamat separate from other deductions. Never invent unreadable financial numbers. Calculate total_amount only from LITRE x RATE when both are readable. Ignore serial/barcode numbers. Return ONLY compact valid JSON. Use null for unclear financial values."
            }
          ]
        }
      ]
    });
    const choice = response.choices?.[0] || {};
    if (choice.finish_reason === "length") {
      throw new Error("AI response अपूर्ण राहिला. 15 दिवसांच्या slip साठी output मोठा झाला.");
    }

    const responseText = choice.message?.content || "";
    const extractedData = normalizeExtraction(parseJsonResponse(responseText));
    const tokensUsed = Number(response.usage?.total_tokens || 0);
    const costEstimate = calculateApproximateCost(response.usage, model);

    return {
      data: extractedData,
      confidence_score: extractedData.confidence_score,
      model_used: model,
      tokensUsed,
      usage: response.usage || null,
      cost_estimate: costEstimate,
      success: true
    };
  } catch (error) {
    return {
      data: null,
      confidence_score: 0,
      model_used: model,
      error: error?.message || "GPT OCR extraction failed.",
      tokensUsed: 0,
      cost_estimate: 0,
      success: false
    };
  }
}

export async function extractWithGPTHybrid(imageBase64) {
  const firstAttempt = await extractFromDairySlipWithGPT(imageBase64, DEFAULT_SLIP_OCR_MODEL);

  if (!firstAttempt.success) {
    if (FALLBACK_SLIP_OCR_MODEL && FALLBACK_SLIP_OCR_MODEL !== firstAttempt.model_used) {
      const fallbackAttempt = await extractFromDairySlipWithGPT(imageBase64, FALLBACK_SLIP_OCR_MODEL);
      const totalTokens = combineAttemptTokens(firstAttempt, fallbackAttempt);
      const totalCost = combineAttemptCost(firstAttempt, fallbackAttempt);

      if (fallbackAttempt.success) {
        return {
          ...fallbackAttempt,
          retried: true,
          original_confidence: firstAttempt.confidence_score,
          primary_model_used: firstAttempt.model_used,
          fallback_model_used: fallbackAttempt.model_used,
          primary_error: firstAttempt.error || null,
          tokensUsed: totalTokens,
          cost_estimate: totalCost,
          reason: "Primary extraction failed, fallback result used"
        };
      }

      return {
        ...fallbackAttempt,
        retried: true,
        original_confidence: firstAttempt.confidence_score,
        primary_model_used: firstAttempt.model_used,
        fallback_model_used: fallbackAttempt.model_used,
        primary_error: firstAttempt.error || null,
        fallback_error: fallbackAttempt.error || null,
        tokensUsed: totalTokens,
        cost_estimate: totalCost,
        reason: "Primary and fallback extraction failed"
      };
    }

    return {
      ...firstAttempt,
      retried: false,
      reason: "Initial extraction failed"
    };
  }

  const importantMissing = missingImportantFields(firstAttempt.data);
  const shouldRetry = firstAttempt.confidence_score < 0.8 || importantMissing.length > 0;

  if (!shouldRetry) {
    return {
      ...firstAttempt,
      retried: false,
      reason: "Good confidence score on first attempt"
    };
  }

  const secondAttempt = await extractFromDairySlipWithGPT(imageBase64, FALLBACK_SLIP_OCR_MODEL);
  const totalTokens = combineAttemptTokens(firstAttempt, secondAttempt);
  const totalCost = combineAttemptCost(firstAttempt, secondAttempt);

  if (secondAttempt.success && attemptQualityScore(secondAttempt) > attemptQualityScore(firstAttempt)) {
    return {
      ...secondAttempt,
      retried: true,
      original_confidence: firstAttempt.confidence_score,
      primary_model_used: firstAttempt.model_used,
      fallback_model_used: secondAttempt.model_used,
      tokensUsed: totalTokens,
      cost_estimate: totalCost,
      reason: "Low confidence or missing critical fields, fallback result used"
    };
  }

  return {
    ...firstAttempt,
    retried: true,
    original_confidence: firstAttempt.confidence_score,
    primary_model_used: firstAttempt.model_used,
    fallback_model_used: secondAttempt.model_used,
    fallback_error: secondAttempt.error || null,
    tokensUsed: totalTokens,
    cost_estimate: totalCost,
    reason: "Fallback checked, primary result retained"
  };
}

export const extractWithGPTFallback = extractWithGPTHybrid;
export const extractFromDairySlip = extractFromDairySlipWithGPT;
export const extractWithFallback = extractWithGPTHybrid;
