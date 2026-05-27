import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { isSupportedImageType, validateImageSize } from "@/lib/imageCompression";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

async function compressServerSide(imageFile) {
  const sharp = (await import("sharp")).default;
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  const attempts = [
    { width: 1600, quality: 76 },
    { width: 1400, quality: 70 },
    { width: 1280, quality: 65 },
    { width: 1100, quality: 58 },
    { width: 960, quality: 52 }
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

    if (compressed.length <= 300000) {
      break;
    }
  }

  return {
    buffer: bestBuffer,
    originalSize: buffer.length,
    compressedSize: bestBuffer.length,
    compressionRatio: Math.max(0, Math.round((1 - bestBuffer.length / buffer.length) * 100)),
    serverCompressed: true,
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
    let compressed;

    if (clientCompressed && imageFile.type === "image/webp") {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      compressed = {
        buffer: imageBuffer,
        originalSize: originalSizeFromForm || imageFile.size || imageBuffer.length,
        compressedSize: imageBuffer.length,
        compressionRatio: Number(formData.get("compressionRatio") || 0),
        serverCompressed: false
      };
    } else {
      compressed = await compressServerSide(imageFile);
    }

    const validation = validateImageSize(compressed.compressedSize);

    if (!validation.valid) {
      return uploadError(validation.message);
    }

    const supabase = getSupabaseServerClient();
    const bucket = getStorageBucket();
    const fileName = `${farmId}/${Date.now()}-${randomUUID()}.webp`;
    const { error: uploadErrorResult } = await supabase.storage
      .from(bucket)
      .upload(fileName, compressed.buffer, {
        contentType: "image/webp",
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
        upload: publicSlipResponse(uploadRecord),
        message: "फोटो अपलोड झाला. AI वाचत आहे..."
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
