import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { isSupportedImageType } from "@/lib/imageCompression";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ORIGINAL_SIZE = 5 * 1024 * 1024;
const MAX_COMPRESSED_SIZE = 700000;

function getBucket() {
  return process.env.PROFILE_PHOTOS_BUCKET || "profile-photos";
}

async function compressProfilePhoto(file) {
  const sharp = (await import("sharp")).default;
  const input = Buffer.from(await file.arrayBuffer());

  if (input.length > MAX_ORIGINAL_SIZE) {
    const error = new Error("फोटो ५ MB पेक्षा कमी असावा.");
    error.status = 400;
    throw error;
  }

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(720, 720, {
      fit: "cover",
      withoutEnlargement: false
    })
    .webp({ quality: 76, smartSubsample: true })
    .toBuffer();

  if (buffer.length > MAX_COMPRESSED_SIZE) {
    const error = new Error("फोटो खूप मोठा आहे. दुसरा फोटो निवडा.");
    error.status = 400;
    throw error;
  }

  return {
    buffer,
    originalSize: input.length,
    compressedSize: buffer.length
  };
}

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file?.arrayBuffer) {
      return NextResponse.json({ error: "फोटो निवडा." }, { status: 400 });
    }

    if (file.type && !isSupportedImageType(file.type)) {
      return NextResponse.json({ error: "JPG, PNG किंवा WEBP फोटो निवडा." }, { status: 400 });
    }

    const compressed = await compressProfilePhoto(file);
    const supabase = getSupabaseServerClient();
    const bucket = getBucket();
    const path = `${auth.farmId}/${auth.userId}/${Date.now()}-${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, compressed.buffer, {
      contentType: "image/webp",
      upsert: false
    });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const photoUrl = urlData.publicUrl;
    const update = {
      profile_photo_url: photoUrl,
      profile_photo_storage_path: path,
      updated_at: new Date().toISOString()
    };

    const { error: userError } = await supabase.from("users").update(update).eq("id", auth.userId);
    if (userError) throw userError;

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        user_id: auth.userId,
        farm_id: auth.farmId,
        ...update
      }, { onConflict: "user_id" });
    if (profileError) throw profileError;

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "profile_photo_changed", {
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize
    });

    return NextResponse.json({
      success: true,
      photoUrl,
      storagePath: path
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data: user } = await supabase
      .from("users")
      .select("profile_photo_storage_path")
      .eq("id", auth.userId)
      .maybeSingle();

    if (user?.profile_photo_storage_path) {
      await supabase.storage.from(getBucket()).remove([user.profile_photo_storage_path]);
    }

    const update = {
      profile_photo_url: null,
      profile_photo_storage_path: null,
      updated_at: new Date().toISOString()
    };
    const { error: userError } = await supabase.from("users").update(update).eq("id", auth.userId);
    if (userError) throw userError;
    await supabase.from("user_profiles").update(update).eq("user_id", auth.userId);

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "profile_photo_removed");
    return NextResponse.json({ success: true });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
