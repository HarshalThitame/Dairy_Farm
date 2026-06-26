function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasNumber(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function hasPositiveNumber(value) {
  return hasNumber(value) && Number(value) > 0;
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function average(values) {
  const usable = values.filter((value) => hasPositiveNumber(value)).map(Number);

  if (!usable.length) {
    return null;
  }

  return roundMoney(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function addDays(dateString, days) {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeMissingFields(fields) {
  return Array.isArray(fields) ? fields.map((field) => String(field || "").trim()).filter(Boolean) : [];
}

function removeFilledFromMissing(missingFields, gapsFilled) {
  const filledNames = new Set(
    (gapsFilled || [])
      .map((gap) => String(gap.field || "").split("[")[0].split(".")[0])
      .filter(Boolean)
  );

  return normalizeMissingFields(missingFields).filter((field) => {
    const normalized = String(field).split("[")[0].split(".")[0];
    return !filledNames.has(normalized);
  });
}

function deductionTotal(data = {}) {
  return hasNumber(data.total_deductions) ? numberValue(data.total_deductions) : 0;
}

function printedSessionTotal(data = {}) {
  const morning = data.morning_total_liters ?? data.session_totals?.morning_liters ?? data.session_totals?.morning?.liters;
  const evening = data.evening_total_liters ?? data.session_totals?.evening_liters ?? data.session_totals?.evening?.liters;

  if (!hasNumber(morning) || !hasNumber(evening)) {
    return null;
  }

  return roundMoney(numberValue(morning) + numberValue(evening));
}

function pushGap(gaps, field, filledValue, method, extra = {}) {
  gaps.push({
    field,
    filled_value: filledValue,
    method,
    confidence: extra.confidence ?? 0.75,
    ...extra
  });
}

export function analyzeSlipForPatterns(extractedData = {}, slipType = extractedData.slip_type) {
  const analysis = {
    slip_type: slipType,
    available_fields: [],
    missing_fields: [],
    patterns: {},
    averages: {}
  };

  if (slipType === "settlement" && Array.isArray(extractedData.daily_entries)) {
    const entries = extractedData.daily_entries.filter(Boolean);
    const entriesWithMilk = entries.filter((entry) => hasPositiveNumber(entry.liters));

    analysis.averages = {
      liters: average(entriesWithMilk.map((entry) => entry.liters)),
      fat: average(entriesWithMilk.map((entry) => entry.fat_percent ?? entry.fat_percentage)),
      snf: average(entriesWithMilk.map((entry) => entry.snf_percent ?? entry.snf_percentage)),
      rate: average(entriesWithMilk.map((entry) => entry.rate_per_liter ?? entry.rate)),
      amount: average(entriesWithMilk.map((entry) => entry.amount ?? entry.total_amount))
    };
    analysis.available_fields = entriesWithMilk.length;

    entries.forEach((entry, index) => {
      if (!hasPositiveNumber(entry?.liters)) {
        analysis.missing_fields.push({ type: "daily_entry", index });
        return;
      }

      const missing = [];
      if (!hasPositiveNumber(entry.fat_percent ?? entry.fat_percentage)) missing.push("fat_percent");
      if (!hasPositiveNumber(entry.snf_percent ?? entry.snf_percentage)) missing.push("snf_percent");
      if (!hasPositiveNumber(entry.rate_per_liter ?? entry.rate)) missing.push("rate_per_liter");
      if (!hasPositiveNumber(entry.amount ?? entry.total_amount)) missing.push("amount");

      if (missing.length) {
        analysis.missing_fields.push({ type: "daily_entry_partial", index, missing });
      }
    });
  }

  if (slipType === "settlement" && !Array.isArray(extractedData.daily_entries)) {
    analysis.missing_fields.push("daily_entries");
  }

  if (slipType === "settlement") {
    if (!hasPositiveNumber(extractedData.total_milk_income)) analysis.missing_fields.push("total_milk_income");
    if (!hasNumber(extractedData.net_payable)) analysis.missing_fields.push("net_payable");
    if (!extractedData.period_end) analysis.missing_fields.push("period_end");
  }

  if (slipType === "daily") {
    if (!hasPositiveNumber(extractedData.total_amount) && !hasPositiveNumber(extractedData.slip_printed_amount)) {
      analysis.missing_fields.push("total_amount");
    }
  }

  return analysis;
}

export function detectGaps(extractedData = {}, slipType = extractedData.slip_type) {
  const gaps = [];

  if (slipType === "settlement") {
    if (!hasPositiveNumber(extractedData.total_milk_income)) gaps.push("total_milk_income");
    if (!hasNumber(extractedData.net_payable)) gaps.push("net_payable");
    if (!extractedData.period_end) gaps.push("period_end");

    if (Array.isArray(extractedData.daily_entries)) {
      const emptyEntries = extractedData.daily_entries.filter((entry) => !hasPositiveNumber(entry?.liters)).length;
      const partialEntries = extractedData.daily_entries.filter(
        (entry) =>
          hasPositiveNumber(entry?.liters) &&
          (!hasPositiveNumber(entry.fat_percent ?? entry.fat_percentage) ||
            !hasPositiveNumber(entry.snf_percent ?? entry.snf_percentage) ||
            !hasPositiveNumber(entry.rate_per_liter ?? entry.rate) ||
            !hasPositiveNumber(entry.amount ?? entry.total_amount))
      ).length;

      if (emptyEntries > 0) gaps.push(`missing_daily_entries_count_${emptyEntries}`);
      if (partialEntries > 0) gaps.push(`partial_daily_entries_count_${partialEntries}`);
    } else if (hasPositiveNumber(extractedData.total_milk_income)) {
      gaps.push("daily_entries");
    }
  }

  if (slipType === "daily" && !hasPositiveNumber(extractedData.total_amount) && hasPositiveNumber(extractedData.liters) && hasPositiveNumber(extractedData.rate_per_liter)) {
    gaps.push("total_amount");
  }

  return gaps;
}

export function calculateNewConfidence(original = {}, filled = {}) {
  const filledCount = filled.gaps_filled?.length || 0;
  const originalConfidence = Number(original.confidence_score || 0.5);

  if (!filledCount) {
    return originalConfidence;
  }

  const hasReconstructed = filled.gaps_filled?.some((gap) => gap.method === "distributed_from_totals");
  const boost = hasReconstructed ? Math.min(filledCount * 0.01, 0.05) : Math.min(filledCount * 0.03, 0.15);
  return Math.min(roundMoney(originalConfidence + boost), 0.98);
}

export function fillMissingDataWithRules(extractedData = {}, analysis = analyzeSlipForPatterns(extractedData), slipType = extractedData.slip_type) {
  const filledData = JSON.parse(JSON.stringify(extractedData || {}));
  const gapsFilled = [];
  const inferredFields = {};

  function remember(field, value, method, extra = {}) {
    pushGap(gapsFilled, field, value, method, extra);
    inferredFields[field] = {
      value,
      method,
      confidence: extra.confidence ?? 0.75,
      formula: extra.formula || null,
      note: extra.note || null,
      warning: extra.warning || null
    };
  }

  function isSourceFieldEstimated(field) {
    const estimatedFields = filledData.estimated_fields || {};
    const inferred = filledData.inferred_fields || {};
    return Boolean(estimatedFields[field] || inferred[field]);
  }

  function addWarningIfSourceEstimated(sourceField, targetField) {
    if (isSourceFieldEstimated(sourceField)) {
      const msg = targetField + " साठी " + sourceField + " वरून गणना, पण " + sourceField + " हा अंदाजित आहे.";
      filledData.warnings = [...(filledData.warnings || []), msg];
    }
  }

  if (slipType === "daily" && hasPositiveNumber(filledData.liters) && hasPositiveNumber(filledData.rate_per_liter) && !hasPositiveNumber(filledData.total_amount)) {
    addWarningIfSourceEstimated("liters", "total_amount");
    addWarningIfSourceEstimated("rate_per_liter", "total_amount");
    const amount = roundMoney(Number(filledData.liters) * Number(filledData.rate_per_liter));
    filledData.total_amount = amount;
    filledData.calculated_total_amount = amount;
    remember("total_amount", amount, "calculated", {
      confidence: 0.98,
      formula: `liters x rate = ${filledData.liters} x ${filledData.rate_per_liter}`
    });
  }

  if (slipType === "settlement" && !hasPositiveNumber(filledData.total_milk_income) && Array.isArray(filledData.daily_entries)) {
    const total = filledData.daily_entries.reduce((sum, entry) => sum + numberValue(entry?.amount ?? entry?.total_amount), 0);
    if (total > 0) {
      const estimatedAmounts = filledData.daily_entries.filter(e => isSourceFieldEstimated("amount"));
      if (estimatedAmounts.length > 0) {
        filledData.warnings = [...(filledData.warnings || []), "एकूण उत्पन्न अंदाजित दैनिक रकमांवरून मोजले. कृपया तपासा."];
      }
      filledData.total_milk_income = roundMoney(total);
      remember("total_milk_income", filledData.total_milk_income, "sum_daily_amounts", {
        confidence: 0.94,
        formula: "सर्व दैनिक रक्कमांची बेरीज"
      });
    }
  }

  if (slipType === "settlement" && !hasPositiveNumber(filledData.total_liters)) {
    const sessionTotal = printedSessionTotal(filledData);
    if (sessionTotal !== null) {
      filledData.total_liters = sessionTotal;
      filledData.session_totals = {
        ...(filledData.session_totals || {}),
        total_liters: sessionTotal
      };
      remember("total_liters", filledData.total_liters, "printed_session_totals", {
        confidence: 0.98,
        formula: "सकाळचे एकूण दूध + संध्याकाळचे एकूण दूध"
      });
    }
  }

  if (slipType === "settlement" && !hasPositiveNumber(filledData.total_liters) && Array.isArray(filledData.daily_entries)) {
    const totalLiters = filledData.daily_entries.reduce((sum, entry) => sum + numberValue(entry?.liters), 0);
    if (totalLiters > 0) {
      filledData.total_liters = roundMoney(totalLiters);
      filledData.daily_total_liters = filledData.daily_total_liters || filledData.total_liters;
      remember("total_liters", filledData.total_liters, "sum_daily_liters", {
        confidence: 0.65,
        formula: "सर्व दैनिक लिटरची बेरीज",
        warning: "फक्त printed सकाळ/संध्याकाळ totals किंवा summary total उपलब्ध नसतील तेव्हाच हा fallback वापरा."
      });
    }
  }

  if (slipType === "settlement" && !hasNumber(filledData.net_payable) && hasPositiveNumber(filledData.total_milk_income)) {
    addWarningIfSourceEstimated("total_milk_income", "net_payable");
    const totalDeduction = deductionTotal(filledData);
    if (!hasNumber(filledData.total_deductions) && totalDeduction >= 0) {
      filledData.total_deductions = roundMoney(totalDeduction);
    }
    filledData.net_payable = roundMoney(numberValue(filledData.total_milk_income) - totalDeduction);
    remember("net_payable", filledData.net_payable, "calculated", {
      confidence: 0.95,
      formula: "income - total_deductions"
    });
  }

  if (slipType === "settlement" && !hasNumber(filledData.round_figure) && hasPositiveNumber(filledData.net_payable)) {
    filledData.round_figure = roundMoney(Math.round(filledData.net_payable));
    remember("round_figure", filledData.round_figure, "rounded", {
      confidence: 0.9,
      formula: "round(net_payable)"
    });
  }

  if (slipType === "settlement" && filledData.period_start && !filledData.period_end) {
    const inferredPeriodEnd = addDays(filledData.period_start, 14);
    if (inferredPeriodEnd) {
      filledData.period_end = inferredPeriodEnd;
      remember("period_end", filledData.period_end, "inferred_15days", {
        confidence: 0.68,
        note: "१५ दिवसांच्या सेटलमेंट सायकलवरून"
      });
    }
  }

  filledData.original_missing_fields = normalizeMissingFields(extractedData.missing_fields);
  filledData.remaining_missing_fields = removeFilledFromMissing(extractedData.missing_fields, gapsFilled);
  filledData.missing_fields = filledData.remaining_missing_fields;
  filledData.gaps_filled = gapsFilled;
  filledData.inferred_fields = inferredFields;
  filledData.has_reconstructed = gapsFilled.some((gap) => gap.method === "distributed_from_totals");
  filledData.confidence_after_filling = calculateNewConfidence(extractedData, filledData);
  filledData.confidence_score = filledData.confidence_after_filling;

  return filledData;
}

export function fillSlipGaps(extractedData = {}, slipType = extractedData.slip_type) {
  const analysis = analyzeSlipForPatterns(extractedData, slipType);
  const filledData = fillMissingDataWithRules(extractedData, analysis, slipType);

  return {
    originalData: extractedData,
    filledData,
    gapsFilled: filledData.gaps_filled || [],
    gapsDetected: detectGaps(extractedData, slipType),
    analysis
  };
}
