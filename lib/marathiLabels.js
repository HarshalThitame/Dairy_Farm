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

export function getMilkTypeLabel(type) {
  return String(type || "").toLowerCase() === "buffalo"
    ? SLIP_LABELS_MARATHI.buffalo
    : SLIP_LABELS_MARATHI.cow;
}
