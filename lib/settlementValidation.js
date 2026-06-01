function parseNormalizedNumber(value) {
  const raw = value && typeof value === "object" && "value" in value ? value.value : value;
  const normalized = String(raw ?? "")
    .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[,₹\s]/g, "")
    .replace(/[Oo]/g, "0");
  const number = Number(normalized || 0);
  return Number.isFinite(number) ? number : null;
}

function numberValue(value) {
  return parseNormalizedNumber(value) ?? 0;
}

function hasNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }
  return parseNormalizedNumber(value) !== null;
}

export function getSettlementDeductions(data = {}) {
  const deductions = data.deductions || {};
  const explicitTotalRaw = data.total_deductions ?? deductions.total_deductions;
  const explicitTotal = hasNumber(explicitTotalRaw) ? numberValue(explicitTotalRaw) : null;
  const feedRaw =
    data.cattle_feed_deduction ??
    data.feed_deduction ??
    deductions.feed_deduction ??
    deductions.cattle_feed_deduction;
  let otherDeductions = numberValue(data.other_deductions ?? data.other_deduction ?? deductions.other_deductions ?? deductions.other_deduction);
  const feedDeduction = hasNumber(feedRaw) && numberValue(feedRaw) > 0
    ? numberValue(feedRaw)
    : explicitTotal !== null
      ? explicitTotal
      : 0;
  const totalDeductions = feedDeduction + otherDeductions;

  return {
    feedDeduction,
    otherDeductions,
    totalDeductions
  };
}

export function calculateSettlementNetPayable(data = {}) {
  const income = numberValue(data.total_milk_income ?? data.total_income ?? data.milk_income);
  const deductions = getSettlementDeductions(data);
  const extractedNet = data.net_payable ?? data.final_payable;

  if (extractedNet !== null && extractedNet !== undefined && extractedNet !== "") {
    return numberValue(extractedNet);
  }

  return Number((income - deductions.totalDeductions).toFixed(2));
}

export function validateSettlementSlip(data = {}) {
  const errors = [];
  const warnings = [];
  const income = numberValue(data.total_milk_income ?? data.total_income ?? data.milk_income);
  const deductions = getSettlementDeductions(data);

  if (!data.period_start || !data.period_end) {
    errors.push("पीरियड सुरू आणि शेवट तारीख आवश्यक आहे.");
  } else if (String(data.period_end) < String(data.period_start)) {
    errors.push("पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा.");
  }

  if (income <= 0) {
    errors.push("उत्पन्न ० पेक्षा जास्त असणे आवश्यक आहे.");
  }

  if (deductions.totalDeductions > income && income > 0) {
    errors.push("कपात उत्पन्नापेक्षा जास्त नसावी.");
  }


  const dailyTotal = numberValue(data.daily_total_amount);
  const sectionTotal = numberValue(data.total_amount_section2 || data.total_milk_income);
  if (dailyTotal > 0 && sectionTotal > 0 && Math.abs(dailyTotal - sectionTotal) > 5) {
    warnings.push("दैनिक तक्त्याची रक्कम आणि सेटलमेंट रक्कम जुळत नाही. तपासा.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
