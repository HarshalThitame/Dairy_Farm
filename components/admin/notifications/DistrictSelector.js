"use client";

const districts = [
  "पुणे",
  "मुंबई",
  "नाशिक",
  "छत्रपती संभाजीनगर",
  "नागपूर",
  "सोलापूर",
  "सातारा",
  "सांगली",
  "कोल्हापूर",
  "अहमदनगर",
  "जळगाव",
  "धुळे",
  "नंदुरबार",
  "बीड",
  "लातूर",
  "उस्मानाबाद",
  "परभणी",
  "नांदेड",
  "अमरावती",
  "अकोला",
  "बुलढाणा",
  "यवतमाळ",
  "वर्धा",
  "चंद्रपूर",
  "गडचिरोली",
  "भंडारा",
  "गोंदिया",
  "रायगड",
  "रत्नागिरी",
  "सिंधुदुर्ग",
  "ठाणे",
  "पालघर"
];

export default function DistrictSelector({ value = [], onChange }) {
  function toggle(district) {
    const next = value.includes(district)
      ? value.filter((item) => item !== district)
      : [...value, district];
    onChange(next);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[17px] font-extrabold text-slate-800">Districts</p>
        <button
          type="button"
          onClick={() => onChange(value.length === districts.length ? [] : districts)}
          className="rounded-lg bg-white px-3 py-2 text-[14px] font-bold text-green-700 ring-1 ring-slate-200"
        >
          {value.length === districts.length ? "Clear all" : "All districts"}
        </button>
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
        {districts.map((district) => (
          <label key={district} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[16px] font-bold ring-1 ring-slate-100">
            <input type="checkbox" checked={value.includes(district)} onChange={() => toggle(district)} />
            {district}
          </label>
        ))}
      </div>
    </div>
  );
}
