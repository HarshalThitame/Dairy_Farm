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

export const ANAMAT_LABELS = {
  anamat_cut: "अनामत कपात",
  anamat_accumulated: "एकूण अनामत",
  anamat_claimed: "दावा घेतली",
  anamat_available: "उपलब्ध शिल्लक",
  msg_anamat_info: "अनामत म्हणजे साठवलेली रक्कम. साधारणपणे १ वर्षानंतर परत मिळते.",
  msg_full_eligible: "✅ संपूर्ण अनामत क्लेम करण्यासाठी योग्य",
  msg_partial_eligible: "⏳ अजून प्रतीक्षा करा. पूर्ण दावा घेण्यासाठी १ वर्ष पूर्ण होणे चांगले.",
  msg_claim_confirmation: "तुम्हाला अनामत रक्कम क्लेम करायची आहे का?",
  msg_claim_success: "✅ अनामत दावा स्वीकार झाला!"
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
