const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

function cleanBase64(value = "") {
  return String(value || "").replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();
}

function collectConfidences(node, values = []) {
  if (!node || typeof node !== "object") {
    return values;
  }

  if (Number.isFinite(Number(node.confidence)) && Number(node.confidence) > 0) {
    values.push(Number(node.confidence));
  }

  for (const key of ["pages", "blocks", "paragraphs", "words", "symbols"]) {
    if (Array.isArray(node[key])) {
      node[key].forEach((child) => collectConfidences(child, values));
    }
  }

  return values;
}

function normalizeConfidence(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numberValue));
}

function averageConfidence(fullTextAnnotation) {
  const values = collectConfidences(fullTextAnnotation);

  if (!values.length) {
    return 0;
  }

  return normalizeConfidence(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getVisionApiKey() {
  const apiKey = process.env.GOOGLE_VISION_API_KEY?.trim();

  if (!apiKey || apiKey === "your_key_here") {
    throw new Error(
      "`GOOGLE_VISION_API_KEY` env variable सेट करा. Google Vision OCR साठी service account JSON ऐवजी API key वापरला जातो."
    );
  }

  return apiKey;
}

function getVisionErrorMessage(errorPayload) {
  const apiMessage = errorPayload?.error?.message;

  if (!apiMessage) {
    return "Google Vision OCR प्रक्रिया विफल झाली.";
  }

  if (apiMessage.includes("API key not valid")) {
    return "Google Vision API key चुकीचा आहे. `GOOGLE_VISION_API_KEY` तपासा.";
  }

  if (apiMessage.includes("Cloud Vision API has not been used") || apiMessage.includes("disabled")) {
    return "Google Cloud project मध्ये Cloud Vision API enable करा.";
  }

  if (apiMessage.includes("PERMISSION_DENIED")) {
    return "Google Vision API key ला permission नाही. API key restrictions आणि Cloud Vision API enable आहे का तपासा.";
  }

  return `Google Vision OCR त्रुटी: ${apiMessage}`;
}

export async function extractTextWithGoogleVision(imageBase64) {
  const content = cleanBase64(imageBase64);

  if (!content) {
    throw new Error("फोटो डेटा मिळाला नाही.");
  }

  const apiKey = getVisionApiKey();
  const response = await fetch(`${VISION_API_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          image: { content },
          features: [
            { type: "TEXT_DETECTION" },
            { type: "DOCUMENT_TEXT_DETECTION" }
          ],
          imageContext: {
            languageHints: ["mr", "en"]
          }
        }
      ]
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getVisionErrorMessage(payload));
  }

  const result = payload?.responses?.[0] || {};

  if (result.error) {
    throw new Error(getVisionErrorMessage({ error: result.error }));
  }

  const fullTextAnnotation = result.fullTextAnnotation || null;
  const rawText =
    fullTextAnnotation?.text ||
    result.textAnnotations?.[0]?.description ||
    "";

  return {
    success: true,
    rawText,
    confidence: averageConfidence(fullTextAnnotation),
    provider: "google_vision_rest",
    pageCount: fullTextAnnotation?.pages?.length || 0
  };
}

export function googleVisionConfigured() {
  const apiKey = process.env.GOOGLE_VISION_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== "your_key_here");
}
