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
  "member_number": "string or null",
  "dairy_member_code": "string or null",
  "settlement_date": "YYYY-MM-DD or null",
  "period_start": "YYYY-MM-DD or null",
  "period_end": "YYYY-MM-DD or null",
  "total_liters": number or null,
  "total_milk_income": number or null,
  "cattle_feed_deduction": number or null,
  "other_deductions": number or null,
  "net_payable": number or null,
  "confidence_score": 0.0-1.0,
  "missing_fields": ["array of missing fields"],
  "notes": "any additional observations"
}

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
  } catch {
    const match = String(text || "").match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response मध्ये JSON सापडले नाही.");
    }
    return JSON.parse(match[0]);
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

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value)
    .replace(/[,₹\s]/g, "")
    .replace(/[Oo]/g, "0");
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeDate(value) {
  if (!value) {
    return value;
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (!slashMatch) {
    return text;
  }

  const [, day, month, rawYear] = slashMatch;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeTime(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim();
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

function normalizeExtraction(data) {
  const slipType = normalizeSlipType(data?.slip_type);

  if (!slipType) {
    throw new Error("AI ला स्लिपचा प्रकार ओळखता आला नाही.");
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
      ? ["period_start", "period_end", "total_milk_income", "net_payable"]
      : ["slip_date", "session", "liters", "rate_per_liter", "total_amount"];
  const missing = normalizeMissingFields(data?.missing_fields).map((field) => field.toLowerCase());

  return criticalFields.filter((field) => {
    if (data?.[field] === null || data?.[field] === undefined || data?.[field] === "") {
      return true;
    }

    return missing.some((missingField) => missingField.includes(field.toLowerCase()));
  });
}

function combineAttemptCost(...attempts) {
  return attempts.reduce((sum, attempt) => sum + Number(attempt?.cost_estimate || 0), 0);
}

function combineAttemptTokens(...attempts) {
  return attempts.reduce((sum, attempt) => sum + Number(attempt?.tokensUsed || 0), 0);
}

export async function extractFromDairySlipWithGPT(imageBase64, model = DEFAULT_SLIP_OCR_MODEL) {
  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model,
      max_tokens: 1200,
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
                "Extract data from this Indian dairy slip. If it is a daily thermal printer slip, convert DD/MM/YYYY to YYYY-MM-DD, convert SHIFT to Marathi session, include slip_time, milk_type, dairy_member_code, numeric clr_score, and slip_printed_amount exactly as the printed AMOUNT value. Calculate total_amount only from LITRE x RATE when both are readable. Ignore serial/barcode numbers. Return ONLY JSON. Use null for unclear financial values."
            }
          ]
        }
      ]
    });
    const responseText = response.choices?.[0]?.message?.content || "";
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

  if (secondAttempt.success && secondAttempt.confidence_score > firstAttempt.confidence_score) {
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
