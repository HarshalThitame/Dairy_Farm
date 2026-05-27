import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  DEFAULT_SLIP_OCR_MODEL,
  FALLBACK_SLIP_OCR_MODEL,
  extractWithGPTHybrid
} from "@/lib/slipOCR";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractionResponse(upload, extra = {}) {
  return {
    success: upload.extraction_status === "success" || upload.extraction_status === "saved",
    uploadId: upload.id,
    imageUrl: upload.compressed_image_url,
    upload,
    extractedData: upload.ai_raw_response || null,
    confidence_score: upload.ai_confidence || 0,
    model_used: upload.ai_model_used || null,
    retried: Boolean(upload.retried),
    tokensUsed: upload.ai_tokens_used || 0,
    cost_estimate: upload.ai_cost_estimate || 0,
    status: upload.extraction_status,
    ...extra
  };
}

function getStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "dairy-slips";
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { uploadId } = await request.json();

    if (!uploadId) {
      return NextResponse.json({ error: "स्लिप फोटो ID आवश्यक आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: uploadRecord, error: fetchError } = await supabase
      .from("slip_uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("farm_id", farmId)
      .single();

    if (fetchError || !uploadRecord) {
      return NextResponse.json({ error: "स्लिप रेकॉर्ड सापडली नाही." }, { status: 404 });
    }

    if (
      (uploadRecord.extraction_status === "success" || uploadRecord.extraction_status === "saved") &&
      uploadRecord.ai_raw_response
    ) {
      return NextResponse.json({
        data: extractionResponse(uploadRecord, {
          message: "डेटा आधीच वाचला आहे. कृपया तपासा आणि जतन करा.",
          cached: true
        })
      });
    }

    const storagePath = uploadRecord.compressed_storage_path;

    if (!storagePath) {
      return NextResponse.json({ error: "फोटो storage path सापडला नाही." }, { status: 400 });
    }

    await supabase
      .from("slip_uploads")
      .update({ extraction_status: "processing", extraction_error: null, updated_at: new Date().toISOString() })
      .eq("id", uploadId)
      .eq("farm_id", farmId);

    const { data: imageData, error: downloadError } = await supabase.storage
      .from(getStorageBucket())
      .download(storagePath);

    if (downloadError) {
      throw downloadError;
    }

    const imageBase64 = Buffer.from(await imageData.arrayBuffer()).toString("base64");
    const result = await extractWithGPTHybrid(imageBase64);

    if (!result.success) {
      await supabase
        .from("slip_uploads")
        .update({
          extraction_status: "failed",
          extraction_error: result.error || "स्लिप वाचता आली नाही.",
          ai_model_used: result.model_used,
          ai_model_primary: DEFAULT_SLIP_OCR_MODEL,
          ai_model_fallback: result.retried ? FALLBACK_SLIP_OCR_MODEL : null,
          ai_tokens_used: result.tokensUsed || 0,
          ai_cost_estimate: result.cost_estimate || 0,
          retried: Boolean(result.retried),
          updated_at: new Date().toISOString()
        })
        .eq("id", uploadId)
        .eq("farm_id", farmId);

      return NextResponse.json(
        {
          error: result.error || "स्लिप नीट वाचता आली नाही. पुन्हा फोटो घ्या."
        },
        { status: 400 }
      );
    }

    const { data: updatedUpload, error: updateError } = await supabase
      .from("slip_uploads")
      .update({
        extraction_status: "success",
        extraction_error: null,
        ai_model_used: result.model_used,
        ai_model_primary: DEFAULT_SLIP_OCR_MODEL,
        ai_model_fallback: result.retried ? FALLBACK_SLIP_OCR_MODEL : null,
        ai_confidence: result.confidence_score,
        ai_raw_response: result.data,
        ai_tokens_used: result.tokensUsed || 0,
        ai_cost_estimate: result.cost_estimate || 0,
        retried: Boolean(result.retried),
        slip_type: result.data.slip_type,
        updated_at: new Date().toISOString()
      })
      .eq("id", uploadId)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      data: extractionResponse(updatedUpload, {
        retried: Boolean(result.retried),
        tokensUsed: result.tokensUsed || 0,
        cost_estimate: result.cost_estimate || 0,
        model_used: result.model_used,
        message: "डेटा वाचली गेले. कृपया तपासा आणि जतन करा."
      })
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
