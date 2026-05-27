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

const SYSTEM_PROMPT = `You are an expert OCR and dairy accounting extraction system for Marathi dairy farmers in Maharashtra.

Your task: Extract structured financial data from dairy slips with EXTREME ACCURACY.

CRITICAL RULES:
1. Return ONLY valid JSON, no explanation or markdown.
2. NEVER guess or estimate unreadable numbers.
3. Use null for unclear or missing fields.
4. Financial accuracy is PARAMOUNT.
5. Detect slip type: "daily" or "settlement".
6. Return confidence_score from 0.0 to 1.0 based on text clarity.
7. List ALL missing important fields in missing_fields.
8. Handle both Marathi and English text.
9. Handle handwritten values.
10. Preserve financial precision. Never round.

DAILY MILK SLIP FIELDS:
{
  "slip_type": "daily",
  "dairy_name": "string or null",
  "member_number": "string or null",
  "slip_date": "YYYY-MM-DD or null",
  "session": "सकाळ" or "संध्याकाळ" or null,
  "liters": number or null,
  "fat_percentage": number or null,
  "snf_percentage": number or null,
  "clr_degree": "string or null",
  "rate_per_liter": number or null,
  "total_amount": number or null,
  "confidence_score": 0.0-1.0,
  "missing_fields": ["array of missing critical fields"],
  "notes": "any additional observations"
}

SETTLEMENT SLIP FIELDS:
{
  "slip_type": "settlement",
  "dairy_name": "string or null",
  "member_number": "string or null",
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

IMPORTANT:
- If text is blurry, torn, handwritten, dark, cropped, or unclear, set unclear fields to null and add those exact field names to missing_fields.
- Reduce confidence_score if any critical field is unclear.
- Look for Marathi deduction keywords: खाद्य, कपात, चार्ज, कमिशन, इतर.
- Date format MUST be YYYY-MM-DD.
- Numbers must be decimal, for example 12.5, not 12,5.
- Never round financial values.`;

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

function normalizeExtraction(data) {
  const slipType = normalizeSlipType(data?.slip_type);

  if (!slipType) {
    throw new Error("AI ला स्लिपचा प्रकार ओळखता आला नाही.");
  }

  return {
    ...data,
    slip_type: slipType,
    confidence_score: normalizeConfidence(data.confidence_score),
    missing_fields: normalizeMissingFields(data.missing_fields)
  };
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
              text: "Extract all visible data from this dairy slip. Return ONLY JSON. Use null for unclear financial values."
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
