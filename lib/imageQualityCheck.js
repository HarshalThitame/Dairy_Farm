const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const MIN_STD_DEV = 25;
const MAX_ASPECT_RATIO = 3.5;
const BLUR_WARNING_THRESHOLD = 35;

let sharpInstance = null;

async function getSharp() {
  if (!sharpInstance) {
    sharpInstance = (await import("sharp")).default;
  }
  return sharpInstance;
}

async function checkImageQuality(imageBuffer) {
  const sharp = await getSharp();
  const metadata = await sharp(imageBuffer, { failOn: "none" }).metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    return {
      pass: false,
      errors: ["फोटोची परिमाणे वाचता आली नाहीत."],
      warnings: [],
      metadata
    };
  }

  const errors = [];
  const warnings = [];
  const aspectRatio = Math.max(width, height) / Math.min(width, height);

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    errors.push("फोटो खूप लहान आहे (" + width + "x" + height + "). कृपया जवळून फोटो घ्या.");
  }

  if (aspectRatio > MAX_ASPECT_RATIO) {
    warnings.push("फोटोची रुंदी-उंचीची ratio जास्त आहे. स्लिप सरळ ठेवून फोटो घ्या.");
  }

  try {
    const stats = await sharp(imageBuffer, { failOn: "none" })
      .grayscale()
      .normalise()
      .stats();

    const stdDev = stats.channels?.[0]?.stdev || 0;

    if (stdDev < MIN_STD_DEV) {
      errors.push("फोटो अस्पष्ट किंवा एकसारखा दिसतो. चांगल्या प्रकाशात पुन्हा फोटो घ्या.");
    } else if (stdDev < BLUR_WARNING_THRESHOLD) {
      warnings.push("फोटोची स्पष्टता कमी आहे. शक्य असल्यास चांगल्या प्रकाशात पुन्हा फोटो घ्या.");
    }
  } catch {
    warnings.push("फोटो गुणवत्ता तपासता आली नाही.");
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

function formatQualityMessage(result) {
  const messages = [...result.errors, ...result.warnings];
  return messages.length ? messages.join(" ") : null;
}

export { checkImageQuality, formatQualityMessage };
