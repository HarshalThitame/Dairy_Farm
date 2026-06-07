const DEFAULT_MAX_SIZE = 1500000;
const DEFAULT_MIN_SIZE = 1;
const SKIP_COMPRESSION_SIZE = 750000;

const compressionAttempts = [
  { maxDimension: 1800, quality: 0.9 },
  { maxDimension: 1600, quality: 0.86 },
  { maxDimension: 1400, quality: 0.82 },
  { maxDimension: 1280, quality: 0.76 },
  { maxDimension: 1100, quality: 0.7 },
  { maxDimension: 960, quality: 0.64 },
  { maxDimension: 840, quality: 0.58 },
  { maxDimension: 720, quality: 0.52 },
  { maxDimension: 640, quality: 0.48 }
];

function getFileName(file) {
  return file?.name || "dairy-slip.jpg";
}

function getBaseName(filename) {
  return String(filename || "dairy-slip").replace(/\.[^.]+$/, "") || "dairy-slip";
}

function getExtensionFromType(type = "") {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("heic")) return "heic";
  if (normalized.includes("heif")) return "heif";
  return "jpg";
}

function calculateTargetSize(width, height, maxDimension) {
  const ratio = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("फोटो संकुचित करताना त्रुटी आली."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

async function canvasToCompressedBlob(canvas, preferredType, quality) {
  try {
    const blob = await canvasToBlob(canvas, preferredType, quality);

    if (blob?.type === preferredType || preferredType !== "image/webp") {
      return blob;
    }
  } catch {
    // Some iOS Safari versions do not encode WebP reliably. JPEG fallback is safe
    // for OCR and still keeps the upload small.
  }

  return canvasToBlob(canvas, "image/jpeg", quality);
}

async function loadImageSource(file) {
  if (typeof window === "undefined") {
    throw new Error("Client-side compression browser मध्येच चालते.");
  }

  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close?.()
      };
    } catch {
      // Fall back to HTMLImageElement below.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("फोटो उघडता आला नाही."));
      element.src = objectUrl;
    });

    return {
      source: image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      cleanup: () => URL.revokeObjectURL(objectUrl)
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function compressImageFileToWebP(file, options = {}) {
  if (!file?.size) {
    throw new Error("फोटो निवडा.");
  }

  if (typeof document === "undefined") {
    throw new Error("फोटो संकुचित करण्यासाठी browser आवश्यक आहे.");
  }

  const originalSize = file.size;
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE;
  const skipCompressionSize = options.skipCompressionSize || SKIP_COMPRESSION_SIZE;
  const originalFilename = getFileName(file);

  if (originalSize <= skipCompressionSize) {
    return {
      compressedBlob: file,
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
      format: getExtensionFromType(file.type),
      originalFilename,
      compressedFilename: originalFilename,
      width: null,
      height: null,
      quality: null,
      skippedCompression: true
    };
  }

  const image = await loadImageSource(file);
  let bestBlob = null;
  let bestAttempt = compressionAttempts[compressionAttempts.length - 1];
  let bestWidth = image.width;
  let bestHeight = image.height;

  try {
    for (const attempt of compressionAttempts) {
      const size = calculateTargetSize(image.width, image.height, attempt.maxDimension);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d", { alpha: false });

      if (!context) {
        throw new Error("फोटो प्रक्रिया सुरू झाली नाही.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(image.source, 0, 0, size.width, size.height);

      const blob = await canvasToCompressedBlob(canvas, "image/webp", attempt.quality);
      bestBlob = blob;
      bestAttempt = attempt;
      bestWidth = size.width;
      bestHeight = size.height;

      if (blob.size <= maxSize) {
        break;
      }
    }
  } finally {
    image.cleanup?.();
  }

  if (!bestBlob) {
    throw new Error("फोटो संकुचित करताना त्रुटी आली.");
  }

  const outputType = bestBlob.type || "image/jpeg";
  const outputFormat = outputType.includes("webp") ? "webp" : "jpg";
  const compressedFilename = `${getBaseName(originalFilename)}.${outputFormat}`;
  const compressedFile = new File([bestBlob], compressedFilename, {
    type: outputType,
    lastModified: Date.now()
  });

  return {
    compressedBlob: bestBlob,
    compressedFile,
    originalSize,
    compressedSize: bestBlob.size,
    compressionRatio: Math.max(0, Math.round((1 - bestBlob.size / originalSize) * 100)),
    format: outputFormat,
    originalFilename,
    compressedFilename,
    width: bestWidth,
    height: bestHeight,
    quality: bestAttempt.quality,
    skippedCompression: false
  };
}

export const compressImageToWebP = compressImageFileToWebP;

export function validateImageSize(compressedSize, options = {}) {
  const minSize = options.minSize || DEFAULT_MIN_SIZE;
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE;

  if (!compressedSize || compressedSize < minSize) {
    return {
      valid: false,
      size: compressedSize || 0,
      message: "फोटो फाइल रिकामी आहे. दुसरा फोटो निवडा."
    };
  }

  if (compressedSize > maxSize) {
    return {
      valid: false,
      size: compressedSize,
      message: "फोटो खूप मोठा आहे. कृपया पुन्हा स्पष्ट पण जवळून फोटो घ्या."
    };
  }

  return {
    valid: true,
    size: compressedSize,
    message: "फोटो तयार आहे."
  };
}

export function getCompressionStats(originalSize, compressedSize) {
  const original = Number(originalSize || 0);
  const compressed = Number(compressedSize || 0);

  return {
    original_mb: (original / 1024 / 1024).toFixed(2),
    compressed_mb: (compressed / 1024 / 1024).toFixed(2),
    compressed_kb: Math.round(compressed / 1024),
    reduction_percent: original > 0 ? Math.max(0, Math.round((1 - compressed / original) * 100)) : 0,
    api_cost_reduction: "75%"
  };
}

export function isSupportedImageType(type = "") {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"].includes(
    String(type).toLowerCase()
  );
}
