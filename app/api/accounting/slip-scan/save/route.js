import { NextResponse } from "next/server";
import {
  DAIRY_SESSION_EVENING,
  DAIRY_SESSION_MORNING,
  matchSettlementToSlips,
  refreshSettlementSummaries,
  refreshSummaryForDate
} from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { checkGoalAchievementsForFarm } from "@/lib/goalTracking";
import { getTodayISODate } from "@/lib/marathiUtils";
import { recomputeMilkRecordFromDairySlips } from "@/lib/milkDairySync";
import { calculateSettlementNetPayable, getSettlementDeductions } from "@/lib/settlementValidation";
import { mergeSettlementRowsWithTrustedDailySlips } from "@/lib/settlementDailySlipMerge";
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
  const normalized = String(value)
    .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[,₹\s]/g, "")
    .replace(/[Oo]/g, "0");
  const numberValue = Number(normalized);
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

function normalizeSessionName(value) {
  const text = String(value || "").trim().toLowerCase();

  if (
    value === DAIRY_SESSION_EVENING ||
    text.includes("evening") ||
    text.includes("sandh") ||
    text.includes("संध्या") ||
    text.includes("सायं")
  ) {
    return DAIRY_SESSION_EVENING;
  }

  if (
    value === DAIRY_SESSION_MORNING ||
    text.includes("morning") ||
    text.includes("sakal") ||
    text.includes("सकाळ")
  ) {
    return DAIRY_SESSION_MORNING;
  }

  return null;
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

function ocrAuditFields(data = {}) {
  return {
    ocr_text: cleanText(data.ocr_text),
    ocr_provider: cleanText(data.ocr_provider),
    ocr_audit_log_id: cleanText(data.ocr_audit_log_id)
  };
}

function withoutOcrAuditFields(payload) {
  const nextPayload = { ...payload };
  delete nextPayload.ocr_text;
  delete nextPayload.ocr_provider;
  delete nextPayload.ocr_audit_log_id;
  return nextPayload;
}

async function upsertSingleWithOcrFallback(supabase, table, payload, options) {
  let result = await supabase.from(table).upsert(payload, options).select().single();

  if (
    result.error &&
    (result.error.code === "42703" || /ocr_text|ocr_provider|ocr_audit_log_id/i.test(result.error.message || ""))
  ) {
    result = await supabase.from(table).upsert(withoutOcrAuditFields(payload), options).select().single();
  }

  return result;
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

function mergeData(...sources) {
  return sources.reduce(
    (merged, source) => ({
      ...merged,
      ...(source || {})
    }),
    {}
  );
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

function getSettlementTotalLiters(data) {
  const morningTotal = numberOrNull(data.morning_total_liters ?? data.session_totals?.morning_liters ?? data.session_totals?.morning?.liters);
  const eveningTotal = numberOrNull(data.evening_total_liters ?? data.session_totals?.evening_liters ?? data.session_totals?.evening?.liters);

  if (morningTotal !== null && eveningTotal !== null) {
    return roundMoney(Number(morningTotal) + Number(eveningTotal));
  }

  const directTotal = numberOrNull(data.total_liters ?? data.total_liters_section2);

  if (directTotal !== null) {
    return directTotal;
  }

  return numberOrNull(data.daily_total_liters);
}

function settlementSessionRows(data = {}) {
  const rows = [];

  if (Array.isArray(data.session_entries)) {
    rows.push(...data.session_entries);
  }

  if (Array.isArray(data.daily_entries)) {
    data.daily_entries.forEach((entry) => {
      if (entry?.morning) {
        rows.push({ ...entry.morning, date: entry.date, session: DAIRY_SESSION_MORNING });
      }
      if (entry?.evening) {
        rows.push({ ...entry.evening, date: entry.date, session: DAIRY_SESSION_EVENING });
      }
      if (!entry?.morning && !entry?.evening && entry?.session) {
        rows.push(entry);
      }
    });
  }

  const seen = new Set();
  return rows
    .map((row) => ({
      date: cleanText(row?.date || row?.slip_date),
      session: normalizeSessionName(row?.session),
      liters: numberOrNull(row?.liters ?? row?.litre),
      fat_percentage: numberOrNull(row?.fat_percentage ?? row?.fat_percent ?? row?.fat),
      snf_percentage: numberOrNull(row?.snf_percentage ?? row?.snf_percent ?? row?.snf),
      rate_per_liter: numberOrNull(row?.rate_per_liter ?? row?.rate),
      amount: numberOrNull(row?.amount ?? row?.total_amount),
      source: cleanText(row?.source) || "settlement_ocr",
      source_label: cleanText(row?.source_label),
      trusted_daily_slip_id: cleanText(row?.trusted_daily_slip_id),
      missing_reason: cleanText(row?.missing_reason)
    }))
    .filter((row) => row.date && row.session && row.liters !== null && row.liters > 0 && row.rate_per_liter !== null && row.rate_per_liter > 0)
    .filter((row) => {
      const key = `${row.date}|${row.session}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function hasUnsafeSettlementRows(data = {}) {
  const rows = settlementSyncCandidateRows(data);

  if (!rows.length) {
    return false;
  }

  if (rows.some((row) => Number(row.liters) > 500)) {
    return true;
  }

  const signatures = new Map();
  rows.forEach((row) => {
    const signature = [
      Number(row.liters).toFixed(2),
      row.fat_percentage === null ? "-" : Number(row.fat_percentage).toFixed(2),
      row.snf_percentage === null ? "-" : Number(row.snf_percentage).toFixed(2),
      Number(row.rate_per_liter).toFixed(2),
      row.amount === null ? "-" : Number(row.amount).toFixed(2)
    ].join("|");
    signatures.set(signature, (signatures.get(signature) || 0) + 1);
  });

  return Array.from(signatures.values()).some((count) => count >= 5);
}

function settlementSyncCandidateRows(data = {}) {
  return settlementSessionRows(data).filter((row) => row.source !== "daily_slip");
}

function shouldSkipSettlementRowSync(data = {}) {
  const rows = settlementSyncCandidateRows(data);

  if (!rows.length) {
    return false;
  }

  const validation = data.settlement_validation || {};
  return Boolean(
    data.ocr_requires_manual_review ||
      validation.requires_manual_review ||
      validation.errors?.length ||
      validation.warnings?.length ||
      hasUnsafeSettlementRows(data)
  );
}

function readRawData(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function isSettlementGeneratedSlip(row = {}) {
  const rawData = readRawData(row.ai_raw_data);
  const notes = String(row.notes || "");

  return (
    rawData.source === "settlement_slip" ||
    notes.includes("१५ दिवसांच्या सेटलमेंट") ||
    notes.includes("15 दिवसांच्या सेटलमेंट")
  );
}

async function upsertSettlementRowsAsDairySlips({
  supabase,
  farmId,
  data,
  upload,
  confidence,
  modelUsed,
  timestamp
}) {
  if (shouldSkipSettlementRowSync(data)) {
    return [];
  }

  const rows = settlementSyncCandidateRows(data);

  if (!rows.length) {
    return [];
  }

  const dates = rows.map((row) => row.date).sort();
  const { data: existingRows, error: existingError } = await supabase
    .from("dairy_slips")
    .select("id, slip_date, session, notes, ai_raw_data")
    .eq("farm_id", farmId)
    .gte("slip_date", dates[0])
    .lte("slip_date", dates[dates.length - 1]);

  if (existingError) {
    throw existingError;
  }

  const existingByKey = new Map((existingRows || []).map((row) => [`${row.slip_date}|${row.session}`, row]));

  const memberCode = cleanText(data.farmer_code || data.member_number || data.dairy_member_number || data.dairy_member_code);
  const milkType = normalizeMilkType(data.animal_type || data.milk_type);
  const payloads = rows
    .filter((row) => {
      const existing = existingByKey.get(`${row.date}|${row.session}`);
      return !existing || isSettlementGeneratedSlip(existing);
    })
    .map((row) => {
      const existing = existingByKey.get(`${row.date}|${row.session}`);

      return {
        ...(existing?.id ? { id: existing.id } : {}),
        farm_id: farmId,
        slip_date: row.date,
        session: row.session,
        milk_type: milkType,
        dairy_name: cleanText(data.dairy_name),
        dairy_member_number: memberCode,
        dairy_member_code: memberCode,
        liters: money(row.liters),
        fat_percentage: row.fat_percentage,
        snf_percentage: row.snf_percentage,
        rate_per_liter: money(row.rate_per_liter),
        notes: "१५ दिवसांच्या सेटलमेंट स्लिपवरून आपोआप नोंद",
        slip_image_url: upload.compressed_image_url,
        ai_extracted: true,
        ai_confidence: confidence,
        ai_model_used: modelUsed,
        ai_raw_data: {
          source: "settlement_slip",
          settlement_period_start: data.period_start,
          settlement_period_end: data.period_end,
          row
        },
        ocr_timestamp: timestamp,
        updated_at: timestamp
      };
    });

  if (!payloads.length) {
    return [];
  }

  const { data: slips, error } = await supabase
    .from("dairy_slips")
    .upsert(payloads, { onConflict: "farm_id,slip_date,session" })
    .select();

  if (error) {
    throw error;
  }

  const uniqueDates = Array.from(new Set(rows.map((row) => row.date)));
  for (const date of uniqueDates) {
    await recomputeMilkRecordFromDairySlips(supabase, farmId, date);
  }

  return slips || [];
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
    const { farmId, userId } = await verifyFarmAccess(request);
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
    let data = mergeData(upload.ai_raw_response, extractedData, userEdits);
    const confidence = numberOrNull(data.confidence_after_filling ?? data.confidence_score ?? upload.ai_confidence);
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
        ...ocrAuditFields(data),
        updated_at: timestamp
      };

      const { data: slip, error } = await upsertSingleWithOcrFallback(
        supabase,
        "dairy_slips",
        slipPayload,
        { onConflict: "farm_id,slip_date,session" }
      );

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
      await checkGoalAchievementsForFarm(supabase, farmId, userId);
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
      data = await mergeSettlementRowsWithTrustedDailySlips({ supabase, farmId, data });

      const validationError = validateSettlement(data);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const deductions = getSettlementDeductions(data);
      const settlementNetPayable = calculateSettlementNetPayable(data);
      const morningTotalLiters = numberOrNull(data.morning_total_liters ?? data.session_totals?.morning_liters ?? data.session_totals?.morning?.liters);
      const eveningTotalLiters = numberOrNull(data.evening_total_liters ?? data.session_totals?.evening_liters ?? data.session_totals?.evening?.liters);
      const combinedSessionTotal =
        morningTotalLiters !== null && eveningTotalLiters !== null
          ? roundMoney(Number(morningTotalLiters) + Number(eveningTotalLiters))
          : null;
      const normalizedSettlementRawData = {
        ...data,
        total_liters: getSettlementTotalLiters(data),
        morning_total_liters: morningTotalLiters,
        evening_total_liters: eveningTotalLiters,
        session_totals: {
          ...(data.session_totals || {}),
          morning_liters: morningTotalLiters,
          evening_liters: eveningTotalLiters,
          total_liters: combinedSessionTotal
        },
        total_milk_income: money(data.total_milk_income),
        cattle_feed_deduction: deductions.feedDeduction,
        other_deductions: deductions.otherDeductions,
        total_deductions: deductions.totalDeductions,
        net_payable: settlementNetPayable,
        deductions: {
          feed_deduction: deductions.feedDeduction,
            other_deductions: deductions.otherDeductions,
          total_deductions: deductions.totalDeductions
        }
      };
      const settlementPayload = {
        farm_id: farmId,
        settlement_date: data.settlement_date || data.period_end || getTodayISODate(),
        period_start: data.period_start,
        period_end: data.period_end,
        dairy_name: cleanText(data.dairy_name),
        dairy_member_number: cleanText(data.farmer_code || data.member_number || data.dairy_member_number || data.dairy_member_code),
        total_liters: getSettlementTotalLiters(data),
        total_milk_income: money(data.total_milk_income),
        cattle_feed_deduction: deductions.feedDeduction,
        other_deductions: deductions.otherDeductions,
        payment_received: Boolean(data.payment_received),
        payment_received_date: data.payment_received ? data.payment_received_date || data.settlement_date || data.period_end || getTodayISODate() : null,
        payment_received_amount: data.payment_received ? numberOrNull(data.payment_received_amount) : null,
        settlement_notes: cleanText(data.settlement_notes || data.notes),
        settlement_image_url: upload.compressed_image_url,
        ai_extracted: true,
        ai_confidence: confidence,
        ai_model_used: modelUsed,
        ai_raw_data: normalizedSettlementRawData,
        ocr_timestamp: timestamp,
        ...ocrAuditFields(data),
        updated_at: timestamp
      };

      const { data: settlement, error } = await upsertSingleWithOcrFallback(
        supabase,
        "dairy_settlements",
        settlementPayload,
        { onConflict: "farm_id,period_start,period_end" }
      );

      if (error) {
        throw error;
      }

      const rowSyncSkipped = shouldSkipSettlementRowSync(data);
      const savedSessionSlips = await upsertSettlementRowsAsDairySlips({
        supabase,
        farmId,
        data,
        upload,
        confidence,
        modelUsed,
        timestamp
      });
      const matched = await matchSettlementToSlips(supabase, farmId, settlement);
      const summary = await refreshSettlementSummaries(supabase, farmId, settlement);
      await checkGoalAchievementsForFarm(supabase, farmId, userId);
      await supabase
        .from("slip_uploads")
        .update({
          extraction_status: "saved",
          linked_settlement_id: matched.settlement.id,
          ai_raw_response: normalizedSettlementRawData,
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
          savedSessionSlipsCount: savedSessionSlips.length,
          rowSyncSkipped,
          dailySlipMerge: data.daily_slip_merge || null,
          reconciliation: matched.reconciliation,
          summary,
          message: "सेटलमेंट स्लिप जतन झाली.",
          rowSyncMessage: rowSyncSkipped
            ? "AI rows संशयास्पद असल्यामुळे सकाळ/संध्याकाळ दूध नोंदी auto-save केल्या नाहीत."
            : savedSessionSlips.length
              ? "ज्या तारखेला daily slip नव्हती त्या नोंदी settlement मधून sync झाल्या."
              : "Existing daily slip नोंदी सुरक्षित ठेवल्या. कोणतीही जुनी daily slip overwrite केली नाही."
        }
      });
    }

    return NextResponse.json({ error: "स्लिपचा प्रकार निवडा." }, { status: 400 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
