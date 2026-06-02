import { DAIRY_SESSION_EVENING, DAIRY_SESSION_MORNING, roundMoney } from "@/lib/accountingUtils";

const SESSION_ORDER = [DAIRY_SESSION_MORNING, DAIRY_SESSION_EVENING];

function readValue(value) {
  if (value && typeof value === "object" && "value" in value) {
    return value.value;
  }
  return value;
}

function cleanText(value) {
  const text = String(readValue(value) ?? "").trim();
  return text || null;
}

function numberOrNull(value) {
  const raw = readValue(value);
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  const number = Number(
    String(raw)
      .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[,₹\s]/g, "")
      .replace(/[Oo]/g, "0")
  );

  return Number.isFinite(number) ? number : null;
}

function normalizeSession(value, fallback = null) {
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

  return fallback;
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function addDaysIso(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inclusiveDateRange(startDate, endDate) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate) || endDate < startDate) {
    return [];
  }

  const dates = [];
  let current = startDate;

  while (current <= endDate && dates.length < 40) {
    dates.push(current);
    current = addDaysIso(current, 1);
  }

  return dates;
}

function rowKey(date, session) {
  return `${date}|${session}`;
}

function hasAnyReadableValue(row = {}) {
  return [
    row.liters,
    row.fat_percentage,
    row.fat_percent,
    row.snf_percentage,
    row.snf_percent,
    row.rate_per_liter,
    row.rate,
    row.amount,
    row.total_amount
  ].some((value) => value !== null && value !== undefined && value !== "");
}

function normalizeSettlementRow(row = {}, defaults = {}) {
  const session = normalizeSession(row.session, defaults.session);
  const date = cleanText(row.date || row.slip_date || defaults.date);
  const liters = numberOrNull(row.liters ?? row.litre ?? row.total_liters);
  const fat = numberOrNull(row.fat_percentage ?? row.fat_percent ?? row.fat);
  const snf = numberOrNull(row.snf_percentage ?? row.snf_percent ?? row.snf);
  const rate = numberOrNull(row.rate_per_liter ?? row.rate);
  const amount = numberOrNull(row.amount ?? row.total_amount);

  if (!date || !session) {
    return null;
  }

  return {
    ...row,
    date,
    slip_date: date,
    session,
    liters,
    fat_percentage: fat,
    fat_percent: fat,
    snf_percentage: snf,
    snf_percent: snf,
    rate_per_liter: rate,
    amount,
    total_amount: amount,
    source: row.source || "settlement_ocr",
    source_label: row.source_label || "सेटलमेंट OCR वरून"
  };
}

function collectSettlementRows(data = {}) {
  const rows = [];

  if (Array.isArray(data.session_entries)) {
    data.session_entries.forEach((row) => {
      const normalized = normalizeSettlementRow(row);
      if (normalized) rows.push(normalized);
    });
  }

  if (Array.isArray(data.daily_entries)) {
    data.daily_entries.forEach((entry) => {
      if (entry?.morning) {
        const normalized = normalizeSettlementRow(entry.morning, {
          date: entry.date,
          session: DAIRY_SESSION_MORNING
        });
        if (normalized) rows.push(normalized);
      }

      if (entry?.evening) {
        const normalized = normalizeSettlementRow(entry.evening, {
          date: entry.date,
          session: DAIRY_SESSION_EVENING
        });
        if (normalized) rows.push(normalized);
      }

      if (!entry?.morning && !entry?.evening && entry?.session) {
        const normalized = normalizeSettlementRow(entry, { date: entry.date });
        if (normalized) rows.push(normalized);
      }
    });
  }

  return rows;
}

function rowQuality(row = {}) {
  return [
    row.liters,
    row.fat_percentage,
    row.snf_percentage,
    row.rate_per_liter,
    row.amount
  ].filter((value) => value !== null && value !== undefined && value !== "").length;
}

function mapBestRows(rows = []) {
  const map = new Map();

  rows.forEach((row) => {
    const key = rowKey(row.date, row.session);
    const existing = map.get(key);

    if (!existing || rowQuality(row) > rowQuality(existing)) {
      map.set(key, row);
    }
  });

  return map;
}

function rowFromDailySlip(slip, originalOcrRow = null) {
  const liters = numberOrNull(slip.liters);
  const rate = numberOrNull(slip.rate_per_liter);
  const amount = numberOrNull(slip.total_amount) ?? (liters !== null && rate !== null ? roundMoney(liters * rate) : null);
  const fat = numberOrNull(slip.fat_percentage);
  const snf = numberOrNull(slip.snf_percentage);

  return {
    date: slip.slip_date,
    slip_date: slip.slip_date,
    session: normalizeSession(slip.session, DAIRY_SESSION_MORNING),
    liters,
    fat_percentage: fat,
    fat_percent: fat,
    snf_percentage: snf,
    snf_percent: snf,
    rate_per_liter: rate,
    amount,
    total_amount: amount,
    source: "daily_slip",
    source_label: "दैनिक स्लिपवरून",
    trusted_daily_slip_id: slip.id,
    original_ocr_row: originalOcrRow ? compactRow(originalOcrRow) : null,
    missing_reason: null
  };
}

function compactRow(row = {}) {
  return {
    date: row.date,
    session: row.session,
    liters: row.liters,
    fat_percentage: row.fat_percentage,
    snf_percentage: row.snf_percentage,
    rate_per_liter: row.rate_per_liter,
    amount: row.amount,
    source: row.source || "settlement_ocr"
  };
}

function missingRow(date, session) {
  return {
    date,
    slip_date: date,
    session,
    liters: null,
    fat_percentage: null,
    fat_percent: null,
    snf_percentage: null,
    snf_percent: null,
    rate_per_liter: null,
    amount: null,
    total_amount: null,
    source: "missing",
    source_label: "नोंद नाही",
    missing_reason: "या तारखेची daily slip नाही आणि settlement OCR ला ही row स्पष्ट वाचता आली नाही."
  };
}

function buildDailyEntries(dates, rowMap) {
  return dates.map((date) => {
    const morning = rowMap.get(rowKey(date, DAIRY_SESSION_MORNING)) || missingRow(date, DAIRY_SESSION_MORNING);
    const evening = rowMap.get(rowKey(date, DAIRY_SESSION_EVENING)) || missingRow(date, DAIRY_SESSION_EVENING);
    const totalLiters = roundMoney((numberOrNull(morning.liters) || 0) + (numberOrNull(evening.liters) || 0));
    const totalAmount = roundMoney((numberOrNull(morning.amount) || 0) + (numberOrNull(evening.amount) || 0));

    return {
      date,
      morning,
      evening,
      total_liters: totalLiters,
      total_amount: totalAmount,
      source_summary: [morning.source, evening.source].filter(Boolean).join("+")
    };
  });
}

function positiveRows(rows = []) {
  return rows.filter((row) => {
    const liters = numberOrNull(row.liters);
    return liters !== null && liters > 0;
  });
}

async function fetchDailySlips(supabase, farmId, startDate, endDate) {
  const { data, error } = await supabase
    .from("dairy_slips")
    .select(
      "id,slip_date,session,liters,fat_percentage,snf_percentage,rate_per_liter,total_amount,dairy_name,dairy_member_number,slip_image_url"
    )
    .eq("farm_id", farmId)
    .gte("slip_date", startDate)
    .lte("slip_date", endDate);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function mergeSettlementRowsWithTrustedDailySlips({ supabase, farmId, data }) {
  if (!data || data.slip_type !== "settlement" || !supabase || !farmId || !data.period_start || !data.period_end) {
    return data;
  }

  const expectedDates = inclusiveDateRange(data.period_start, data.period_end);
  if (!expectedDates.length) {
    return data;
  }

  const ocrRows = collectSettlementRows(data);
  const ocrMap = mapBestRows(ocrRows);
  const trustedSlips = await fetchDailySlips(supabase, farmId, data.period_start, data.period_end);
  const trustedMap = new Map(
    trustedSlips
      .map((slip) => ({
        ...slip,
        session: normalizeSession(slip.session)
      }))
      .filter((slip) => slip.slip_date && slip.session)
      .map((slip) => [rowKey(slip.slip_date, slip.session), slip])
  );
  const mergedMap = new Map();
  const missingRows = [];
  let replacedRows = 0;

  expectedDates.forEach((date) => {
    SESSION_ORDER.forEach((session) => {
      const key = rowKey(date, session);
      const trusted = trustedMap.get(key);
      const ocr = ocrMap.get(key) || null;

      if (trusted) {
        if (ocr && hasAnyReadableValue(ocr)) {
          replacedRows += 1;
        }
        mergedMap.set(key, rowFromDailySlip(trusted, ocr));
        return;
      }

      if (ocr) {
        mergedMap.set(key, {
          ...ocr,
          source: ocr.source || "settlement_ocr",
          source_label: ocr.source_label || "सेटलमेंट OCR वरून"
        });
        return;
      }

      const missing = missingRow(date, session);
      missingRows.push({ date, session, reason: missing.missing_reason });
      mergedMap.set(key, missing);
    });
  });

  const sessionEntries = expectedDates.flatMap((date) =>
    SESSION_ORDER.map((session) => mergedMap.get(rowKey(date, session))).filter(Boolean)
  );
  const dailyEntries = buildDailyEntries(expectedDates, mergedMap);
  const readableRows = positiveRows(sessionEntries);
  const dailyTotalLiters = roundMoney(readableRows.reduce((sum, row) => sum + (numberOrNull(row.liters) || 0), 0));
  const dailyTotalAmount = roundMoney(readableRows.reduce((sum, row) => sum + (numberOrNull(row.amount) || 0), 0));
  const trustedDailyRows = readableRows.filter((row) => row.source === "daily_slip").length;
  const settlementOcrRows = readableRows.filter((row) => row.source === "settlement_ocr").length;

  return {
    ...data,
    session_entries: sessionEntries,
    daily_entries: dailyEntries,
    daily_total_liters: dailyTotalLiters,
    daily_total_amount: dailyTotalAmount,
    daily_slip_merge: {
      applied: true,
      trusted_daily_slip_rows: trustedDailyRows,
      settlement_ocr_rows: settlementOcrRows,
      replaced_ocr_rows: replacedRows,
      missing_rows: missingRows,
      expected_days: expectedDates.length,
      rule: "Date/session daily slip exists असेल तर तो row-level source आहे. Final accounting settlement summary totals वरूनच राहते."
    }
  };
}
