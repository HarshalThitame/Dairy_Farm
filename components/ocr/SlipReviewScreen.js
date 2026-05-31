"use client";

/* eslint-disable @next/next/no-img-element */

import ConfidenceIndicator from "@/components/slip-scan/ConfidenceIndicator";
import { toMarathiCurrency } from "@/lib/marathiUtils";

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "वाचता आले नाही";
  }

  if (typeof value === "number" && Math.abs(value) >= 100) {
    return toMarathiCurrency(value);
  }

  return String(value);
}

function fieldRows(data = {}) {
  if (data.slip_type === "settlement") {
    return [
      ["डेअरी", data.dairy_name],
      ["सदस्य नंबर", data.member_number || data.dairy_member_code || data.farmer_code],
      ["पीरियड", data.period_start && data.period_end ? `${data.period_start} ते ${data.period_end}` : null],
      ["एकूण लिटर", data.total_liters],
      ["दूध उत्पन्न", data.total_milk_income],
      ["खाद्य कपात", data.cattle_feed_deduction],
      ["इतर कपात", data.other_deductions],
      ["निव्वळ रक्कम", data.net_payable]
    ];
  }

  return [
    ["डेअरी", data.dairy_name],
    ["सदस्य नंबर", data.member_number || data.dairy_member_code],
    ["तारीख", data.slip_date],
    ["सत्र", data.session],
    ["दूध", data.liters],
    ["फॅट", data.fat_percentage],
    ["SNF", data.snf_percentage],
    ["CLR", data.clr_score || data.clr_degree],
    ["दर", data.rate_per_liter],
    ["रक्कम", data.total_amount || data.slip_printed_amount]
  ];
}

export default function SlipReviewScreen({
  imageUrl,
  extractedData,
  validation,
  onAccept,
  onEdit,
  onCancel,
  accepting = false
}) {
  const data = extractedData || {};
  const warnings = validation?.warnings || data.ai_warnings || [];
  const errors = validation?.errors || data.validation?.errors || [];
  const estimatedFields = data.inferred_fields || validation?.estimated_fields || {};

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-extrabold text-slate-950">✅ AI ने स्लिप वाचली</h2>
          <p className="mt-1 text-[17px] font-bold text-slate-600">सेव्ह करण्यापूर्वी प्रत्येक आकडा तपासा.</p>
        </div>
        <ConfidenceIndicator score={data.confidence_score || validation?.confidence || 0} />
      </div>

      {imageUrl ? (
        <div className="max-h-[320px] overflow-auto rounded-lg border border-slate-200 bg-slate-100">
          <img src={imageUrl} alt="स्लिप फोटो" className="w-full object-contain" />
        </div>
      ) : null}

      {errors.length || warnings.length ? (
        <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-3 text-[16px] font-bold text-yellow-950">
          <p className="text-[19px] font-extrabold">⚠️ तपासणी आवश्यक</p>
          {[...errors, ...warnings].map((item) => (
            <p key={item} className="mt-1">• {item}</p>
          ))}
        </div>
      ) : null}

      {Object.keys(estimatedFields).length ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-950">
          <p className="text-[19px] font-extrabold">🟡 AI Estimated</p>
          <p className="mt-1 text-[15px] font-bold">
            काही माहिती अस्पष्ट होती. AI ने उपलब्ध आकड्यांवरून गणना केली. सेव्ह करण्यापूर्वी तपासा.
          </p>
          <div className="mt-2 space-y-2">
            {Object.entries(estimatedFields).map(([field, details]) => (
              <div key={field} className="rounded-lg bg-white p-2 text-[15px] font-bold">
                <span className="font-extrabold">{field}</span>: {formatValue(details?.value)}
                <span className="block text-slate-600">{details?.reason || details?.formula || "गणना केली."}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200">
        {fieldRows(data).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-slate-100 p-3 text-[17px] font-bold last:border-b-0">
            <span className="text-slate-600">{label}</span>
            <span className="text-right text-slate-950">{formatValue(value)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onAccept}
          disabled={accepting}
          className="min-h-[54px] rounded-lg bg-sheti px-3 text-[17px] font-extrabold text-white disabled:opacity-60"
        >
          ✅ Accept
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={accepting}
          className="min-h-[54px] rounded-lg border-2 border-blue-200 bg-blue-50 px-3 text-[17px] font-extrabold text-blue-900"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={accepting}
          className="min-h-[54px] rounded-lg border-2 border-red-200 bg-red-50 px-3 text-[17px] font-extrabold text-red-900"
        >
          ❌ Cancel
        </button>
      </div>
    </section>
  );
}
