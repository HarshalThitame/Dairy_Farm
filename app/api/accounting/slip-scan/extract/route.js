import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { extractTextWithGoogleVision } from "@/lib/googleVisionOCR";
import { createOcrAuditLog } from "@/lib/ocrAudit";
import { mergeSettlementRowsWithTrustedDailySlips } from "@/lib/settlementDailySlipMerge";
import { fillSlipGaps } from "@/lib/slipGapFilling";
import { structureSlipImageWithGPT, structureSlipTextWithGPT } from "@/lib/slipTextExtraction";
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

function getImageMediaType(storagePath = "") {
  const path = String(storagePath || "").toLowerCase();

  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".heic")) return "image/heic";
  if (path.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

function cachedExtractionNeedsRefresh(uploadRecord) {
  const raw = uploadRecord?.ai_raw_response;
  return raw?.slip_type === "settlement" && !raw.settlement_validation;
}

function hasJsonChanged(before, after) {
  try {
    return JSON.stringify(before || null) !== JSON.stringify(after || null);
  } catch {
    return true;
  }
}

function getCriticalMissingFields(data = {}) {
  const missing = new Set((data.missing_fields || []).map((field) => String(field || "").toLowerCase()));

  if (data.slip_type === "daily") {
    [
      ["slip_date", data.slip_date],
      ["session", data.session],
      ["liters", data.liters],
      ["rate_per_liter", data.rate_per_liter],
      ["total_amount", data.total_amount ?? data.slip_printed_amount]
    ].forEach(([field, value]) => {
      if (value === null || value === undefined || value === "") {
        missing.add(field);
      }
    });
  }

  if (data.slip_type === "settlement") {
    [
      ["period_start", data.period_start],
      ["period_end", data.period_end],
      ["total_liters", data.total_liters],
      ["total_milk_income", data.total_milk_income],
      ["net_payable", data.net_payable]
    ].forEach(([field, value]) => {
      if (value === null || value === undefined || value === "") {
        missing.add(field);
      }
    });
  }

  return Array.from(missing);
}

function getVisionFallbackDecision(data = {}) {
  const validation = data.validation || {};
  const warnings = [
    ...(Array.isArray(validation.warnings) ? validation.warnings : []),
    ...(Array.isArray(data.ai_warnings) ? data.ai_warnings : [])
  ];
  const errors = Array.isArray(validation.errors) ? validation.errors : [];
  const missing = getCriticalMissingFields(data);
  const inferredFinancialFields = Object.keys(data.inferred_fields || {}).filter((field) =>
    [
      "liters",
      "rate_per_liter",
      "total_amount",
      "total_liters",
      "total_income",
      "total_milk_income",
      "feed_deduction",
      "cattle_feed_deduction",
      "other_deduction",
      "other_deductions",
      "net_amount",
      "net_payable"
    ].includes(field)
  );
  const severeWarnings = warnings.filter((warning) =>
    /जुळत नाही|OCR चूक|Summary box|Daily rows|दैनिक बेरीज|लिटर × दर|दूध उत्पन्न - कपात|1000|10000|confidence 80/i.test(
      String(warning || "")
    )
  );
  const reasons = [
    ...errors,
    ...severeWarnings,
    ...missing.map((field) => `critical missing: ${field}`),
    ...inferredFinancialFields.map((field) => `financial field estimated: ${field}`)
  ].filter(Boolean);

  return {
    shouldFallback: Boolean(
      errors.length ||
        validation.suspicious ||
        severeWarnings.length ||
        missing.length ||
        inferredFinancialFields.length ||
        Number(data.confidence_score || 0) < 0.8
    ),
    reasons
  };
}

function extractionRiskScore(result) {
  const data = result?.data || {};
  const validation = data.validation || {};
  const decision = getVisionFallbackDecision(data);
  const confidence = Number(result?.confidence_score ?? data.confidence_score ?? 0);
  const warningsCount = Array.isArray(validation.warnings) ? validation.warnings.length : 0;
  const errorsCount = Array.isArray(validation.errors) ? validation.errors.length : 0;

  return (
    errorsCount * 20 +
    warningsCount * 5 +
    decision.reasons.length * 6 +
    (validation.suspicious ? 15 : 0) +
    Math.max(0, 0.95 - confidence) * 20
  );
}

function chooseBestExtraction(primaryResult, fallbackResult) {
  const primaryScore = extractionRiskScore(primaryResult);
  const fallbackScore = extractionRiskScore(fallbackResult);
  const fallbackConfidence = Number(fallbackResult?.confidence_score || 0);
  const primaryConfidence = Number(primaryResult?.confidence_score || 0);

  if (fallbackScore < primaryScore) {
    return { result: fallbackResult, selected: "fallback", primaryScore, fallbackScore };
  }

  if (fallbackScore === primaryScore && fallbackConfidence > primaryConfidence) {
    return { result: fallbackResult, selected: "fallback", primaryScore, fallbackScore };
  }

  return { result: primaryResult, selected: "primary", primaryScore, fallbackScore };
}

function gapFillingResponse(extractedData) {
  if (!extractedData?.slip_type) {
    return {};
  }

  const gapResult = fillSlipGaps(extractedData, extractedData.slip_type);
  const gapsFilled = gapResult.gapsFilled || [];
  const gapsDetected = gapResult.gapsDetected || [];

  if (!gapsDetected.length && !gapsFilled.length) {
    return {
      has_gaps: false,
      gaps_detected: 0,
      gaps_filled: []
    };
  }

  return {
    has_gaps: gapsDetected.length > 0 || gapsFilled.length > 0,
    gaps_detected: gapsDetected.length,
    gaps_filled: gapsFilled,
    originalData: extractedData,
    filledData: gapResult.filledData,
    gapAnalysis: gapResult.analysis,
    gap_message: gapsFilled.length
      ? `${gapsFilled.length} फील्ड AI ने भरली. कृपया तपासा.`
      : "काही माहिती अस्पष्ट आहे. कृपया हाताने तपासा."
  };
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { uploadId, force = false } = await request.json();

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
      !force &&
      (uploadRecord.extraction_status === "success" || uploadRecord.extraction_status === "saved") &&
      uploadRecord.ai_raw_response &&
      !cachedExtractionNeedsRefresh(uploadRecord)
    ) {
      let cachedUpload = uploadRecord;
      const mergedCachedData = await mergeSettlementRowsWithTrustedDailySlips({
        supabase,
        farmId,
        data: uploadRecord.ai_raw_response
      });

      if (hasJsonChanged(uploadRecord.ai_raw_response, mergedCachedData)) {
        const { data: refreshedUpload } = await supabase
          .from("slip_uploads")
          .update({
            ai_raw_response: mergedCachedData,
            updated_at: new Date().toISOString()
          })
          .eq("id", uploadId)
          .eq("farm_id", farmId)
          .select()
          .single();

        cachedUpload = refreshedUpload || {
          ...uploadRecord,
          ai_raw_response: mergedCachedData
        };
      }

      const gapResponse = gapFillingResponse(cachedUpload.ai_raw_response);
      return NextResponse.json({
        data: extractionResponse(cachedUpload, {
          ...gapResponse,
          message: gapResponse.gap_message || "डेटा आधीच वाचला आहे. कृपया तपासा आणि जतन करा.",
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
      .update({
        extraction_status: "processing",
        extraction_error: null,
        linked_milk_record_id: force ? null : uploadRecord.linked_milk_record_id,
        linked_settlement_id: force ? null : uploadRecord.linked_settlement_id,
        linked_dairy_slip_id: force ? null : uploadRecord.linked_dairy_slip_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", uploadId)
      .eq("farm_id", farmId);

    const { data: imageData, error: downloadError } = await supabase.storage
      .from(getStorageBucket())
      .download(storagePath);

    if (downloadError) {
      throw downloadError;
    }

    const imageBase64 = Buffer.from(await imageData.arrayBuffer()).toString("base64");
    const mediaType = getImageMediaType(storagePath);
    let ocr = {
      provider: "google_vision",
      rawText: "",
      confidence: 0
    };
    let result;
    let fallbackMeta = {
      attempted: false,
      used: false,
      reason: "",
      primaryScore: null,
      fallbackScore: null,
      error: null
    };

    try {
      ocr = await extractTextWithGoogleVision(imageBase64);
      result = await structureSlipTextWithGPT({
        rawText: ocr.rawText,
        ocr
      });
    } catch (extractError) {
      fallbackMeta = {
        ...fallbackMeta,
        attempted: true,
        reason: `Google Vision/Text OCR failed: ${extractError.message || "unknown error"}`
      };

      try {
        result = await structureSlipImageWithGPT({
          imageBase64,
          mediaType,
          fallbackReason: fallbackMeta.reason
        });
        fallbackMeta.used = true;
        ocr = {
          provider: "openai_vision_direct",
          rawText: "",
          confidence: result.confidence_score || 0
        };
      } catch (fallbackError) {
        await supabase
          .from("slip_uploads")
          .update({
            extraction_status: "failed",
            extraction_error:
              fallbackError.message ||
              extractError.message ||
              "OCR प्रक्रिया विफल झाली. कृपया फोटो पुन्हा upload करा.",
            updated_at: new Date().toISOString()
          })
          .eq("id", uploadId)
          .eq("farm_id", farmId);

        return NextResponse.json(
          {
            error:
              fallbackError.message ||
              extractError.message ||
              "OCR प्रक्रिया विफल झाली. कृपया फोटो सरळ, जवळून आणि प्रकाशात पुन्हा upload करा."
          },
          { status: 400 }
        );
      }
    }

    if (!result.success) {
      await supabase
        .from("slip_uploads")
        .update({
          extraction_status: "failed",
          extraction_error: result.error || "स्लिप वाचता आली नाही.",
          ai_model_used: result.model_used,
          ai_model_primary: result.model || null,
          ai_model_fallback: null,
          ai_tokens_used: result.tokensUsed || 0,
          ai_cost_estimate: 0,
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

    if (result.extractionMode !== "openai_vision_direct") {
      const fallbackDecision = getVisionFallbackDecision(result.data);

      if (fallbackDecision.shouldFallback) {
        fallbackMeta = {
          ...fallbackMeta,
          attempted: true,
          reason: fallbackDecision.reasons.slice(0, 6).join(" | ") || "Financial validation needs second pass"
        };

        try {
          const fallbackResult = await structureSlipImageWithGPT({
            imageBase64,
            mediaType,
            fallbackReason: fallbackMeta.reason
          });
          const choice = chooseBestExtraction(result, fallbackResult);

          fallbackMeta = {
            ...fallbackMeta,
            used: choice.selected === "fallback",
            primaryScore: choice.primaryScore,
            fallbackScore: choice.fallbackScore
          };

          if (choice.selected === "fallback") {
            result = fallbackResult;
            ocr = {
              ...ocr,
              provider: "google_vision+openai_vision_direct"
            };
          }
        } catch (fallbackError) {
          fallbackMeta = {
            ...fallbackMeta,
            error: fallbackError.message || "Direct GPT Vision fallback failed"
          };
        }
      }
    }

    const audit = await createOcrAuditLog(supabase, {
      farm_id: farmId,
      slip_upload_id: uploadId,
      image_url: uploadRecord.compressed_image_url,
      image_storage_path: uploadRecord.compressed_storage_path,
      ocr_provider: ocr.provider,
      ocr_text: ocr.rawText,
      ocr_confidence: ocr.confidence,
      ai_model: result.model,
      ai_json: result.aiJson,
      confidence: result.confidence_score,
      warnings: result.data?.ai_warnings || result.data?.validation?.warnings || [],
      validation: result.data?.validation || null
    });

    const baseExtractedData = {
      ...result.data,
      ocr_audit_log_id: audit?.id || null,
      fallback_attempted: fallbackMeta.attempted,
      direct_vision_used: Boolean(fallbackMeta.used || result.extractionMode === "openai_vision_direct"),
      direct_vision_reason: fallbackMeta.reason || null,
      direct_vision_error: fallbackMeta.error || null,
      extraction_mode: result.extractionMode || "google_vision_text"
    };
    const extractedData = await mergeSettlementRowsWithTrustedDailySlips({
      supabase,
      farmId,
      data: baseExtractedData
    });

    const { data: updatedUpload, error: updateError } = await supabase
      .from("slip_uploads")
      .update({
        extraction_status: "success",
        extraction_error: null,
        ai_model_used: result.model,
        ai_model_primary: fallbackMeta.used ? "google_vision_text" : result.model,
        ai_model_fallback: fallbackMeta.attempted ? result.model : null,
        ai_confidence: result.confidence_score,
        ai_raw_response: extractedData,
        ai_tokens_used: result.tokensUsed || 0,
        ai_cost_estimate: 0,
        retried: Boolean(result.retried || fallbackMeta.attempted),
        slip_type: extractedData.slip_type,
        updated_at: new Date().toISOString()
      })
      .eq("id", uploadId)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const gapResponse = gapFillingResponse(extractedData);
    const finalDecision = getVisionFallbackDecision(extractedData);
    const finalMessage = finalDecision.shouldFallback
      ? "AI ने दोनदा तपासले, तरी काही आकडे खात्रीशीर नाहीत. कृपया आकडे हाताने तपासा किंवा फोटो पुन्हा upload करा."
      : fallbackMeta.used
        ? "Google OCR मध्ये फरक दिसल्यामुळे direct GPT Vision वापरले. कृपया तपासा आणि जतन करा."
        : "डेटा वाचली गेले. कृपया तपासा आणि जतन करा.";

    return NextResponse.json({
      data: extractionResponse(updatedUpload, {
        ...gapResponse,
        retried: Boolean(result.retried || fallbackMeta.attempted),
        tokensUsed: result.tokensUsed || 0,
        cost_estimate: 0,
        model_used: result.model,
        ocrProvider: ocr.provider,
        ocrConfidence: ocr.confidence,
        ocrAuditLogId: audit?.id || null,
        fallbackAttempted: fallbackMeta.attempted,
        directVisionUsed: Boolean(fallbackMeta.used || result.extractionMode === "openai_vision_direct"),
        directVisionError: fallbackMeta.error,
        message: gapResponse.gap_message || finalMessage
      })
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
