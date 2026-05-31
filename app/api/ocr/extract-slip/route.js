import { NextResponse } from "next/server";
import { createOcrAuditLog } from "@/lib/ocrAudit";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { extractTextWithGoogleVision } from "@/lib/googleVisionOCR";
import { structureSlipTextWithGPT } from "@/lib/slipTextExtraction";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { imageBase64, rawText, imageUrl, uploadId } = await request.json();

    if (!imageBase64 && !rawText) {
      return NextResponse.json({ error: "फोटो किंवा OCR text आवश्यक आहे." }, { status: 400 });
    }

    const ocr = rawText
      ? {
          success: true,
          rawText,
          confidence: 0,
          provider: "provided_text"
        }
      : await extractTextWithGoogleVision(imageBase64);

    const structured = await structureSlipTextWithGPT({
      rawText: ocr.rawText,
      ocr
    });
    const supabase = getSupabaseServerClient();
    const audit = await createOcrAuditLog(supabase, {
      farm_id: farmId,
      slip_upload_id: uploadId || null,
      image_url: imageUrl || null,
      ocr_provider: ocr.provider,
      ocr_text: ocr.rawText,
      ocr_confidence: ocr.confidence,
      ai_model: structured.model,
      ai_json: structured.aiJson,
      confidence: structured.confidence_score,
      warnings: structured.data?.ai_warnings || structured.data?.validation?.warnings || [],
      validation: structured.data?.validation || null
    });

    return NextResponse.json({
      data: {
        success: true,
        rawText: ocr.rawText,
        ocrConfidence: ocr.confidence,
        ocrProvider: ocr.provider,
        extractedData: {
          ...structured.data,
          ocr_audit_log_id: audit?.id || null
        },
        aiJson: structured.aiJson,
        confidence: structured.confidence_score,
        model: structured.model,
        retried: Boolean(structured.retried),
        usage: structured.usage,
        auditLogId: audit?.id || null,
        message: "OCR आणि AI extraction पूर्ण झाले. कृपया तपासा."
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
