function numberValue(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export function getSettlementDeductions(data = {}) {
  const deductions = data.deductions || {};
  const feedDeduction = numberValue(
    data.cattle_feed_deduction ??
      data.feed_deduction ??
      deductions.feed_deduction ??
      deductions.cattle_feed_deduction
  );
  const anamatCut = numberValue(
    data.anamat_cut ??
      data.anamat_deduction ??
      deductions.anamat_cut ??
      deductions.anamat_deduction
  );
  let otherDeductions = numberValue(data.other_deductions ?? deductions.other_deductions);
  const explicitTotal =
    data.total_deductions !== undefined || deductions.total_deductions !== undefined
      ? numberValue(data.total_deductions ?? deductions.total_deductions)
      : null;

  if (
    explicitTotal !== null &&
    otherDeductions <= 0 &&
    explicitTotal > feedDeduction + anamatCut
  ) {
    otherDeductions = Number((explicitTotal - feedDeduction - anamatCut).toFixed(2));
  }

  const totalDeductions =
    explicitTotal !== null
      ? explicitTotal
      : feedDeduction + anamatCut + otherDeductions;

  return {
    feedDeduction,
    anamatCut,
    otherDeductions,
    totalDeductions
  };
}

export function calculateSettlementNetPayable(data = {}) {
  const income = numberValue(data.total_milk_income);
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
  const income = numberValue(data.total_milk_income);
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

  if (deductions.anamatCut > 0 && income > 0) {
    const anamatPercent = deductions.anamatCut / income;
    if (anamatPercent > 0.1) {
      warnings.push("अनामत कपात १०% पेक्षा जास्त दिसते. कृपया तपासा.");
    }
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
