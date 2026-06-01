function readValue(value) {
  if (value && typeof value === "object" && "value" in value) {
    return value.value;
  }
  return value;
}

function normalizeNumerals(value) {
  const devanagariDigits = "०१२३४५६७८९";
  const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";

  return String(value ?? "")
    .replace(/[०-९]/g, (digit) => String(devanagariDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)));
}

function numberValue(value) {
  const raw = readValue(value);
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  const number = Number(normalizeNumerals(raw).replace(/[,₹\s]/g, "").replace(/[Oo]/g, "0"));
  return Number.isFinite(number) ? number : null;
}

function textValue(value) {
  const text = String(readValue(value) ?? "").trim();
  return text || null;
}

function isEstimated(value) {
  return Boolean(value && typeof value === "object" && value.estimated);
}

function estimatedReason(value) {
  return value && typeof value === "object" ? value.reason || value.formula || "" : "";
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function confidence01(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return number > 1 ? Math.max(0, Math.min(1, number / 100)) : Math.max(0, Math.min(1, number));
}

function pushEstimatedFields(target, data, fieldNames) {
  fieldNames.forEach((field) => {
    if (isEstimated(data[field])) {
      target[field] = {
        value: readValue(data[field]),
        estimated: true,
        reason: estimatedReason(data[field]) || "AI ने उपलब्ध आकड्यांवरून गणना केली."
      };
    }
  });

  if (data.estimated_fields && typeof data.estimated_fields === "object") {
    Object.entries(data.estimated_fields).forEach(([field, details]) => {
      target[field] = {
        value: details?.value ?? readValue(data[field]),
        estimated: true,
        reason: details?.reason || details?.formula || "AI ने उपलब्ध आकड्यांवरून गणना केली."
      };
    });
  }
}

function addConfidenceRules(result, confidence) {
  if (confidence < 0.4) {
    result.errors.push("AI confidence 40% पेक्षा कमी आहे. थेट save करू नका; हाताने नोंद तपासा.");
    result.block_direct_save = true;
    result.requires_manual_correction = true;
    return;
  }

  if (confidence < 0.6) {
    result.warnings.push("AI confidence 60% पेक्षा कमी आहे. आवश्यक आकडे हाताने दुरुस्त करा.");
    result.requires_manual_correction = true;
    return;
  }

  if (confidence < 0.8) {
    result.warnings.push("AI confidence 80% पेक्षा कमी आहे. कृपया सर्व आर्थिक आकडे तपासा.");
  }
}

function validateDailySlip(data, result) {
  const liters = numberValue(data.liters);
  const rate = numberValue(data.rate_per_liter ?? data.rate);
  const amount = numberValue(data.total_amount ?? data.slip_printed_amount ?? data.amount);
  const fat = numberValue(data.fat ?? data.fat_percentage ?? data.fat_percent);
  const snf = numberValue(data.snf ?? data.snf_percentage ?? data.snf_percent);

  if (!textValue(data.date ?? data.slip_date)) result.errors.push("तारीख वाचता आली नाही.");
  if (!textValue(data.session)) result.errors.push("सत्र वाचता आले नाही.");
  if (liters === null || liters <= 0) result.errors.push("दूध लिटर वाचता आले नाही.");
  if (rate === null || rate <= 0) result.errors.push("दर वाचता आला नाही.");

  if (liters !== null && liters > 1000) {
    result.suspicious = true;
    result.warnings.push("दैनिक दूध 1000 लिटरपेक्षा जास्त दिसते. OCR चूक असू शकते.");
  }

  if (rate !== null && rate > 100) {
    result.suspicious = true;
    result.warnings.push("दर ₹100/लिटरपेक्षा जास्त दिसतो. कृपया तपासा.");
  }

  if (fat !== null && (fat < 0 || fat > 20)) {
    result.errors.push("फॅट 0 ते 20% मध्ये असावा.");
  }

  if (snf !== null && (snf < 0 || snf > 20)) {
    result.errors.push("SNF 0 ते 20 मध्ये असावा.");
  }

  if (liters !== null && rate !== null && amount !== null) {
    const calculated = roundMoney(liters * rate);
    if (Math.abs(calculated - amount) > Math.max(1, amount * 0.01)) {
      result.warnings.push(`लिटर × दर = ₹${calculated}, पण स्लिपवर ₹${amount} दिसते.`);
    }
  }

  pushEstimatedFields(result.estimated_fields, data, [
    "total_amount",
    "liters",
    "rate_per_liter",
    "fat",
    "snf",
    "clr"
  ]);
}

function validateSettlementSlip(data, result) {
  const totalLiters = numberValue(data.total_liters);
  const deductions = data.deductions || {};
  const income = numberValue(data.total_income ?? data.total_milk_income ?? data.milk_income);
  const explicitTotalDeductions = numberValue(data.total_deductions ?? deductions.total_deductions);
  const other = numberValue(data.other_deduction ?? data.other_deductions ?? deductions.other_deduction ?? deductions.other_deductions) || 0;
  const explicitFeed = numberValue(data.feed_deduction ?? data.cattle_feed_deduction ?? deductions.feed_deduction ?? deductions.cattle_feed_deduction);
  const feed = explicitFeed !== null
    ? explicitFeed
    : explicitTotalDeductions !== null
      ? explicitTotalDeductions
      : 0;
  const net = numberValue(data.net_amount ?? data.net_payable ?? data.final_payable);
  const summaryTotalLiters = numberValue(data.summary_total_liters);
  const summaryIncome = numberValue(data.summary_total_income ?? data.summary_total_amount);
  const dailyTotalLiters = numberValue(data.daily_total_liters);
  const dailyTotalAmount = numberValue(data.daily_total_amount);
  const morningTotalLiters = numberValue(data.morning_total_liters ?? data.session_totals?.morning_liters ?? data.session_totals?.morning?.liters);
  const eveningTotalLiters = numberValue(data.evening_total_liters ?? data.session_totals?.evening_liters ?? data.session_totals?.evening?.liters);
  const sessionTotalLiters =
    morningTotalLiters !== null && eveningTotalLiters !== null
      ? roundMoney(Number(morningTotalLiters) + Number(eveningTotalLiters))
      : null;

  if (!textValue(data.period_start)) result.errors.push("पीरियड सुरू तारीख वाचता आली नाही.");
  if (!textValue(data.period_end)) result.errors.push("पीरियड शेवट तारीख वाचता आली नाही.");
  if (income === null || income <= 0) result.errors.push("दूध उत्पन्न वाचता आले नाही.");

  if (totalLiters !== null && totalLiters > 10000) {
    result.suspicious = true;
    result.warnings.push("एकूण लिटर 10000 पेक्षा जास्त दिसते. OCR चूक असू शकते.");
  }

  if (income !== null && net !== null) {
    const calculatedNet = roundMoney(income - feed - other);
    if (Math.abs(calculatedNet - net) > Math.max(1, income * 0.005)) {
      result.warnings.push(`दूध उत्पन्न - कपात = ₹${calculatedNet}, पण निव्वळ ₹${net} दिसते.`);
    }
  }

  if (summaryTotalLiters !== null && totalLiters !== null && Math.abs(summaryTotalLiters - totalLiters) > 1) {
    result.warnings.push("Summary box आणि extracted total liters जुळत नाहीत. Summary box ला priority द्या.");
  }

  if (summaryIncome !== null && income !== null && Math.abs(summaryIncome - income) > 1) {
    result.warnings.push("Summary box आणि extracted income जुळत नाही. Summary box ला priority द्या.");
  }

  if (dailyTotalLiters !== null && totalLiters !== null && Math.abs(dailyTotalLiters - totalLiters) > Math.max(5, totalLiters * 0.02)) {
    result.warnings.push("Daily rows ची लिटर बेरीज summary total शी जुळत नाही. Summary total वापरा.");
  }

  if (sessionTotalLiters !== null && totalLiters !== null && Math.abs(sessionTotalLiters - totalLiters) > Math.max(5, totalLiters * 0.02)) {
    result.warnings.push("सकाळ + संध्याकाळ एकूण दूध आणि summary total जुळत नाही. स्लिपवरील total तपासा.");
  }

  if (dailyTotalAmount !== null && income !== null && Math.abs(dailyTotalAmount - income) > Math.max(100, income * 0.02)) {
    result.warnings.push("Daily rows ची रक्कम summary income शी जुळत नाही. Summary income वापरा.");
  }

  pushEstimatedFields(result.estimated_fields, data, [
    "total_liters",
    "total_income",
    "feed_deduction",
    "other_deduction",
    "net_amount"
  ]);
}

export function validateSlip(data = {}) {
  const type = data.type || data.slip_type;
  const confidence = confidence01(data.confidence ?? data.confidence_score);
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    suspicious: false,
    estimated_fields: {},
    confidence,
    requires_review: false,
    requires_manual_correction: false,
    block_direct_save: false,
    allow_direct_save: true
  };

  if (type === "daily_slip" || type === "daily") {
    validateDailySlip(data, result);
  } else if (type === "settlement") {
    validateSettlementSlip(data, result);
  } else {
    result.errors.push("स्लिपचा प्रकार ओळखता आला नाही.");
  }

  addConfidenceRules(result, confidence);

  result.valid = result.errors.length === 0;
  result.requires_review =
    result.errors.length > 0 ||
    result.warnings.length > 0 ||
    result.suspicious ||
    Object.keys(result.estimated_fields).length > 0;
  result.allow_direct_save = !result.block_direct_save;

  return result;
}
