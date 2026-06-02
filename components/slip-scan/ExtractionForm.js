"use client";

import { useEffect, useMemo, useState } from "react";
import FormField from "@/components/FormField";
import MarathiTextInput from "@/components/MarathiTextInput";
import ConfidenceIndicator from "@/components/slip-scan/ConfidenceIndicator";
import { getMilkTypeLabel, SLIP_LABELS_MARATHI } from "@/lib/marathiLabels";
import { getTodayISODate, toMarathiCurrency } from "@/lib/marathiUtils";
import { estimateThermalPaperAge, getClrQuality, validateDairySlipData } from "@/lib/thermalPrinterQuality";

const inputClass =
  "min-h-[56px] w-full rounded-lg border-2 bg-white px-4 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100";

const missingMap = {
  dairy_name: ["dairy_name", "डेअरीचे नाव"],
  member_number: ["member_number", "dairy_member_number", "dairy_member_code", "code_no", "सदस्य नंबर"],
  dairy_member_code: ["dairy_member_code", "code_no", "CODE_NO", "डेअरी कोड"],
  slip_date: ["slip_date", "date", "तारीख"],
  slip_time: ["slip_time", "time", "वेळ"],
  session: ["session", "सत्र"],
  milk_type: ["milk_type", "MILK_TYPE", "दुधाचा प्रकार"],
  liters: ["liters", "litres", "दूध", "milk"],
  fat_percentage: ["fat_percentage", "fat", "फॅट"],
  snf_percentage: ["snf_percentage", "snf", "SNF"],
  clr_degree: ["clr_degree", "clr_score", "clr", "degree", "डिग्री"],
  clr_score: ["clr_score", "clr_degree", "clr", "CLR"],
  rate_per_liter: ["rate_per_liter", "rate", "दर"],
  slip_printed_amount: ["slip_printed_amount", "printed_total_amount", "total_amount", "amount", "AMOUNT", "एकूण"],
  period_start: ["period_start", "पीरियड सुरू"],
  period_end: ["period_end", "पीरियड शेवट"],
  total_liters: ["total_liters", "total milk", "एकूण दूध"],
  morning_total_liters: ["morning_total_liters", "morning_liters", "सकाळचे एकूण दूध", "सकाळ एकूण"],
  evening_total_liters: ["evening_total_liters", "evening_liters", "संध्याकाळचे एकूण दूध", "संध्याकाळ एकूण"],
  total_milk_income: ["total_milk_income", "income", "उत्पन्न"],
  cattle_feed_deduction: ["cattle_feed_deduction", "खाद्य"],
  other_deductions: ["other_deductions", "कपात"],
  total_deductions: ["total_deductions", "एकूण कपात"],
  net_payable: ["net_payable", "निर्बळ रक्कम", "निव्वळ रक्कम"],
  settlement_date: ["settlement_date", "सेटलमेंट तारीख"]
};

function text(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function firstPresent(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

function numberValue(value) {
  const number = Number(
    String(value ?? "")
      .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[,₹\s]/g, "")
      .replace(/[Oo]/g, "0")
  );
  return Number.isFinite(number) ? number : 0;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(
    String(value)
      .replace(/[०-९]/g, (digit) => String("०१२३४५६७८९".indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[,₹\s]/g, "")
      .replace(/[Oo]/g, "0")
  );
  return Number.isFinite(number) ? number : null;
}

function resolveSettlementDeductions(data = {}) {
  const deductions = data.deductions || {};
  const explicitTotal = optionalNumber(data.total_deductions ?? deductions.total_deductions);
  const explicitFeed = optionalNumber(
    data.cattle_feed_deduction ??
      data.feed_deduction ??
      deductions.feed_deduction ??
      deductions.cattle_feed_deduction
  );
  const otherDeduction = numberValue(data.other_deductions ?? deductions.other_deductions);
  const feedDeduction =
    explicitFeed !== null && explicitFeed > 0
      ? explicitFeed
      : explicitTotal !== null
        ? explicitTotal
        : 0;

  return {
    feedDeduction,
    otherDeduction,
    totalDeductions: roundMoney(feedDeduction + otherDeduction)
  };
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function normalizeMilkType(value) {
  const textValue = String(value || "").trim().toLowerCase();

  if (textValue === "buffalo" || textValue.includes("म्हैस")) {
    return "buffalo";
  }

  return "cow";
}

function displaySlipDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    return date || "नाही";
  }

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function entryLiters(entry) {
  return numberValue(entry?.total_liters ?? entry?.liters);
}

function entryAmount(entry) {
  return numberValue(entry?.total_amount ?? entry?.amount);
}

function sessionLine(label, row) {
  if (!row) {
    return `${label}: वाचता आले नाही`;
  }

  const sourceSuffix = sourceLabel(row) ? ` · ${sourceLabel(row)}` : "";

  const hasAnyValue = [
    row.liters,
    row.fat_percent,
    row.fat_percentage,
    row.snf_percent,
    row.snf_percentage,
    row.rate_per_liter,
    row.rate,
    row.amount,
    row.total_amount
  ].some((value) => value !== null && value !== undefined && value !== "");

  if (!hasAnyValue) {
    return `${label}: वाचता आले नाही${row.missing_reason ? ` · ${row.missing_reason}` : sourceSuffix}`;
  }

  const liters = optionalNumber(row.liters);
  const amount = optionalNumber(row.amount ?? row.total_amount);

  return `${label}: ${liters === null ? "वाचता आले नाही" : `${liters.toFixed(2)} लि.`} | फॅट ${row.fat_percent ?? row.fat_percentage ?? "वाचता आले नाही"} | SNF ${row.snf_percent ?? row.snf_percentage ?? "वाचता आले नाही"} | दर ${row.rate_per_liter ?? row.rate ?? "वाचता आले नाही"} | ${amount === null ? "रक्कम वाचता आली नाही" : toMarathiCurrency(amount)}${sourceSuffix}`;
}

function sourceLabel(row) {
  if (!row) return "";
  if (row.source_label) return row.source_label;
  if (row.source === "daily_slip") return "दैनिक स्लिपवरून";
  if (row.source === "settlement_ocr") return "सेटलमेंट OCR वरून";
  if (row.source === "missing") return "नोंद नाही";
  return "";
}

function sourceBadgeClass(row) {
  if (row?.source === "daily_slip") return "border-green-200 bg-green-50 text-green-800";
  if (row?.source === "settlement_ocr") return "border-blue-200 bg-blue-50 text-blue-800";
  if (row?.source === "missing") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function isMissingField(missingFields, field) {
  const aliases = missingMap[field] || [field];
  const normalized = (missingFields || []).map((item) => String(item).toLowerCase());
  return aliases.some((alias) => normalized.some((item) => item.includes(String(alias).toLowerCase())));
}

function isEstimatedField(inferredFields, field) {
  if (!inferredFields || typeof inferredFields !== "object") {
    return false;
  }

  return Boolean(inferredFields[field]);
}

function buildInitialForm(data = {}) {
  const slipType = data.slip_type === "settlement" ? "settlement" : "daily";
  const dairyMemberCode = data.dairy_member_code || data.code_no || data.member_number || data.dairy_member_number;
  const clrScore = data.clr_score ?? data.clr_degree;
  const amountWasAutoFilled = Array.isArray(data.gaps_filled)
    ? data.gaps_filled.some((gap) => gap.field === "total_amount" || String(gap.field || "").endsWith(".amount"))
    : false;
  const printedAmount =
    data.slip_printed_amount ??
    data.printed_total_amount ??
    data.ocr_total_amount ??
    data.amount_verification?.printed_amount ??
    (data.calculated_total_amount === undefined && !amountWasAutoFilled ? data.total_amount : "");
  const resolvedDeductions = resolveSettlementDeductions(data);
  const morningTotalLiters = optionalNumber(
    data.morning_total_liters ?? data.session_totals?.morning_liters ?? data.session_totals?.morning?.liters
  );
  const eveningTotalLiters = optionalNumber(
    data.evening_total_liters ?? data.session_totals?.evening_liters ?? data.session_totals?.evening?.liters
  );
  const sessionTotalLiters =
    morningTotalLiters !== null && eveningTotalLiters !== null
      ? roundMoney(Number(morningTotalLiters) + Number(eveningTotalLiters))
      : "";
  const finalTotalLiters = firstPresent(sessionTotalLiters, data.total_liters, data.total_liters_section2, data.daily_total_liters);

  return {
    slip_type: slipType,
    dairy_name: text(data.dairy_name),
    farmer_name: text(data.farmer_name),
    farmer_code: text(data.farmer_code || data.dairy_member_code || data.member_number),
    member_number: text(data.member_number || dairyMemberCode),
    dairy_member_code: text(dairyMemberCode),
    slip_date: text(data.slip_date),
    slip_time: text(data.slip_time),
    session: text(data.session || "सकाळ"),
    milk_type: normalizeMilkType(data.milk_type),
    liters: text(data.liters),
    fat_percentage: text(data.fat_percentage),
    snf_percentage: text(data.snf_percentage),
    clr_degree: text(clrScore),
    clr_score: text(clrScore),
    rate_per_liter: text(data.rate_per_liter),
    slip_printed_amount: text(printedAmount),
    settlement_date: text(data.settlement_date || data.period_end || getTodayISODate()),
    period_start: text(data.period_start),
    period_end: text(data.period_end),
    daily_total_liters: text(data.daily_total_liters),
    daily_total_amount: text(data.daily_total_amount),
    morning_total_liters: text(morningTotalLiters),
    evening_total_liters: text(eveningTotalLiters),
    total_liters: text(finalTotalLiters),
    total_milk_income: text(data.total_milk_income),
    cattle_feed_deduction: text(resolvedDeductions.feedDeduction),
    other_deductions: text(resolvedDeductions.otherDeduction),
    total_deductions: text(resolvedDeductions.totalDeductions),
    net_payable: text(data.net_payable),
    bank_name: text(data.bank_name),
    bank_account_no: text(data.bank_account_no),
    session_entries: Array.isArray(data.session_entries) ? data.session_entries : [],
    daily_entries: Array.isArray(data.daily_entries) ? data.daily_entries : [],
    gaps_filled: Array.isArray(data.gaps_filled) ? data.gaps_filled : [],
    inferred_fields: data.inferred_fields || {},
    has_reconstructed: Boolean(data.has_reconstructed),
    confidence_after_filling: data.confidence_after_filling || null,
    original_missing_fields: Array.isArray(data.original_missing_fields) ? data.original_missing_fields : [],
    notes: text(data.notes || data.settlement_notes)
  };
}

export default function ExtractionForm({ extractedData, upload, onSave, onRetry, saving = false }) {
  const [form, setForm] = useState(() => buildInitialForm(extractedData));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildInitialForm(extractedData));
    setError("");
  }, [extractedData]);

  const missingFields = extractedData?.missing_fields || [];
  const confidence = Number(extractedData?.confidence_score ?? upload?.ai_confidence ?? 0);
  const totalAmount = useMemo(
    () => roundMoney(numberValue(form.liters) * numberValue(form.rate_per_liter)),
    [form.liters, form.rate_per_liter]
  );
  const printedAmount = useMemo(() => optionalNumber(form.slip_printed_amount), [form.slip_printed_amount]);
  const amountDifference = useMemo(
    () => (printedAmount === null ? null : roundMoney(printedAmount - totalAmount)),
    [printedAmount, totalAmount]
  );
  const amountStatus = useMemo(() => {
    if (printedAmount === null) return "missing";
    if (Math.abs(amountDifference || 0) <= 0.01) return "matched";
    return "mismatch";
  }, [amountDifference, printedAmount]);
  const clrQuality = useMemo(() => getClrQuality(form.clr_score || form.clr_degree), [form.clr_degree, form.clr_score]);
  const paperQuality = useMemo(() => estimateThermalPaperAge(confidence), [confidence]);
  const settlementValidation = extractedData?.settlement_validation || {};
  const settlementErrors = Array.isArray(settlementValidation.errors) ? settlementValidation.errors : [];
  const settlementWarnings = Array.isArray(settlementValidation.warnings) ? settlementValidation.warnings : [];
  const requiresManualReview =
    form.slip_type === "settlement" &&
    (Boolean(extractedData?.ocr_requires_manual_review) || settlementErrors.length > 0 || settlementWarnings.length > 0);
  const slipValidation = useMemo(() => {
    if (form.slip_type !== "daily") {
      return { valid: true, errors: [] };
    }

    return validateDairySlipData({
      ...form,
      total_amount: totalAmount
    });
  }, [form, totalAmount]);
  const effectiveOtherDeductions = useMemo(() => {
    return numberValue(form.other_deductions);
  }, [form.other_deductions]);
  const totalDeductions = useMemo(
    () =>
      numberValue(form.cattle_feed_deduction) +
        effectiveOtherDeductions,
    [form.cattle_feed_deduction, effectiveOtherDeductions]
  );
  const netPayable = useMemo(
    () => numberValue(form.total_milk_income) - totalDeductions,
    [form.total_milk_income, totalDeductions]
  );
  const morningSessionTotal = useMemo(() => optionalNumber(form.morning_total_liters), [form.morning_total_liters]);
  const eveningSessionTotal = useMemo(() => optionalNumber(form.evening_total_liters), [form.evening_total_liters]);
  const combinedSessionTotal = useMemo(
    () =>
      morningSessionTotal !== null && eveningSessionTotal !== null
        ? roundMoney(Number(morningSessionTotal) + Number(eveningSessionTotal))
        : null,
    [eveningSessionTotal, morningSessionTotal]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function fieldClass(field, required = false) {
    const missing = isMissingField(missingFields, field) || (required && !String(form[field] || "").trim());
    if (missing) return `${inputClass} border-red-300 bg-red-50`;
    if (isEstimatedField(form.inferred_fields, field)) return `${inputClass} border-yellow-300 bg-yellow-50`;
    if (confidence > 0 && confidence < 0.8) return `${inputClass} border-yellow-300 bg-yellow-50`;
    return `${inputClass} border-slate-200`;
  }

  function validate() {
    if (form.slip_type === "daily") {
      if (!form.slip_date) return "तारीख भरा.";
      if (!form.session) return "सत्र निवडा.";
      if (!["cow", "buffalo"].includes(form.milk_type)) return "दुधाचा प्रकार निवडा.";
      if (numberValue(form.liters) <= 0) return "दूध लिटर नीट भरा.";
      if (numberValue(form.rate_per_liter) <= 0) return "दर नीट भरा.";
      if (form.clr_score && (numberValue(form.clr_score) < 0 || numberValue(form.clr_score) > 100)) {
        return "CLR स्कोर 0-100 मध्ये असावा.";
      }
      return "";
    }

    if (!form.period_start || !form.period_end) return "पीरियड तारीख भरा.";
    if (form.period_end < form.period_start) return "पीरियड शेवट सुरू तारखेपेक्षा नंतर असावा.";
    if (numberValue(form.total_milk_income) <= 0 || form.total_milk_income === "") return "एकूण उत्पन्न भरा.";
    return "";
  }

  async function submit(event) {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (requiresManualReview) {
      const confirmed = window.confirm(
        "AI ने काही आर्थिक आकडे संशयास्पद/अस्पष्ट वाचले आहेत. तुम्ही स्लिपवरील एकूण लिटर, दूध उत्पन्न, एकूण कपात आणि निव्वळ रक्कम स्वतः तपासली आहे का?"
      );

      if (!confirmed) {
        setError("कृपया स्लिपवरील आकडे तपासून मग जतन करा.");
        return;
      }
    }

    const amountVerification = {
      printed_amount: printedAmount,
      calculated_amount: totalAmount,
      difference: amountDifference,
      status: amountStatus
    };
    const userEdits =
      form.slip_type === "daily"
        ? {
            ...form,
            total_amount: totalAmount,
            calculated_total_amount: totalAmount,
            slip_printed_amount: printedAmount,
            amount_difference: amountDifference,
            amount_matches: amountStatus === "matched",
            amount_verification: amountVerification
          }
        : {
            ...form,
            farmer_code: form.farmer_code || form.member_number || form.dairy_member_code,
            dairy_member_code: form.farmer_code || form.member_number || form.dairy_member_code,
            morning_total_liters: optionalNumber(form.morning_total_liters),
            evening_total_liters: optionalNumber(form.evening_total_liters),
            session_totals: {
              morning_liters: optionalNumber(form.morning_total_liters),
              evening_liters: optionalNumber(form.evening_total_liters),
              total_liters:
                optionalNumber(form.morning_total_liters) !== null && optionalNumber(form.evening_total_liters) !== null
                  ? roundMoney(numberValue(form.morning_total_liters) + numberValue(form.evening_total_liters))
                  : optionalNumber(form.total_liters)
            },
            total_deductions: totalDeductions,
            net_payable: netPayable,
            deductions: {
              feed_deduction: numberValue(form.cattle_feed_deduction),
              other_deductions: effectiveOtherDeductions,
              total_deductions: totalDeductions
            }
          };

    await onSave?.({
      slip_type: form.slip_type,
      extractedData,
      userEdits
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-extrabold text-slate-950">AI ने वाचलेली माहिती</h2>
            <p className="mt-1 text-[17px] font-bold text-slate-600">प्रत्येक आकडा तपासूनच जतन करा.</p>
            {paperQuality.warning ? (
              <p className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-[15px] font-extrabold text-yellow-900">
                {paperQuality.warning}
              </p>
            ) : null}
            {upload?.retried ? (
              <p className="mt-2 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[14px] font-extrabold text-blue-800">
                GPT fallback वापरला
              </p>
            ) : null}
          </div>
          <ConfidenceIndicator score={confidence} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["daily", "🥛 दूध स्लिप"],
            ["settlement", "📋 देयक स्लिप"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateField("slip_type", value)}
              className={`min-h-[54px] rounded-lg border-2 px-3 text-[18px] font-extrabold ${
                form.slip_type === value ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {requiresManualReview ? (
        <section className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 text-yellow-950 shadow-soft">
          <h2 className="text-[22px] font-extrabold">⚠️ आर्थिक माहिती तपासा</h2>
          <p className="mt-1 text-[17px] font-bold">
            AI result पूर्ण खात्रीशीर नाही. सेव्ह करण्यापूर्वी summary मधील एकूण लिटर, दूध उत्पन्न, कपात आणि निव्वळ रक्कम जुळवा.
          </p>
          {settlementErrors.length ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-[16px] font-extrabold text-red-900">
              {settlementErrors.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          ) : null}
          {settlementWarnings.length ? (
            <div className="mt-3 rounded-lg border border-yellow-200 bg-white p-3 text-[16px] font-bold text-yellow-900">
              {settlementWarnings.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          ) : null}
          {settlementValidation.daily_liters_sum || settlementValidation.daily_amount_sum ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-[15px] font-extrabold">
              <div className="rounded-lg bg-white p-3">
                <p className="text-slate-500">दैनिक बेरीज</p>
                <p>{Number(settlementValidation.daily_liters_sum || 0).toFixed(2)} लि.</p>
                <p>{toMarathiCurrency(numberValue(settlementValidation.daily_amount_sum))}</p>
              </div>
              <div className="rounded-lg bg-white p-3">
                <p className="text-slate-500">Summary वापरले</p>
                <p>{Number(settlementValidation.summary_total_liters || 0).toFixed(2)} लि.</p>
                <p>{toMarathiCurrency(numberValue(settlementValidation.summary_total_income))}</p>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {Array.isArray(extractedData?.ai_warnings) && extractedData.ai_warnings.length ? (
        <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-950 shadow-soft">
          <h2 className="text-[21px] font-extrabold">AI सूचना</h2>
          {extractedData.ai_warnings.map((item) => (
            <p key={item} className="mt-1 text-[16px] font-bold">• {item}</p>
          ))}
        </section>
      ) : null}

      {form.slip_type === "daily" ? (
        <section className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-950 shadow-soft">
          <h2 className="text-[22px] font-extrabold">थर्मल स्लिप सारांश</h2>
          <div className="mt-3 space-y-2 text-[18px] font-bold">
            <div className="flex justify-between gap-3"><span>तारीख</span><span>{displaySlipDate(form.slip_date)}</span></div>
            <div className="flex justify-between gap-3"><span>वेळ</span><span>{form.slip_time || "नोंद नाही"}</span></div>
            <div className="flex justify-between gap-3"><span>सत्र</span><span>{form.session}</span></div>
            <div className="flex justify-between gap-3"><span>दूध</span><span>{numberValue(form.liters).toFixed(2)} लि. x ₹{numberValue(form.rate_per_liter).toFixed(2)}</span></div>
            <div className="flex justify-between gap-3"><span>हिशोबाने एकूण</span><span>{toMarathiCurrency(totalAmount)}</span></div>
            <div className="flex justify-between gap-3"><span>स्लिपवर दिसलेली</span><span>{printedAmount === null ? "वाचता आली नाही" : toMarathiCurrency(printedAmount)}</span></div>
            <div className="flex justify-between gap-3"><span>गुणवत्ता</span><span>फॅट {form.fat_percentage || "-"}% | SNF {form.snf_percentage || "-"}% | CLR {form.clr_score || form.clr_degree || "-"}</span></div>
            <div className="flex justify-between gap-3"><span>प्रकार</span><span>{getMilkTypeLabel(form.milk_type)}</span></div>
            <div className="flex justify-between gap-3"><span>कोड</span><span>{form.dairy_member_code || form.member_number || "नोंद नाही"}</span></div>
          </div>
          {amountStatus === "matched" ? (
            <p className="mt-3 rounded-lg border border-green-200 bg-white px-3 py-2 text-[17px] font-extrabold text-green-800">
              ✅ रक्कम जुळली: लिटर x दर = स्लिपवरील रक्कम
            </p>
          ) : null}
          {amountStatus === "missing" ? (
            <p className="mt-3 rounded-lg border border-yellow-200 bg-white px-3 py-2 text-[17px] font-extrabold text-yellow-900">
              ⚠️ स्लिपवरील रक्कम स्पष्ट वाचता आली नाही. हिशोबाने आलेली रक्कम वापरली जाईल.
            </p>
          ) : null}
          {amountStatus === "mismatch" ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-[17px] font-extrabold text-red-900">
              <p>⚠️ रक्कम जुळत नाही. आकडे तपासा.</p>
              <p className="mt-1">स्लिपवर: {toMarathiCurrency(printedAmount)} | हिशोबाने: {toMarathiCurrency(totalAmount)}</p>
              <p className="mt-1">फरक: {toMarathiCurrency(Math.abs(amountDifference || 0))}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="space-y-4">
          <FormField label="डेअरीचे नाव">
            <MarathiTextInput value={form.dairy_name} onValueChange={(value) => updateField("dairy_name", value)} className={fieldClass("dairy_name")} />
          </FormField>
          {form.slip_type === "daily" ? (
            <FormField label={SLIP_LABELS_MARATHI.code_no}>
              <input value={form.dairy_member_code} onChange={(event) => updateField("dairy_member_code", event.target.value)} className={fieldClass("dairy_member_code")} />
            </FormField>
          ) : (
            <FormField label="सदस्य नंबर">
              <input value={form.member_number} onChange={(event) => updateField("member_number", event.target.value)} className={fieldClass("member_number")} />
            </FormField>
          )}
        </div>
      </section>

      {form.slip_type === "daily" ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="mb-3 text-[21px] font-extrabold text-slate-950">तारीख आणि वेळ</h2>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="तारीख" required>
                <input type="date" value={form.slip_date} onChange={(event) => updateField("slip_date", event.target.value)} className={fieldClass("slip_date", true)} />
              </FormField>
              <FormField label="वेळ">
                <input type="time" step="1" value={form.slip_time} onChange={(event) => updateField("slip_time", event.target.value)} className={fieldClass("slip_time")} />
              </FormField>
              <div>
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">सत्र</p>
                <div className="grid grid-cols-2 gap-2">
                  {["सकाळ", "संध्याकाळ"].map((session) => (
                    <button
                      key={session}
                      type="button"
                      onClick={() => updateField("session", session)}
                      className={`min-h-[56px] rounded-lg border-2 px-2 text-[17px] font-extrabold ${
                        form.session === session ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {session}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="mb-3 text-[21px] font-extrabold text-slate-950">दुधाची माहिती</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">दुधाचा प्रकार</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["cow", "🐄 गाय"],
                    ["buffalo", "🐃 म्हैस"]
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateField("milk_type", value)}
                      className={`min-h-[56px] rounded-lg border-2 px-2 text-[18px] font-extrabold ${
                        form.milk_type === value ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <FormField label="दूध लिटर" required>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.liters} onChange={(event) => updateField("liters", event.target.value)} className={`${fieldClass("liters", true)} text-[26px]`} />
              </FormField>
              <FormField label="दर ₹/लि." required>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.rate_per_liter} onChange={(event) => updateField("rate_per_liter", event.target.value)} className={fieldClass("rate_per_liter", true)} />
              </FormField>
              <FormField label="फॅट %">
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.fat_percentage} onChange={(event) => updateField("fat_percentage", event.target.value)} className={fieldClass("fat_percentage")} />
              </FormField>
              <FormField label="SNF %">
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.snf_percentage} onChange={(event) => updateField("snf_percentage", event.target.value)} className={fieldClass("snf_percentage")} />
              </FormField>
              <FormField label="CLR स्कोर">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.clr_score}
                  onChange={(event) => {
                    updateField("clr_score", event.target.value);
                    updateField("clr_degree", event.target.value);
                  }}
                  className={fieldClass("clr_score")}
                />
              </FormField>
              <FormField label="स्लिपवर दिसलेली रक्कम">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.slip_printed_amount}
                  onChange={(event) => updateField("slip_printed_amount", event.target.value)}
                  className={fieldClass("slip_printed_amount")}
                />
              </FormField>
              <FormField label="हिशोबाने रक्कम">
                <div className="flex min-h-[56px] items-center rounded-lg border-2 border-slate-200 bg-slate-50 px-4 text-[22px] font-extrabold text-green-800">
                  {toMarathiCurrency(totalAmount)}
                </div>
              </FormField>
            </div>
            {amountStatus === "matched" ? (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-[17px] font-extrabold text-green-800">
                ✅ रक्कम बरोबर आहे.
              </div>
            ) : null}
            {amountStatus === "mismatch" ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[17px] font-extrabold text-red-900">
                ⚠️ स्लिपवरील रक्कम आणि हिशोबाने रक्कम जुळत नाही. लिटर, दर किंवा स्लिपवरील रक्कम तपासा.
              </div>
            ) : null}
            <div className={`mt-3 rounded-lg border p-3 text-[17px] font-extrabold ${clrQuality.className}`}>
              CLR: {form.clr_score || form.clr_degree || "नोंद नाही"} - {clrQuality.label}
            </div>
            {!slipValidation.valid ? (
              <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-[16px] font-bold text-yellow-900">
                {slipValidation.errors.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="mb-3 text-[21px] font-extrabold text-slate-950">सेटलमेंट माहिती</h2>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="सेटलमेंट तारीख">
                <input type="date" value={form.settlement_date} onChange={(event) => updateField("settlement_date", event.target.value)} className={fieldClass("settlement_date")} />
              </FormField>
              <FormField label="पीरियड सुरू" required>
                <input type="date" value={form.period_start} onChange={(event) => updateField("period_start", event.target.value)} className={fieldClass("period_start", true)} />
              </FormField>
              <FormField label="पीरियड शेवट" required>
                <input type="date" value={form.period_end} onChange={(event) => updateField("period_end", event.target.value)} className={fieldClass("period_end", true)} />
              </FormField>
              <FormField label="एकूण दूध">
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.total_liters} onChange={(event) => updateField("total_liters", event.target.value)} className={fieldClass("total_liters")} />
              </FormField>
              <FormField label="सकाळचे एकूण दूध">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.morning_total_liters}
                  onChange={(event) => updateField("morning_total_liters", event.target.value)}
                  className={fieldClass("morning_total_liters")}
                />
              </FormField>
              <FormField label="संध्याकाळचे एकूण दूध">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.evening_total_liters}
                  onChange={(event) => updateField("evening_total_liters", event.target.value)}
                  className={fieldClass("evening_total_liters")}
                />
              </FormField>
              <FormField label="शेतकरी कोड">
                <input value={form.farmer_code || form.member_number} onChange={(event) => {
                  updateField("farmer_code", event.target.value);
                  updateField("member_number", event.target.value);
                }} className={fieldClass("member_number")} />
              </FormField>
              <FormField label="शेतकरी नाव">
                <MarathiTextInput value={form.farmer_name} onValueChange={(value) => updateField("farmer_name", value)} className={fieldClass("farmer_name")} />
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-[22px] font-extrabold text-slate-950">कपात तपशील</h2>
            <div className="mt-4 space-y-3">
              <FormField label="दूध उत्पन्न" required>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={form.total_milk_income} onChange={(event) => updateField("total_milk_income", event.target.value)} className={`${fieldClass("total_milk_income", true)} text-[26px]`} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="खाद्य कपात">
                  <input type="number" inputMode="decimal" min="0" step="0.01" value={form.cattle_feed_deduction} onChange={(event) => updateField("cattle_feed_deduction", event.target.value)} className={fieldClass("cattle_feed_deduction")} />
                </FormField>
                <FormField label="इतर कपात">
                  <input type="number" inputMode="decimal" min="0" step="0.01" value={form.other_deductions} onChange={(event) => updateField("other_deductions", event.target.value)} className={fieldClass("other_deductions")} />
                </FormField>
                <FormField label="एकूण कपात">
                  <div className="flex min-h-[56px] items-center rounded-lg border-2 border-red-100 bg-red-50 px-4 text-[22px] font-extrabold text-red-800">
                    {toMarathiCurrency(totalDeductions)}
                  </div>
                </FormField>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[17px] font-extrabold text-slate-800">
                <div className="flex justify-between gap-3"><span>दूध उत्पन्न</span><span>{toMarathiCurrency(numberValue(form.total_milk_income))}</span></div>
                <div className="mt-2 flex justify-between gap-3 text-red-800"><span>(-) खाद्य कपात</span><span>{toMarathiCurrency(numberValue(form.cattle_feed_deduction))}</span></div>
                <div className="mt-2 flex justify-between gap-3 text-red-800"><span>(-) इतर कपात</span><span>{toMarathiCurrency(effectiveOtherDeductions)}</span></div>
              </div>
              <div className={`rounded-lg border-2 p-4 ${netPayable >= 0 ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
                <p className="text-[18px] font-extrabold">शुद्ध देय</p>
                <p className="mt-1 text-[30px] font-extrabold">{toMarathiCurrency(netPayable)}</p>
              </div>
            </div>
          </section>

          {form.daily_entries?.length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
              <h2 className="text-[22px] font-extrabold text-slate-950">दैनिक तक्ता</h2>
              <p className="mt-1 text-[17px] font-bold text-slate-600">
                AI ने {form.daily_entries.length} दिवसांच्या नोंदी वाचल्या. ज्या दिवशी daily slip आहे तिथे तीच माहिती वापरली आहे.
              </p>
              {extractedData?.daily_slip_merge?.applied ? (
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-[15px] font-extrabold text-green-900">
                  <p>
                    Daily slip वरून {extractedData.daily_slip_merge.trusted_daily_slip_rows || 0} session rows वापरले.
                    सेटलमेंट OCR rows {extractedData.daily_slip_merge.settlement_ocr_rows || 0}.
                  </p>
                  {(extractedData.daily_slip_merge.missing_rows || []).length ? (
                    <p className="mt-1 text-amber-800">
                      {(extractedData.daily_slip_merge.missing_rows || []).length} session rows सापडले नाहीत; खाली reason दाखवला आहे.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[15px] font-extrabold text-amber-800">🌅 सकाळचे एकूण दूध</p>
                  <p className="mt-1 text-[24px] font-black text-slate-950">
                    {morningSessionTotal === null ? "वाचता आले नाही" : `${morningSessionTotal.toFixed(2)} लि.`}
                  </p>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <p className="text-[15px] font-extrabold text-indigo-800">🌆 संध्याकाळचे एकूण दूध</p>
                  <p className="mt-1 text-[24px] font-black text-slate-950">
                    {eveningSessionTotal === null ? "वाचता आले नाही" : `${eveningSessionTotal.toFixed(2)} लि.`}
                  </p>
                </div>
              </div>
              {combinedSessionTotal !== null ? (
                <p className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[16px] font-extrabold text-green-900">
                  सकाळ + संध्याकाळ = {combinedSessionTotal.toFixed(2)} लि.
                </p>
              ) : morningSessionTotal !== null || eveningSessionTotal !== null ? (
                <p className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-[16px] font-extrabold text-yellow-900">
                  दोन्ही session totals वाचले नाहीत. Final एकूण दूध field स्लिपवरून तपासा.
                </p>
              ) : null}
              <div className="mt-3 max-h-[520px] overflow-auto rounded-lg border border-slate-200">
                {form.daily_entries.map((entry, index) => {
                  const morning = sessionLine("सकाळ", entry.morning);
                  const evening = sessionLine("संध्याकाळ", entry.evening);
                  const suspicious =
                    entryLiters(entry) > 500 ||
                    numberValue(entry.morning?.liters) > 500 ||
                    numberValue(entry.evening?.liters) > 500;

                  return (
                    <div
                      key={`${entry.date || index}-${index}`}
                      className={`border-b p-3 text-[16px] font-bold last:border-b-0 ${
                        suspicious ? "border-red-100 bg-red-50 text-red-900" : "border-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex justify-between gap-3">
                        <span className="text-[18px] font-extrabold text-slate-950">
                          {displaySlipDate(entry.date) || "तारीख नाही"}
                        </span>
                        <span className="text-right font-extrabold text-green-800">
                          {entryLiters(entry).toFixed(2)} लि. · {toMarathiCurrency(entryAmount(entry))}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[15px] text-slate-600">
                        <p>{morning}</p>
                        <p>{evening}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[entry.morning, entry.evening]
                            .filter(Boolean)
                            .map((row, rowIndex) => {
                              const label = sourceLabel(row);
                              if (!label) return null;

                              return (
                                <span
                                  key={`${entry.date || index}-${row.session || rowIndex}-source`}
                                  className={`rounded-full border px-2 py-1 text-[12px] font-extrabold ${sourceBadgeClass(row)}`}
                                >
                                  {row.session || (rowIndex === 0 ? "सकाळ" : "संध्याकाळ")}: {label}
                                </span>
                              );
                            })}
                        </div>
                        {suspicious ? <p className="font-extrabold text-red-900">⚠️ हा row अवास्तव वाटतो. सेव्ह करण्यापूर्वी तपासा.</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-[18px] font-extrabold text-green-900">
                दैनिक तक्त्याची बेरीज: {form.daily_entries.reduce((sum, entry) => sum + entryLiters(entry), 0).toFixed(2)} लि. ·{" "}
                {toMarathiCurrency(form.daily_entries.reduce((sum, entry) => sum + entryAmount(entry), 0))}
                <p className="mt-1 text-[13px] text-green-800">
                  Final अहवालासाठी स्लिपवरील छापील सकाळ/संध्याकाळ total आणि settlement summary वापरले जातात.
                </p>
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <FormField label="नोंद">
          <MarathiTextInput multiline rows={3} value={form.notes} onValueChange={(value) => updateField("notes", value)} className="min-h-[100px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100" />
        </FormField>
      </section>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[19px] font-extrabold text-red-800">{error}</p> : null}

      <div className="sticky bottom-24 z-20 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur">
        <button type="button" onClick={onRetry} disabled={saving} className="min-h-[56px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[18px] font-extrabold text-slate-700 active:bg-slate-100">
          🔄 पुन्हा स्कॅन
        </button>
        <button type="submit" disabled={saving} className="min-h-[56px] rounded-lg bg-sheti px-4 text-[18px] font-extrabold text-white disabled:opacity-70 active:bg-green-700">
          {saving ? "💾 जतन चालू आहे..." : "✅ तपासले, जतन करा"}
        </button>
      </div>
    </form>
  );
}
