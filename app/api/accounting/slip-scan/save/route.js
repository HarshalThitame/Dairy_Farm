import { NextResponse } from "next/server";
import {
  DAIRY_SESSION_EVENING,
  DAIRY_SESSION_MORNING,
  matchSettlementToSlips,
  refreshSummaryForDate
} from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getTodayISODate } from "@/lib/marathiUtils";
import { recomputeMilkRecordFromDairySlips } from "@/lib/milkDairySync";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeMilkType(value) {
  const text = String(value || "").trim().toLowerCase();

  if (text === "buffalo" || text.includes("म्हैस")) {
    return "buffalo";
  }

  if (text === "cow" || text.includes("गाय") || !text) {
    return "cow";
  }

  return text;
}

function normalizeTime(value) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  const match = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);

  if (!match) {
    return text;
  }

  const [, hour, minute, second = "00"] = match;
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
}

function dairyMemberCode(data) {
  return cleanText(data.dairy_member_code || data.code_no || data.member_number || data.dairy_member_number);
}

function clrScore(data) {
  return numberOrNull(data.clr_score ?? data.clr_degree);
}

function money(value, fallback = 0) {
  const numberValue = numberOrNull(value);
  return numberValue === null ? fallback : numberValue;
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function calculateAmountVerification(data) {
  const liters = numberOrNull(data.liters);
  const rate = numberOrNull(data.rate_per_liter);
  const printedAmount = numberOrNull(
    data.slip_printed_amount ??
      data.printed_total_amount ??
      data.ocr_total_amount ??
      data.amount_verification?.printed_amount ??
      (data.calculated_total_amount === undefined ? data.total_amount : null)
  );
  const calculatedAmount =
    liters !== null && rate !== null ? roundMoney(Number(liters) * Number(rate)) : null;
  const difference =
    printedAmount !== null && calculatedAmount !== null
      ? roundMoney(printedAmount - calculatedAmount)
      : null;
  const status =
    printedAmount === null || calculatedAmount === null
      ? "not_checked"
      : Math.abs(difference) <= 0.01
        ? "matched"
        : "mismatch";

  return {
    printed_amount: printedAmount,
    calculated_amount: calculatedAmount,
    difference,
    status
  };
}

function withAmountNote(notes, verification) {
  const base = cleanText(notes);

  if (verification.status === "mismatch") {
    const warning = `रक्कम जुळत नाही: स्लिपवर ${verification.printed_amount}, हिशोबाने ${verification.calculated_amount}`;
    return [base, warning].filter(Boolean).join(" | ");
  }

  if (verification.status === "not_checked" && verification.calculated_amount !== null) {
    const warning = "स्लिपवरील रक्कम स्पष्ट वाचता आली नाही; लिटर x दर हिशोब वापरला.";
    return [base, warning].filter(Boolean).join(" | ");
  }

  return base;
}

function mergeData(extractedData, userEdits) {
  return {
    ...(extractedData || {}),
    ...(userEdits || {})
  };
}

function validateDaily(data) {
  if (!data.slip_date) return "तारीख आवश्यक आहे.";
  if (![DAIRY_SESSION_MORNING, DAIRY_SESSION_EVENING].includes(data.session)) return "सत्र निवडा.";
  if (!["cow", "buffalo"].includes(normalizeMilkType(data.milk_type))) return "दुधाचा प्रकार गाय किंवा म्हैस असावा.";
  if (numberOrNull(data.liters) === null || Number(data.liters) <= 0) return "दूध लिटर नीट भरा.";
  if (numberOrNull(data.rate_per_liter) === null || Number(data.rate_per_liter) <= 0) return "दर नीट भरा.";
  const clr = clrScore(data);
  if (clr !== null && (clr < 0 || clr > 100)) return "CLR स्कोर 0 ते 100 मध्ये असावा.";
  if (data.slip_time && !/^\d{1,2}:\d{1,2}(:\d{1,2})?$/.test(String(data.slip_time))) {
    return "वेळ HH:MM:SS format मध्ये असावी.";
  }
  return "";
}

function validateSettlement(data) {
  if (!data.period_start || !data.period_end) return "पीरियड सुरू आणि शेवट तारीख आवश्यक आहे.";
  if (data.period_end < data.period_start) return "पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा.";
  if (numberOrNull(data.total_milk_income) === null || Number(data.total_milk_income) <= 0) {
    return "एकूण उत्पन्न नीट भरा.";
  }
  return "";
}

async function getUpload(supabase, farmId, uploadId) {
  const { data, error } = await supabase
    .from("slip_uploads")
    .select("*")
    .eq("id", uploadId)
    .eq("farm_id", farmId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getMilkRecordByDate(supabase, farmId, date) {
  const { data, error } = await supabase
    .from("milk_records")
    .select("*")
    .eq("farm_id", farmId)
    .eq("date", date)
    .is("cow_id", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const body = await request.json();
    const { uploadId, slip_type: requestedSlipType, extractedData, userEdits } = body;

    if (!uploadId) {
      return NextResponse.json({ error: "स्लिप फोटो ID आवश्यक आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const upload = await getUpload(supabase, farmId, uploadId);

    if (!upload) {
      return NextResponse.json({ error: "स्लिप रेकॉर्ड सापडली नाही." }, { status: 404 });
    }

    const slipType = requestedSlipType || userEdits?.slip_type || extractedData?.slip_type || upload.slip_type;
    const data = mergeData(upload.ai_raw_response || extractedData, userEdits);
    const confidence = numberOrNull(upload.ai_confidence ?? data.confidence_score);
    const modelUsed = upload.ai_model_used || data.ai_model_used || null;
    const timestamp = new Date().toISOString();

    if (slipType === "daily") {
      const validationError = validateDaily(data);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const memberCode = dairyMemberCode(data);
      const slipTime = normalizeTime(data.slip_time);
      const milkType = normalizeMilkType(data.milk_type);
      const normalizedClrScore = clrScore(data);
      const amountVerification = calculateAmountVerification(data);
      const aiRawData = {
        ...data,
        slip_printed_amount: amountVerification.printed_amount,
        calculated_total_amount: amountVerification.calculated_amount,
        total_amount: amountVerification.calculated_amount ?? amountVerification.printed_amount,
        amount_difference: amountVerification.difference,
        amount_matches: amountVerification.status === "matched",
        amount_verification: amountVerification
      };
      const slipPayload = {
        farm_id: farmId,
        slip_date: data.slip_date,
        slip_time: slipTime,
        session: data.session,
        milk_type: milkType,
        dairy_name: cleanText(data.dairy_name),
        dairy_member_number: memberCode,
        dairy_member_code: memberCode,
        liters: money(data.liters),
        fat_percentage: numberOrNull(data.fat_percentage),
        snf_percentage: numberOrNull(data.snf_percentage),
        clr_degree: normalizedClrScore,
        clr_score: normalizedClrScore,
        rate_per_liter: money(data.rate_per_liter),
        notes: withAmountNote(data.notes, amountVerification),
        slip_image_url: upload.compressed_image_url,
        ai_extracted: true,
        ai_confidence: confidence,
        ai_model_used: modelUsed,
        ai_raw_data: aiRawData,
        ocr_timestamp: timestamp,
        updated_at: timestamp
      };

      const { data: slip, error } = await supabase
        .from("dairy_slips")
        .upsert(slipPayload, { onConflict: "farm_id,slip_date,session" })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await recomputeMilkRecordFromDairySlips(supabase, farmId, slip.slip_date);
      const milkRecord = await getMilkRecordByDate(supabase, farmId, slip.slip_date);

      if (milkRecord?.id) {
        const { error: milkError } = await supabase
          .from("milk_records")
          .update({
            slip_time: slipTime,
            milk_type: milkType,
            dairy_member_code: memberCode,
            clr_score: normalizedClrScore,
            ai_extracted: true,
            ai_confidence: confidence,
            ai_model_used: modelUsed,
            ai_raw_data: aiRawData,
            slip_image_url: upload.compressed_image_url,
            ocr_timestamp: timestamp
          })
          .eq("id", milkRecord.id)
          .eq("farm_id", farmId);

        if (milkError) {
          throw milkError;
        }
      }

      const summary = await refreshSummaryForDate(supabase, farmId, slip.slip_date);
      await supabase
        .from("slip_uploads")
        .update({
          extraction_status: "saved",
          linked_milk_record_id: milkRecord?.id || null,
          linked_dairy_slip_id: slip.id,
          slip_type: "daily",
          updated_at: timestamp
        })
        .eq("id", uploadId)
        .eq("farm_id", farmId);

      return NextResponse.json({
        data: {
          success: true,
          recordType: "daily",
          recordId: milkRecord?.id || slip.id,
          dairySlipId: slip.id,
          milkRecord,
          slip,
          summary,
          amountVerification,
          message: "दूध स्लिप जतन झाली."
        }
      });
    }

    if (slipType === "settlement") {
      const validationError = validateSettlement(data);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const settlementPayload = {
        farm_id: farmId,
        settlement_date: data.settlement_date || getTodayISODate(),
        period_start: data.period_start,
        period_end: data.period_end,
        dairy_name: cleanText(data.dairy_name),
        dairy_member_number: cleanText(data.member_number || data.dairy_member_number || data.dairy_member_code),
        total_liters: numberOrNull(data.total_liters),
        total_milk_income: money(data.total_milk_income),
        cattle_feed_deduction: money(data.cattle_feed_deduction),
        other_deductions: money(data.other_deductions),
        payment_received: Boolean(data.payment_received),
        payment_received_date: data.payment_received ? data.payment_received_date || data.settlement_date || getTodayISODate() : null,
        payment_received_amount: data.payment_received ? numberOrNull(data.payment_received_amount) : null,
        settlement_notes: cleanText(data.settlement_notes || data.notes),
        settlement_image_url: upload.compressed_image_url,
        ai_extracted: true,
        ai_confidence: confidence,
        ai_model_used: modelUsed,
        ai_raw_data: data,
        ocr_timestamp: timestamp,
        updated_at: timestamp
      };

      const { data: settlement, error } = await supabase
        .from("dairy_settlements")
        .upsert(settlementPayload, { onConflict: "farm_id,period_start,period_end" })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const matched = await matchSettlementToSlips(supabase, farmId, settlement);
      const summary = await refreshSummaryForDate(supabase, farmId, settlement.settlement_date);
      await supabase
        .from("slip_uploads")
        .update({
          extraction_status: "saved",
          linked_settlement_id: matched.settlement.id,
          slip_type: "settlement",
          updated_at: timestamp
        })
        .eq("id", uploadId)
        .eq("farm_id", farmId);

      return NextResponse.json({
        data: {
          success: true,
          recordType: "settlement",
          recordId: matched.settlement.id,
          settlement: matched.settlement,
          reconciliation: matched.reconciliation,
          summary,
          message: "सेटलमेंट स्लिप जतन झाली."
        }
      });
    }

    return NextResponse.json({ error: "स्लिपचा प्रकार निवडा." }, { status: 400 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
