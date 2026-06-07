import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { isSupportedImageType, validateImageSize } from "@/lib/imageCompression";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PROCESSED_IMAGE_SIZE = 1500000;

function uploadError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function publicSlipResponse(record) {
  return {
    id: record.id,
    original_filename: record.original_filename,
    original_size: record.original_size,
    compressed_size: record.compressed_size,
    compression_ratio: record.compression_ratio,
    compressed_image_url: record.compressed_image_url,
    compressed_storage_path: record.compressed_storage_path,
    slip_type: record.slip_type,
    ai_model_used: record.ai_model_used,
    ai_model_primary: record.ai_model_primary,
    ai_model_fallback: record.ai_model_fallback,
    ai_confidence: record.ai_confidence,
    ai_raw_response: record.ai_raw_response,
    ai_tokens_used: record.ai_tokens_used,
    ai_cost_estimate: record.ai_cost_estimate,
    retried: record.retried,
    extraction_status: record.extraction_status,
    extraction_error: record.extraction_error,
    linked_milk_record_id: record.linked_milk_record_id,
    linked_dairy_slip_id: record.linked_dairy_slip_id,
    linked_settlement_id: record.linked_settlement_id,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
}

function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "dairy-slips";
}

function getExtensionFromType(type = "") {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("heic")) return "heic";
  if (normalized.includes("heif")) return "heif";
  return "jpg";
}

function getUploadContentType(type = "", fallback = "image/jpeg") {
  return String(type || "").startsWith("image/") ? String(type) : fallback;
}

async function compressServerSide(imageFile) {
  const sharp = (await import("sharp")).default;
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const originalContentType = getUploadContentType(imageFile.type);

  if (buffer.length <= 750000) {
    return {
      buffer,
      originalSize: buffer.length,
      compressedSize: buffer.length,
      compressionRatio: 0,
      serverCompressed: false,
      skippedCompression: true,
      contentType: originalContentType,
      extension: getExtensionFromType(originalContentType)
    };
  }

  const attempts = [
    { width: 1800, quality: 90 },
    { width: 1600, quality: 86 },
    { width: 1400, quality: 82 },
    { width: 1280, quality: 76 },
    { width: 1100, quality: 70 },
    { width: 960, quality: 64 },
    { width: 840, quality: 58 },
    { width: 720, quality: 52 },
    { width: 640, quality: 48 }
  ];
  let bestBuffer = null;
  let bestAttempt = attempts[attempts.length - 1];

  for (const attempt of attempts) {
    const compressed = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(attempt.width, attempt.width, {
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: attempt.quality, smartSubsample: true })
      .toBuffer();

    bestBuffer = compressed;
    bestAttempt = attempt;

    if (compressed.length <= MAX_PROCESSED_IMAGE_SIZE) {
      break;
    }
  }

  return {
    buffer: bestBuffer,
    originalSize: buffer.length,
    compressedSize: bestBuffer.length,
    compressionRatio: Math.max(0, Math.round((1 - bestBuffer.length / buffer.length) * 100)),
    serverCompressed: true,
    skippedCompression: false,
    contentType: "image/webp",
    extension: "webp",
    quality: bestAttempt.quality
  };
}

async function recompressBufferServerSide(buffer, originalContentType = "image/jpeg") {
  const sharp = (await import("sharp")).default;
  const attempts = [
    { width: 1600, quality: 82 },
    { width: 1400, quality: 76 },
    { width: 1280, quality: 70 },
    { width: 1100, quality: 64 },
    { width: 960, quality: 58 },
    { width: 840, quality: 54 },
    { width: 720, quality: 50 },
    { width: 640, quality: 46 }
  ];
  let bestBuffer = null;
  let bestAttempt = attempts[attempts.length - 1];

  for (const attempt of attempts) {
    const compressed = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(attempt.width, attempt.width, {
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: attempt.quality, smartSubsample: true })
      .toBuffer();

    bestBuffer = compressed;
    bestAttempt = attempt;

    if (compressed.length <= MAX_PROCESSED_IMAGE_SIZE) {
      break;
    }
  }

  return {
    buffer: bestBuffer,
    originalSize: buffer.length,
    compressedSize: bestBuffer.length,
    compressionRatio: Math.max(0, Math.round((1 - bestBuffer.length / buffer.length) * 100)),
    serverCompressed: true,
    clientRecompressed: true,
    skippedCompression: false,
    contentType: "image/webp",
    extension: "webp",
    originalContentType,
    quality: bestAttempt.quality
  };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") || 10)));
    const supabase = getSupabaseServerClient();

    if (id) {
      if (!UUID_PATTERN.test(String(id ?? "").trim())) {
        return uploadError("स्लिप फोटो ID चुकीचा आहे.", 400);
      }

      const { data, error } = await supabase
        .from("slip_uploads")
        .select("*")
        .eq("id", id)
        .eq("farm_id", farmId)
        .single();

      if (error || !data) {
        return uploadError("स्लिप फोटो सापडला नाही.", 404);
      }

      return NextResponse.json({ data: publicSlipResponse(data) });
    }

    const { data, error } = await supabase
      .from("slip_uploads")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: (data || []).map(publicSlipResponse) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !imageFile.arrayBuffer) {
      return uploadError("फोटो निवडा.");
    }

    if (imageFile.type && !isSupportedImageType(imageFile.type)) {
      return uploadError("फक्त फोटो फाइल निवडा.");
    }

    const originalFilename = String(formData.get("originalFilename") || imageFile.name || "dairy-slip");
    const originalSizeFromForm = Number(formData.get("originalSize") || imageFile.size || 0);
    const clientCompressed = String(formData.get("clientCompressed") || "") === "true";
    const clientPrepared = String(formData.get("clientPrepared") || "") === "true";
    let compressed;

    if (clientPrepared || clientCompressed) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const contentType = getUploadContentType(imageFile.type, "image/webp");
      compressed = {
        buffer: imageBuffer,
        originalSize: originalSizeFromForm || imageFile.size || imageBuffer.length,
        compressedSize: imageBuffer.length,
        compressionRatio: Number(formData.get("compressionRatio") || 0),
        serverCompressed: false,
        skippedCompression: String(formData.get("skippedCompression") || "") === "true",
        contentType,
        extension: getExtensionFromType(contentType)
      };

      if (compressed.compressedSize > MAX_PROCESSED_IMAGE_SIZE) {
        compressed = await recompressBufferServerSide(imageBuffer, contentType);
        compressed.originalSize = originalSizeFromForm || imageFile.size || imageBuffer.length;
      }
    } else {
      compressed = await compressServerSide(imageFile);
    }

    const validation = validateImageSize(compressed.compressedSize);

    if (!validation.valid) {
      return uploadError(validation.message);
    }

    const supabase = getSupabaseServerClient();
    const bucket = getStorageBucket();
    const fileName = `${farmId}/${Date.now()}-${randomUUID()}.${compressed.extension || "webp"}`;
    const { error: uploadErrorResult } = await supabase.storage
      .from(bucket)
      .upload(fileName, compressed.buffer, {
        contentType: compressed.contentType || "image/webp",
        upsert: false
      });

    if (uploadErrorResult) {
      throw uploadErrorResult;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const compressedImageUrl = urlData.publicUrl;
    const { data: uploadRecord, error: dbError } = await supabase
      .from("slip_uploads")
      .insert({
        farm_id: farmId,
        original_filename: originalFilename,
        original_size: originalSizeFromForm || compressed.originalSize,
        compressed_size: compressed.compressedSize,
        compression_ratio: compressed.compressionRatio,
        compressed_image_url: compressedImageUrl,
        compressed_storage_path: fileName,
        extraction_status: "pending"
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({
      data: {
        success: true,
        uploadId: uploadRecord.id,
        imageUrl: compressedImageUrl,
        imageSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio,
        serverCompressed: compressed.serverCompressed,
        skippedCompression: Boolean(compressed.skippedCompression),
        upload: publicSlipResponse(uploadRecord),
        message: "फोटो अपलोड झाला. AI वाचत आहे..."
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
