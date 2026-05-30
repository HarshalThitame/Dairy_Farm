export const MAHARASHTRA_DAIRY_STANDARDS = {
  clr_score_range: [0, 100],
  clr_good_range: [26, 32],
  clr_fair_low_range: [22, 25.99],
  clr_fair_high_range: [32.01, 35],
  fat_percent_range: {
    cow: [2.0, 6.0],
    buffalo: [4.0, 10.0]
  },
  snf_percent_range: [7.5, 9.5],
  rate_multipliers: {
    cow: 1,
    buffalo: 1.25
  }
};

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function getClrQuality(score) {
  const value = toNumber(score);

  if (value === null) {
    return {
      level: "unknown",
      label: "नोंद नाही",
      className: "bg-slate-100 text-slate-700 border-slate-200"
    };
  }

  if (value >= 26 && value <= 32) {
    return {
      level: "good",
      label: "चांगली",
      className: "bg-green-50 text-green-800 border-green-200"
    };
  }

  if ((value >= 22 && value < 26) || (value > 32 && value <= 35)) {
    return {
      level: "fair",
      label: "सामान्य",
      className: "bg-yellow-50 text-yellow-800 border-yellow-200"
    };
  }

  return {
    level: "poor",
    label: "तपासा",
    className: "bg-red-50 text-red-800 border-red-200"
  };
}

export function estimateThermalPaperAge(confidenceScore) {
  const score = Number(confidenceScore || 0);

  if (score > 0.95) {
    return { age: "Fresh (0-7 days)", warning: null };
  }

  if (score > 0.85) {
    return { age: "Recent (1-4 weeks)", warning: null };
  }

  if (score > 0.75) {
    return { age: "Older (1-3 months)", warning: "थोडं अस्पष्ट आहे. आकडे तपासा." };
  }

  return { age: "Very old (3+ months)", warning: "स्लिप खूप फिकट आहे. आकडे स्वतः तपासून भरा." };
}

export function validateDairySlipData(data = {}) {
  const errors = [];
  const milkType = String(data.milk_type || "").toLowerCase();
  const clrScore = toNumber(data.clr_score ?? data.clr_degree);
  const liters = toNumber(data.liters);
  const rate = toNumber(data.rate_per_liter);
  const totalAmount = toNumber(data.total_amount);

  if (!data.slip_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(data.slip_date))) {
    errors.push("तारीख YYYY-MM-DD format मध्ये असणे आवश्यक आहे.");
  }

  if (data.slip_time && !/^\d{2}:\d{2}(:\d{2})?$/.test(String(data.slip_time))) {
    errors.push("वेळ HH:MM:SS format मध्ये असणे आवश्यक आहे.");
  }

  if (!["cow", "buffalo"].includes(milkType)) {
    errors.push("दुधाचा प्रकार गाय किंवा म्हैस असणे आवश्यक आहे.");
  }

  if (clrScore !== null && (clrScore < 0 || clrScore > 100)) {
    errors.push("CLR स्कोर 0-100 मध्ये असणे आवश्यक आहे.");
  }

  if (liters !== null && rate !== null && totalAmount !== null) {
    const calculated = liters * rate;

    if (Math.abs(calculated - totalAmount) > 0.5) {
      errors.push(`रक्कम जुळत नाही: ${calculated.toFixed(2)} vs ${totalAmount}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
