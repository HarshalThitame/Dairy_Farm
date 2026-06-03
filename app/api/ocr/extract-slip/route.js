import { NextResponse } from "next/server";
import { createOcrAuditLog } from "@/lib/ocrAudit";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { extractTextWithGoogleVision } from "@/lib/googleVisionOCR";
import { structureSlipImageWithGPT, structureSlipTextWithGPT } from "@/lib/slipTextExtraction";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getImageMediaType(imageBase64 = "") {
  const match = String(imageBase64 || "").match(/^data:([^;]+);base64,/);
  return match?.[1] || "image/webp";
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { imageBase64, rawText, imageUrl, uploadId } = await readJsonBody(request);

    if (!imageBase64 && !rawText) {
      return NextResponse.json({ error: "फोटो किंवा OCR text आवश्यक आहे." }, { status: 400 });
    }

    let ocr = rawText
      ? {
          success: true,
          rawText,
          confidence: 0,
          provider: "provided_text"
        }
      : null;
    let structured = null;
    let directVisionFallback = {
      used: false,
      reason: null
    };

    if (ocr) {
      structured = await structureSlipTextWithGPT({
        rawText: ocr.rawText,
        ocr
      });
    } else {
      try {
        ocr = await extractTextWithGoogleVision(imageBase64);
        structured = await structureSlipTextWithGPT({
          rawText: ocr.rawText,
          ocr
        });
      } catch (error) {
        directVisionFallback = {
          used: true,
          reason: `Google Vision/Text OCR failed: ${error.message || "unknown error"}`
        };
        structured = await structureSlipImageWithGPT({
          imageBase64,
          mediaType: getImageMediaType(imageBase64),
          fallbackReason: directVisionFallback.reason
        });
        ocr = {
          success: true,
          rawText: "",
          confidence: structured.confidence_score || 0,
          provider: "openai_vision_direct"
        };
      }
    }

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
        directVisionUsed: directVisionFallback.used,
        directVisionReason: directVisionFallback.reason,
        extractionMode: structured.extractionMode || (directVisionFallback.used ? "openai_vision_direct" : "google_vision_text"),
        usage: structured.usage,
        auditLogId: audit?.id || null,
        message: "OCR आणि AI extraction पूर्ण झाले. कृपया तपासा."
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
