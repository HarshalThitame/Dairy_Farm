import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { isSupportedImageType } from "@/lib/imageCompression";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_COMPRESSED_SIZE = 900000;

function getBucket() {
  return process.env.ANIMAL_PHOTOS_BUCKET || "animal-photos";
}

function errorResponse(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeAnimalType(value) {
  return value === "calf" ? "calves" : "cows";
}

async function compressServerSide(imageFile) {
  const sharp = (await import("sharp")).default;
  const input = Buffer.from(await imageFile.arrayBuffer());
  const attempts = [
    { width: 1280, quality: 78 },
    { width: 960, quality: 72 },
    { width: 720, quality: 66 },
    { width: 560, quality: 60 }
  ];
  let bestBuffer = null;

  for (const attempt of attempts) {
    const compressed = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(attempt.width, attempt.width, {
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: attempt.quality, smartSubsample: true })
      .toBuffer();

    bestBuffer = compressed;

    if (compressed.length <= MAX_COMPRESSED_SIZE) {
      break;
    }
  }

  return {
    buffer: bestBuffer,
    originalSize: input.length,
    compressedSize: bestBuffer.length,
    compressionRatio: Math.max(0, Math.round((1 - bestBuffer.length / input.length) * 100))
  };
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile || !imageFile.arrayBuffer) {
      return errorResponse("फोटो निवडा.");
    }

    if (imageFile.type && !isSupportedImageType(imageFile.type)) {
      return errorResponse("फक्त फोटो फाइल निवडा.");
    }

    const animalType = normalizeAnimalType(formData.get("animalType"));
    const originalFilename = String(formData.get("originalFilename") || imageFile.name || "animal-photo.jpg");
    const clientCompressed = String(formData.get("clientCompressed") || "") === "true";
    let compressed;

    if (clientCompressed && imageFile.type === "image/webp") {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const originalSize = Number(formData.get("originalSize") || imageFile.size || imageBuffer.length);
      compressed = {
        buffer: imageBuffer,
        originalSize,
        compressedSize: imageBuffer.length,
        compressionRatio: Number(formData.get("compressionRatio") || Math.max(0, Math.round((1 - imageBuffer.length / originalSize) * 100)))
      };
    } else {
      compressed = await compressServerSide(imageFile);
    }

    if (!compressed.buffer?.length) {
      return errorResponse("फोटो प्रक्रिया झाली नाही.");
    }

    if (compressed.compressedSize > MAX_COMPRESSED_SIZE) {
      return errorResponse("फोटो खूप मोठा आहे. थोडा जवळून आणि स्पष्ट फोटो घ्या.");
    }

    const supabase = getSupabaseServerClient();
    const bucket = getBucket();
    const fileName = `${farmId}/${animalType}/${Date.now()}-${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, compressed.buffer, {
        contentType: "image/webp",
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return NextResponse.json({
      data: {
        photo_url: urlData.publicUrl,
        photo_storage_path: fileName,
        original_filename: originalFilename,
        original_size: compressed.originalSize,
        compressed_size: compressed.compressedSize,
        compression_ratio: compressed.compressionRatio,
        message: "फोटो अपलोड झाला."
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
