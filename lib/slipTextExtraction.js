import OpenAI from "openai";
import { validateSlip } from "@/lib/slipValidation";

const MODEL = process.env.OPENAI_MODEL_PRIMARY || process.env.OPENAI_OCR_TEXT_MODEL || "gpt-4o-mini";
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL_FALLBACK || MODEL;
const DEFAULT_MAX_TOKENS = Number(process.env.OPENAI_OCR_MAX_TOKENS || 6000);
const RETRY_MAX_TOKENS = Number(process.env.OPENAI_OCR_RETRY_MAX_TOKENS || 9000);

const SYSTEM_PROMPT = `You are a financial OCR structuring system for Marathi dairy farm slips.

Input is OCR text from Google Vision, not an image.

Return ONLY valid compact JSON. No markdown. No explanation.

Critical rules:
1. Never guess unreadable financial numbers.
2. Use null for missing fields.
3. Estimate a field ONLY when mathematically derivable from visible values.
4. Every estimated field must be listed in estimated_fields with value, reason, and formula.
5. Summary box totals on 15-day settlement slips are always higher priority than daily rows.
6. Do not copy one row across many dates.
7. If OCR text contains conflicting daily rows and summary totals, keep summary totals and add warning.
8. Confidence must be 0-100.
9. In this dairy workflow, "एकूण कपात" on the settlement slip means cattle feed deduction. If a slip shows only "एकूण कपात", set feed_deduction to that amount and set other_deduction to 0 unless a separate "इतर कपात" value is clearly visible.
10. For 15-day settlement slips, read BOTH side-by-side columns: सकाळ and संध्याकाळ. Keep them as separate rows.
11. If a value/cell is torn, folded, hidden, faded, or not visible, write null for that exact field. Do not fill it from averages, totals, neighboring rows, or the other session.
12. Never duplicate सकाळ values into संध्याकाळ or संध्याकाळ values into सकाळ.

For DAILY MILK SLIPS return:
{
  "type":"daily_slip",
  "dairy_name": null,
  "member_number": null,
  "dairy_member_code": null,
  "date": "YYYY-MM-DD or null",
  "slip_time": "HH:MM:SS or null",
  "session": "सकाळ or संध्याकाळ or null",
  "milk_type": "cow or buffalo or null",
  "liters": null,
  "fat": null,
  "snf": null,
  "clr": null,
  "rate_per_liter": null,
  "total_amount": null,
  "confidence": 0,
  "missing_fields": [],
  "estimated_fields": {},
  "warnings": []
}

For 15-DAY SETTLEMENT SLIPS return:
{
  "type":"settlement",
  "dairy_name": null,
  "member_number": null,
  "period_start": "YYYY-MM-DD or null",
  "period_end": "YYYY-MM-DD or null",
  "average_rate": null,
  "total_liters": null,
  "total_income": null,
  "feed_deduction": null,
  "other_deduction": null,
  "total_deductions": null,
  "net_amount": null,
  "daily_rows": [],
  "confidence": 0,
  "missing_fields": [],
  "estimated_fields": {},
  "warnings": []
}

Settlement daily rows must include visible सकाळ and संध्याकाळ rows separately:
{
  "date":"YYYY-MM-DD",
  "session":"सकाळ or संध्य्याकाळ",
  "liters":null,
  "fat":null,
  "snf":null,
  "rate_per_liter":null,
  "amount":null
}

Daily row rules:
- For each visible date, return one row for सकाळ and one row for संध्याकाळ when those columns/rows exist.
- If a row/date is visible but some numeric cells are torn or unreadable, keep the date/session and set only those unreadable cells to null.
- If a whole session value is not present for a date, include that session row with null numeric fields only when the date and session position are identifiable.
- If the date itself is not identifiable, do not invent the date.
- Do not estimate or reconstruct daily row values from totals.

Marathi label mapping:
- DATE = date, TIME = slip_time, SHIFT = session
- MILK TYPE COW = milk_type cow, BUFFALO = milk_type buffalo
- CODE NO = dairy_member_code and member_number
- LITRE/LITER = liters
- एकूण लिटर = total_liters
- एकूण रक्कम / एकूण उत्पन्न = total_income
- खाद्य कपात / पशुखाद्य / कपात रु = feed_deduction
- इतर कपात = other_deduction
- एकूण कपात = feed_deduction and total_deductions
- निव्वळ रक्कम / निर्बळ रक्कम = net_amount`;

const VISION_SYSTEM_PROMPT = `${SYSTEM_PROMPT.replace(
  "Input is OCR text from Google Vision, not an image.",
  "Input is the original dairy slip image. Read values directly from the image."
)}

Direct image fallback rules:
1. Google Vision OCR may have failed or mixed columns. Re-read the image yourself.
2. Pay special attention to label/value alignment. CODE NO is never liters.
3. If LITRE, RATE, and AMOUNT are visible, verify LITRE × RATE = AMOUNT.
4. If values are not visible, use null. Do not invent numbers.
5. Return the same JSON shapes only.`;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY सेट केलेली नाही.");
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

class GptJsonParseError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "GptJsonParseError";
    this.details = details;
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) {
      throw new GptJsonParseError("GPT response मध्ये JSON सापडले नाही.", {
        originalError: error.message,
        responseLength: String(text || "").length
      });
    }

    try {
      return JSON.parse(match[0]);
    } catch (jsonError) {
      throw new GptJsonParseError("GPT response मधील JSON अपूर्ण किंवा चुकीचे आहे.", {
        originalError: jsonError.message,
        responseLength: String(text || "").length
      });
    }
  }
}

function getUserPrompt(rawText, retry = false) {
  const retryInstruction = retry
    ? `\n\nPrevious answer was invalid or truncated. Return ONE COMPLETE valid JSON object only. Close every array and object. Do not include markdown. Keep daily_rows compact but complete.`
    : "";

  return `Google Vision OCR text:\n\n${rawText}\n\nReturn JSON only.${retryInstruction}`;
}

async function requestStructuredJson(client, rawText, { maxTokens, retry = false } = {}) {
  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: getUserPrompt(rawText, retry)
      }
    ]
  });

  return {
    response,
    content: response.choices?.[0]?.message?.content || "{}",
    finishReason: response.choices?.[0]?.finish_reason || null
  };
}

function cleanBase64(value = "") {
  return String(value || "").replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();
}

function getVisionPrompt(fallbackReason = "", retry = false) {
  const retryInstruction = retry
    ? "\nPrevious answer was invalid or truncated. Return ONE COMPLETE valid JSON object only."
    : "";
  const reasonText = fallbackReason
    ? `\nFallback reason: ${fallbackReason}`
    : "";

  return `Read this dairy slip image directly and return JSON only.${reasonText}

Important:
- Financial values must be exact.
- Do not put CODE NO into liters.
- If math does not match, re-check the visible value before returning.
- If still unreadable, set null and add missing_fields.
${retryInstruction}`;
}

async function requestVisionStructuredJson(
  client,
  imageBase64,
  { mediaType = "image/webp", maxTokens, retry = false, fallbackReason = "" } = {}
) {
  const content = cleanBase64(imageBase64);

  if (!content) {
    throw new Error("Direct GPT Vision साठी फोटो डेटा मिळाला नाही.");
  }

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    temperature: 0,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${content}`,
              detail: "high"
            }
          },
          {
            type: "text",
            text: getVisionPrompt(fallbackReason, retry)
          }
        ]
      }
    ]
  });

  return {
    response,
    content: response.choices?.[0]?.message?.content || "{}",
    finishReason: response.choices?.[0]?.finish_reason || null
  };
}

function normalizeNumerals(value) {
  const devanagariDigits = "०१२३४५६७८९";
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";

  return String(value ?? "")
    .replace(/[०-९]/g, (digit) => String(devanagariDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)));
}

function readValue(value) {
  if (value && typeof value === "object" && "value" in value) {
    return value.value;
  }
  return value;
}

function parseNumber(value) {
  const raw = readValue(value);
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const number = Number(normalizeNumerals(raw).replace(/[,₹\s]/g, "").replace(/[Oo]/g, "0"));
  return Number.isFinite(number) ? number : null;
}

function normalizeConfidence(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) {
    return 0.5;
  }
  return number > 1 ? Math.max(0, Math.min(1, number / 100)) : Math.max(0, Math.min(1, number));
}

function normalizeDate(value) {
  const text = normalizeNumerals(readValue(value) || "").trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) return text;
  const [, day, month, yearValue] = match;
  const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeSession(value) {
  const text = String(readValue(value) || "").trim();
  const upper = text.toUpperCase();
  if (upper.includes("MORNING") || text.includes("सकाळ")) return "सकाळ";
  if (upper.includes("EVENING") || text.includes("संध्याकाळ") || text.includes("सायंकाळ")) return "संध्याकाळ";
  return text || null;
}

function normalizeMilkType(value) {
  const text = String(readValue(value) || "").trim().toLowerCase();
  const upper = text.toUpperCase();

  if (upper.includes("BUFFALO") || text.includes("म्हैस")) {
    return "buffalo";
  }

  if (upper.includes("COW") || text.includes("गाय")) {
    return "cow";
  }

  return text || null;
}

function normalizeTime(value) {
  const text = normalizeNumerals(readValue(value) || "").trim();
  const match = text.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);

  if (!match) {
    return null;
  }

  const [, hour, minute, second = "00"] = match;
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
}

function thermalTextValue(text, pattern) {
  const match = text.match(pattern);
  return match?.[1]?.trim() || null;
}

function thermalNumber(text, pattern) {
  return parseNumber(thermalTextValue(text, pattern));
}

function cleanThermalLines(rawText = "") {
  return normalizeNumerals(rawText)
    .replace(/\r/g, "\n")
    .replace(/[：]/g, ":")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^-{4,}$/.test(line.replace(/\s/g, "")))
    .filter((line) => !/^(?:[6890]\s*){8,}$/.test(line.replace(/\s/g, "")));
}

function collectThermalTokens(lines = []) {
  return lines
    .flatMap((line) => line.split(/\s+/))
    .map((token) => token.trim())
    .filter(Boolean);
}

function isDateToken(token) {
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(token);
}

function isTimeToken(token) {
  return /^\d{1,2}:\d{1,2}(?::\d{1,2})?$/.test(token);
}

function isNumericToken(token) {
  return /^\d+(?:\.\d+)?$/.test(token);
}

function findValueAfterLabel(lines, labelPattern, valuePattern, maxLookahead = 6) {
  const tokens = collectThermalTokens(lines);
  const labelIndex = tokens.findIndex((token, index) => labelPattern(tokens, index, tokens));

  if (labelIndex === -1) {
    return null;
  }

  for (let index = labelIndex + 1; index < Math.min(tokens.length, labelIndex + maxLookahead + 1); index += 1) {
    if (valuePattern(tokens[index], index, tokens)) {
      return tokens[index];
    }
  }

  return null;
}

function findBlockValues(lines, labelSequence, valuePattern, afterLabel) {
  const upperLines = lines.map((line) => line.toUpperCase().replace(/_/g, " "));
  const labelIndexes = [];
  let searchFrom = 0;

  for (const label of labelSequence) {
    const foundIndex = upperLines.findIndex((line, index) => index >= searchFrom && line.includes(label));

    if (foundIndex === -1) {
      return null;
    }

    labelIndexes.push(foundIndex);
    searchFrom = foundIndex + 1;
  }

  const values = [];

  for (let index = labelIndexes[labelIndexes.length - 1] + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const upper = upperLines[index];

    if (afterLabel && !afterLabel(upper, line)) {
      continue;
    }

    const lineValues = line
      .split(/\s+/)
      .map((token) => token.replace(/[,₹]/g, ""))
      .filter(valuePattern);

    values.push(...lineValues);

    if (values.length >= labelSequence.length) {
      break;
    }
  }

  return values.length >= labelSequence.length
    ? Object.fromEntries(labelSequence.map((label, index) => [label, values[index]]))
    : null;
}

function getThermalHeaderValues(lines) {
  const blockValues = findBlockValues(
    lines,
    ["DATE", "TIME", "SHIFT", "MILK TYPE", "CODE NO"],
    (token) => isDateToken(token) || isTimeToken(token) || /^(?:MORNING|EVENING|COW|BUFFALO|\d+)$/.test(token),
    null
  );

  return {
    date: blockValues?.DATE || findValueAfterLabel(lines, (token) => token.toUpperCase() === "DATE", isDateToken),
    time: blockValues?.TIME || findValueAfterLabel(lines, (token) => token.toUpperCase() === "TIME", isTimeToken),
    shift:
      blockValues?.SHIFT ||
      findValueAfterLabel(lines, (token) => token.toUpperCase() === "SHIFT", (token) =>
        /^(?:MORNING|EVENING|सकाळ|संध्याकाळ|सायंकाळ)$/i.test(token)
      ),
    milkType:
      blockValues?.["MILK TYPE"] ||
      findValueAfterLabel(
        lines,
        (token, index, tokens) => token.toUpperCase() === "MILK" && tokens[index + 1]?.toUpperCase() === "TYPE",
        (token) => /^(?:COW|BUFFALO|गाय|म्हैस)$/i.test(token),
        8
      ),
    codeNo:
      blockValues?.["CODE NO"] ||
      findValueAfterLabel(
        lines,
        (token, index, tokens) => token.toUpperCase() === "CODE" && tokens[index + 1]?.toUpperCase() === "NO",
        (token) => /^[A-Z0-9-]+$/i.test(token) && !["LITRE", "LITER", "FAT", "CLR", "SNF", "RATE", "AMOUNT"].includes(token.toUpperCase()),
        8
      )
  };
}

function getThermalMilkValues(lines) {
  const blockValues = findBlockValues(
    lines,
    ["LITRE", "FAT", "CLR", "SNF", "RATE", "AMOUNT"],
    isNumericToken,
    null
  );

  return {
    liters: parseNumber(blockValues?.LITRE) ?? thermalNumber(lines.join(" "), /\b(?:LITRE|LITER)\b\s*:?\s*(\d+(?:\.\d+)?)/i),
    fat: parseNumber(blockValues?.FAT) ?? thermalNumber(lines.join(" "), /\bFAT\s*:?\s*(\d+(?:\.\d+)?)/i),
    clr: parseNumber(blockValues?.CLR) ?? thermalNumber(lines.join(" "), /\bCLR\s*:?\s*(\d+(?:\.\d+)?)/i),
    snf: parseNumber(blockValues?.SNF) ?? thermalNumber(lines.join(" "), /\bSNF\s*:?\s*(\d+(?:\.\d+)?)/i),
    rate: parseNumber(blockValues?.RATE) ?? thermalNumber(lines.join(" "), /\bRATE\s*:?\s*(\d+(?:\.\d+)?)/i),
    amount: parseNumber(blockValues?.AMOUNT) ?? thermalNumber(lines.join(" "), /\bAMOUNT\s*:?\s*(\d+(?:\.\d+)?)/i)
  };
}

function fixThermalLiters(liters, rate, amount) {
  if (liters !== null && rate !== null && amount !== null) {
    const calculated = roundMoney(liters * rate);

    if (Math.abs(calculated - amount) <= 0.05) {
      return { value: liters, estimated: false };
    }

    const derivedLiters = amount / rate;

    if (Number.isFinite(derivedLiters) && derivedLiters > 0 && derivedLiters < 1000) {
      return {
        value: roundMoney(derivedLiters),
        estimated: true,
        reason: `LITRE OCR चुकीचा वाटला. AMOUNT ÷ RATE = ${amount} ÷ ${rate}`
      };
    }
  }

  return { value: liters, estimated: false };
}

function extractThermalDailySlipFromText(rawText = "") {
  const lines = cleanThermalLines(rawText);
  const text = lines.join("\n");
  const compact = text.replace(/\s+/g, " ").trim();

  if (!/\b(?:LITRE|LITER)\b/i.test(compact) || !/\bSHIFT\b/i.test(compact)) {
    return null;
  }

  const headerValues = getThermalHeaderValues(lines);
  const milkValues = getThermalMilkValues(lines);
  const slipDate = normalizeDate(headerValues.date);
  const slipTime = normalizeTime(headerValues.time);
  const session = normalizeSession(headerValues.shift);
  const milkType = normalizeMilkType(headerValues.milkType);
  const memberCode = headerValues.codeNo;
  const fixedLiters = fixThermalLiters(milkValues.liters, milkValues.rate, milkValues.amount);
  const liters = fixedLiters.value;
  const fat = milkValues.fat;
  const clr = milkValues.clr;
  const snf = milkValues.snf;
  const rate = milkValues.rate;
  const amount = milkValues.amount;
  const missing = [];

  [
    ["date", slipDate],
    ["session", session],
    ["liters", liters],
    ["rate_per_liter", rate],
    ["total_amount", amount]
  ].forEach(([field, value]) => {
    if (value === null || value === undefined || value === "") {
      missing.push(field);
    }
  });

  const amountMatched =
    liters !== null && rate !== null && amount !== null
      ? Math.abs(roundMoney(liters * rate) - amount) <= 0.05
      : false;
  const visibleCount = [
    slipDate,
    slipTime,
    session,
    milkType,
    memberCode,
    liters,
    fat,
    clr,
    snf,
    rate,
    amount
  ].filter((value) => value !== null && value !== undefined && value !== "").length;

  if (visibleCount < 6 || missing.length >= 3) {
    return null;
  }

  const confidence = missing.length === 0 && amountMatched
    ? 98
    : missing.length <= 1 && amountMatched
      ? 92
      : 84;
  const warnings = [];
  const estimatedFields = {};

  if (liters !== null && rate !== null && amount !== null && !amountMatched) {
    warnings.push(`लिटर × दर = ₹${roundMoney(liters * rate)}, पण स्लिपवर ₹${amount} दिसते.`);
  }

  if (fixedLiters.estimated) {
    estimatedFields.liters = {
      value: liters,
      estimated: true,
      reason: fixedLiters.reason,
      formula: "AMOUNT ÷ RATE"
    };
    warnings.push("LITRE field OCR मध्ये चुकीचा दिसला, म्हणून AMOUNT ÷ RATE वरून दूध लिटर तपासले.");
  }

  return {
    type: "daily_slip",
    dairy_name: null,
    member_number: memberCode,
    dairy_member_code: memberCode,
    date: slipDate,
    slip_time: slipTime,
    session,
    milk_type: milkType || "cow",
    liters,
    fat,
    snf,
    clr,
    rate_per_liter: rate,
    total_amount: amount,
    confidence,
    missing_fields: missing,
    estimated_fields: estimatedFields,
    warnings
  };
}

function normalizeMissing(fields) {
  return Array.isArray(fields) ? fields.map((field) => String(field || "").trim()).filter(Boolean) : [];
}

function normalizeEstimatedFields(source = {}) {
  const fields = {};

  Object.entries(source.estimated_fields || {}).forEach(([field, details]) => {
    fields[field] = {
      value: details?.value ?? null,
      estimated: true,
      reason: details?.reason || details?.formula || "AI ने उपलब्ध आकड्यांवरून गणना केली.",
      formula: details?.formula || null
    };
  });

  return fields;
}

function normalizeDailyRows(rows = []) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => ({
      date: normalizeDate(row.date),
      session: normalizeSession(row.session),
      liters: parseNumber(row.liters),
      fat_percent: parseNumber(row.fat ?? row.fat_percent),
      snf_percent: parseNumber(row.snf ?? row.snf_percent),
      rate_per_liter: parseNumber(row.rate_per_liter ?? row.rate),
      amount: parseNumber(row.amount ?? row.total_amount)
    }))
    .filter((row) => row.date || row.liters !== null || row.amount !== null);
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function combineDailyEntries(sessionEntries = []) {
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
        amount: totalAmount,
        total_amount: totalAmount,
        rate_per_liter: totalLiters > 0 ? roundMoney(totalAmount / totalLiters) : null
      };
    })
    .sort((first, second) => String(first.date || "").localeCompare(String(second.date || "")));
}

function normalizeStructuredSlip(aiJson, ocr = {}) {
  const type = aiJson.type || aiJson.slip_type;
  const confidence = normalizeConfidence(aiJson.confidence ?? aiJson.confidence_score);
  const estimatedFields = normalizeEstimatedFields(aiJson);
  const validation = validateSlip(aiJson);
  const common = {
    ocr_provider: ocr.provider || "google_vision",
    ocr_confidence: ocr.confidence || 0,
    ocr_text: ocr.rawText || "",
    raw_ai_json: aiJson,
    confidence_score: Math.min(confidence, validation.confidence || confidence),
    missing_fields: normalizeMissing(aiJson.missing_fields),
    inferred_fields: estimatedFields,
    gaps_filled: Object.entries(estimatedFields).map(([field, details]) => ({
      field,
      filled_value: details.value,
      method: "calculated",
      confidence: 0.9,
      formula: details.formula,
      note: details.reason
    })),
    ai_warnings: [...(Array.isArray(aiJson.warnings) ? aiJson.warnings : []), ...validation.warnings],
    validation
  };

  if (type === "daily_slip" || type === "daily") {
    const liters = parseNumber(aiJson.liters);
    const rate = parseNumber(aiJson.rate_per_liter);
    const amount = parseNumber(aiJson.total_amount);
    const dairyMemberCode = readValue(aiJson.dairy_member_code ?? aiJson.code_no ?? aiJson.member_number);

    return {
      ...common,
      slip_type: "daily",
      dairy_name: readValue(aiJson.dairy_name) || null,
      member_number: readValue(aiJson.member_number ?? dairyMemberCode) || null,
      dairy_member_code: dairyMemberCode || null,
      slip_date: normalizeDate(aiJson.date ?? aiJson.slip_date),
      slip_time: normalizeTime(aiJson.slip_time ?? aiJson.time),
      session: normalizeSession(aiJson.session),
      milk_type: normalizeMilkType(aiJson.milk_type) || "cow",
      liters,
      fat_percentage: parseNumber(aiJson.fat),
      snf_percentage: parseNumber(aiJson.snf),
      clr_score: parseNumber(aiJson.clr),
      clr_degree: parseNumber(aiJson.clr),
      rate_per_liter: rate,
      slip_printed_amount: amount,
      total_amount: amount,
      ocr_requires_manual_review: validation.requires_review
    };
  }

  const sessionEntries = normalizeDailyRows(aiJson.daily_rows);
  const dailyEntries = combineDailyEntries(sessionEntries);
  const rawFeedDeduction = parseNumber(aiJson.feed_deduction);
  const rawOtherDeduction = parseNumber(aiJson.other_deduction);
  const explicitTotalDeductions = parseNumber(aiJson.total_deductions);
  const feedDeduction = rawFeedDeduction ?? explicitTotalDeductions;
  const otherDeduction = rawOtherDeduction ?? 0;
  const totalDeductions =
    explicitTotalDeductions ??
    (feedDeduction !== null || rawOtherDeduction !== null
      ? Number(Number(feedDeduction || 0) + Number(otherDeduction || 0)).toFixed(2)
      : null);
  const dailyTotalLiters =
    parseNumber(aiJson.daily_total_liters) ??
    (dailyEntries.length ? roundMoney(dailyEntries.reduce((sum, row) => sum + Number(row.total_liters || 0), 0)) : null);
  const dailyTotalAmount =
    parseNumber(aiJson.daily_total_amount) ??
    (dailyEntries.length ? roundMoney(dailyEntries.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)) : null);

  return {
    ...common,
    slip_type: "settlement",
    dairy_name: readValue(aiJson.dairy_name) || null,
    member_number: readValue(aiJson.member_number) || null,
    farmer_code: readValue(aiJson.member_number) || null,
    dairy_member_code: readValue(aiJson.member_number) || null,
    period_start: normalizeDate(aiJson.period_start),
    period_end: normalizeDate(aiJson.period_end),
    settlement_date: normalizeDate(aiJson.settlement_date),
    avg_rate: parseNumber(aiJson.average_rate),
    total_liters: parseNumber(aiJson.total_liters),
    total_milk_income: parseNumber(aiJson.total_income),
    cattle_feed_deduction: feedDeduction || 0,
    other_deductions: otherDeduction || 0,
    total_deductions: totalDeductions === null ? null : Number(totalDeductions),
    deductions: {
      feed_deduction: feedDeduction,
      other_deductions: otherDeduction,
      total_deductions: totalDeductions === null ? null : Number(totalDeductions)
    },
    net_payable: parseNumber(aiJson.net_amount),
    session_entries: sessionEntries,
    daily_entries: dailyEntries,
    daily_total_liters: dailyTotalLiters,
    daily_total_amount: dailyTotalAmount,
    settlement_validation: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      requires_manual_review: validation.requires_review,
      daily_liters_sum: dailyTotalLiters,
      daily_amount_sum: dailyTotalAmount,
      summary_total_liters: parseNumber(aiJson.total_liters),
      summary_total_income: parseNumber(aiJson.total_income),
      summary_net_payable: parseNumber(aiJson.net_amount)
    },
    ocr_requires_manual_review: validation.requires_review
  };
}

async function parseWithRetry(makeAttempt, parseFailureMessage) {
  const attempts = [];
  let aiJson = null;
  let parseError = null;

  const firstAttempt = await makeAttempt({ maxTokens: DEFAULT_MAX_TOKENS, retry: false });
  attempts.push(firstAttempt);

  try {
    if (firstAttempt.finishReason === "length") {
      throw new GptJsonParseError("GPT response token limit मुळे अर्धवट आले.", {
        finishReason: firstAttempt.finishReason,
        responseLength: firstAttempt.content.length
      });
    }
    aiJson = parseJson(firstAttempt.content);
  } catch (error) {
    parseError = error;
  }

  if (!aiJson) {
    const retryAttempt = await makeAttempt({ maxTokens: RETRY_MAX_TOKENS, retry: true });
    attempts.push(retryAttempt);

    try {
      if (retryAttempt.finishReason === "length") {
        throw new GptJsonParseError("GPT retry response token limit मुळे अर्धवट आले.", {
          finishReason: retryAttempt.finishReason,
          responseLength: retryAttempt.content.length
        });
      }
      aiJson = parseJson(retryAttempt.content);
      parseError = null;
    } catch (error) {
      parseError = error;
    }
  }

  if (!aiJson) {
    console.error("Slip GPT JSON parse failed", {
      error: parseError?.message,
      details: parseError?.details,
      attempts: attempts.map((attempt) => ({
        finishReason: attempt.finishReason,
        responseLength: attempt.content.length,
        tokens: attempt.response.usage?.total_tokens || 0
      }))
    });

    throw new Error(parseFailureMessage);
  }

  return { aiJson, attempts };
}

export async function structureSlipTextWithGPT({ rawText, ocr = {} }) {
  if (!rawText || !String(rawText).trim()) {
    throw new Error("Google Vision ला text वाचता आला नाही.");
  }

  const client = getClient();
  const { aiJson, attempts } = await parseWithRetry(
    ({ maxTokens, retry }) => requestStructuredJson(client, rawText, { maxTokens, retry }),
    (
      "AI कडून पूर्ण JSON मिळाले नाही. 15 दिवसांची स्लिप मोठी असल्यामुळे output अर्धवट आले. कृपया फोटो सरळ/जवळून पुन्हा अपलोड करा किंवा manual तपासणी करा."
    )
  );

  const thermalDailyJson = extractThermalDailySlipFromText(rawText);
  const shouldUseThermalDaily =
    thermalDailyJson &&
    (
      thermalDailyJson.confidence >= Number(aiJson.confidence || aiJson.confidence_score || 0) ||
      !["settlement"].includes(String(aiJson.type || aiJson.slip_type || "").toLowerCase())
    );
  const finalJson = shouldUseThermalDaily
    ? {
        ...aiJson,
        ...thermalDailyJson,
        dairy_name: aiJson.dairy_name || thermalDailyJson.dairy_name,
        warnings: Array.from(new Set([
          ...(Array.isArray(aiJson.warnings) ? aiJson.warnings : []),
          ...(thermalDailyJson.warnings || [])
        ]))
      }
    : aiJson;
  const response = attempts[attempts.length - 1].response;
  const normalized = normalizeStructuredSlip(finalJson, ocr);
  const tokensUsed = attempts.reduce((sum, attempt) => sum + Number(attempt.response.usage?.total_tokens || 0), 0);

  return {
    success: true,
    provider: "openai",
    model: MODEL,
    aiJson: finalJson,
    data: normalized,
    confidence_score: normalized.confidence_score,
    usage: response.usage || null,
    tokensUsed,
    retried: attempts.length > 1,
    extractionMode: "google_vision_text",
    finishReason: attempts[attempts.length - 1].finishReason
  };
}

export async function structureSlipImageWithGPT({ imageBase64, mediaType = "image/webp", fallbackReason = "" }) {
  const client = getClient();
  const { aiJson, attempts } = await parseWithRetry(
    ({ maxTokens, retry }) =>
      requestVisionStructuredJson(client, imageBase64, {
        mediaType,
        maxTokens,
        retry,
        fallbackReason
      }),
    "Direct GPT Vision कडून पूर्ण JSON मिळाले नाही. कृपया फोटो सरळ, जवळून आणि प्रकाशात पुन्हा अपलोड करा."
  );
  const response = attempts[attempts.length - 1].response;
  const normalized = normalizeStructuredSlip(aiJson, {
    provider: "openai_vision_direct",
    confidence: normalizeConfidence(aiJson.confidence ?? aiJson.confidence_score),
    rawText: ""
  });
  const tokensUsed = attempts.reduce((sum, attempt) => sum + Number(attempt.response.usage?.total_tokens || 0), 0);

  return {
    success: true,
    provider: "openai",
    model: VISION_MODEL,
    aiJson,
    data: {
      ...normalized,
      direct_vision_used: true
    },
    confidence_score: normalized.confidence_score,
    usage: response.usage || null,
    tokensUsed,
    retried: attempts.length > 1,
    extractionMode: "openai_vision_direct",
    finishReason: attempts[attempts.length - 1].finishReason
  };
}
