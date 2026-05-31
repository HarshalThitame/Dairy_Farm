export const SLIP_LABELS_MARATHI = {
  date: "तारीख",
  time: "वेळ",
  shift: "सत्र",
  milk_type: "दुधाचा प्रकार",
  code_no: "डेअरी कोड",
  liters: "दूध (लिटर)",
  fat: "फॅट %",
  clr: "CLR स्कोर",
  snf: "SNF %",
  rate: "दर (₹/लिटर)",
  amount: "एकूण रक्कम (₹)",
  cow: "🐄 गाय",
  buffalo: "🐃 म्हैस",
  morning: "🌅 सकाळ",
  evening: "🌆 संध्याकाळ",
  clr_poor: "🔴 तपासा",
  clr_fair: "🟡 सामान्य",
  clr_good: "🟢 चांगली"
};


export const GAP_FILLING_MESSAGES = {
  gaps_detected: "काही डेटा स्पष्ट नाही",
  ai_filled: "AI ने विश्लेषण करून भरली",
  method_calculated: "गणना केली गेली",
  method_average_from_slip: "स्लिपची सरासरी",
  method_sum_daily_amounts: "दैनिक रकमेची बेरीज",
  method_sum_daily_liters: "दैनिक लिटरची बेरीज",
  method_inferred_15days: "१५ दिवसांवरून अनुमान",
  method_distributed_from_totals: "एकूणावरून समान विभागणी",
  accept_filled: "✅ स्वीकार करा",
  use_original: "❌ मूळ डेटा वापरा",
  verify_manual: "⚠️ हाताने तपासा",
  warning_reconstructed: "⚠️ पुनर्रचना केली - तपासा",
  warning_estimated: "⚠️ अनुमान - हाताने तपासा"
};

export function getMilkTypeLabel(type) {
  return String(type || "").toLowerCase() === "buffalo"
    ? SLIP_LABELS_MARATHI.buffalo
    : SLIP_LABELS_MARATHI.cow;
}
