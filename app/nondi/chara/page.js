"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import MarathiTextInput from "@/components/MarathiTextInput";
import MonthSelector from "@/components/MonthSelector";
import PageHeader from "@/components/PageHeader";
import {
  formatCurrency,
  formatMarathiDate,
  getTodayISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import {
  getAccountingPeriodLabel,
  getFeedExpenseAccountingPeriod
} from "@/lib/accountingPeriods";
import {
  displayFeedSectionName,
  FEED_SECTION_CATTLE_FEED
} from "@/lib/feedExpenseSections";
import { fetchJson } from "@/lib/offlineActions";
import { getIndiaMonthParts } from "@/lib/reportUtils";
import { transliterateMarathiText } from "@/lib/marathiTransliteration";

const inputClass =
  "min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-3 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100";

const sections = [
  {
    id: FEED_SECTION_CATTLE_FEED,
    label: displayFeedSectionName(FEED_SECTION_CATTLE_FEED),
    emoji: "🛢️",
    tone: "border-blue-200 bg-blue-50 text-blue-900",
    defaultItem: "सुग्रास",
    items: ["सुग्रास", "मका पीठ", "मिनरल मिक्स"]
  },
  {
    id: "मुरघास",
    label: "मुरघास",
    emoji: "🌽",
    tone: "border-green-200 bg-green-50 text-green-900",
    defaultItem: "मुरघास"
  },
  {
    id: "भुसा",
    label: "भुसा",
    emoji: "🌾",
    tone: "border-yellow-200 bg-yellow-50 text-yellow-900",
    defaultItem: "भुसा",
    items: ["भुसा", "कडबा", "हिरवा चारा", "गवत"]
  },
  {
    id: "इतर",
    label: "इतर खर्च",
    emoji: "🧾",
    tone: "border-slate-200 bg-slate-50 text-slate-900",
    defaultItem: "इतर",
    items: ["वाहतूक", "मजुरी", "वीज", "औषध", "इतर"]
  }
];

function getInitialMonth() {
  return getIndiaMonthParts();
}

function getSection(sectionId) {
  return sections.find((section) => section.id === sectionId) || sections[0];
}

function emptyForm(sectionId = FEED_SECTION_CATTLE_FEED) {
  const section = getSection(sectionId);

  return {
    section: section.id,
    date: getTodayISODate(),
    item_name: section.defaultItem,
    custom_item: "",
    quantity: "",
    unit: section.id === FEED_SECTION_CATTLE_FEED ? "बॅग" : section.id === "भुसा" ? "गाडी" : "किलो",
    rate: "",
    bags_count: "",
    murghas_new_bags_count: "",
    murghas_new_bag_rate: "",
    murghas_inner_count: "",
    murghas_inner_rate: "",
    murghas_filled_bags_count: "",
    murghas_filling_labor_rate: "",
    inner_material_cost: "",
    labor_cost: "",
    transport_cost: "",
    other_cost: "",
    amount: "",
    supplier_name: "",
    notes: ""
  };
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeFeedText(value) {
  const text = String(value || "").trim();
  return transliterateMarathiText(text);
}

function calculateMurghasTotal(form) {
  const newBagCost = toNumber(form.murghas_new_bags_count) * toNumber(form.murghas_new_bag_rate);
  const innerCost = toNumber(form.murghas_inner_count) * toNumber(form.murghas_inner_rate);
  const fillingLaborCost =
    toNumber(form.murghas_filled_bags_count) * toNumber(form.murghas_filling_labor_rate);

  return newBagCost + innerCost + fillingLaborCost + toNumber(form.other_cost);
}

function calculateTotal(form) {
  const quantityTotal = toNumber(form.quantity) * toNumber(form.rate);
  const bagTotal = toNumber(form.bags_count) * toNumber(form.rate);
  const directAmount = toNumber(form.amount);
  const extras =
    toNumber(form.inner_material_cost) +
    toNumber(form.labor_cost) +
    toNumber(form.transport_cost) +
    toNumber(form.other_cost);
  const murghasLegacyExtras =
    toNumber(form.inner_material_cost) + toNumber(form.labor_cost) + toNumber(form.other_cost);

  if (form.section === "मुरघास") {
    return calculateMurghasTotal(form) || murghasLegacyExtras || directAmount;
  }

  if (form.section === "भुसा") {
    return (toNumber(form.quantity) || 1) * toNumber(form.rate) + toNumber(form.other_cost);
  }

  if (form.section === FEED_SECTION_CATTLE_FEED) {
    return bagTotal;
  }

  if (quantityTotal > 0) {
    return quantityTotal + extras;
  }

  return directAmount + extras;
}

function buildPayload(form) {
  const itemName = normalizeFeedText(form.custom_item) || form.item_name || form.section;
  const isMurghas = form.section === "मुरघास";

  return {
    section: form.section,
    date: form.date,
    item_name: itemName,
    quantity: isMurghas ? "" : form.quantity,
    unit: isMurghas ? "बॅग" : form.unit,
    rate: isMurghas ? "" : form.rate,
    bags_count: isMurghas ? form.murghas_filled_bags_count : form.bags_count,
    murghas_new_bags_count: form.murghas_new_bags_count,
    murghas_new_bag_rate: form.murghas_new_bag_rate,
    murghas_inner_count: form.murghas_inner_count,
    murghas_inner_rate: form.murghas_inner_rate,
    murghas_filled_bags_count: form.murghas_filled_bags_count,
    murghas_filling_labor_rate: form.murghas_filling_labor_rate,
    inner_material_cost: isMurghas
      ? toNumber(form.murghas_inner_count) * toNumber(form.murghas_inner_rate)
      : form.inner_material_cost,
    labor_cost: isMurghas
      ? toNumber(form.murghas_filled_bags_count) * toNumber(form.murghas_filling_labor_rate)
      : form.labor_cost,
    transport_cost: isMurghas ? 0 : form.transport_cost,
    other_cost: form.other_cost,
    amount: form.amount,
    supplier_name: form.supplier_name,
    notes: form.notes
  };
}

function hasRecordValue(value) {
  return value !== null && value !== undefined && value !== "" && Number(value) !== 0;
}

function buildRecordDetails(record) {
  const parts = [formatMarathiDate(record.date)];

  if (record.section === "मुरघास") {
    if (hasRecordValue(record.murghas_new_bags_count)) {
      parts.push(`${toMarathiNumerals(record.murghas_new_bags_count)} नवीन बॅग`);
    }

    if (hasRecordValue(record.murghas_inner_count)) {
      parts.push(`${toMarathiNumerals(record.murghas_inner_count)} इनर`);
    }

    if (hasRecordValue(record.murghas_filled_bags_count || record.bags_count)) {
      parts.push(`${toMarathiNumerals(record.murghas_filled_bags_count || record.bags_count)} भरलेल्या बॅग`);
    }

    return parts.join(" · ");
  }

  if (record.section === FEED_SECTION_CATTLE_FEED) {
    if (hasRecordValue(record.bags_count || record.quantity)) {
      parts.push(`${toMarathiNumerals(record.bags_count || record.quantity)} बॅग`);
    }

    return parts.join(" · ");
  }

  if (hasRecordValue(record.quantity)) {
    parts.push(`${toMarathiNumerals(record.quantity)} ${record.unit || ""}`.trim());
  }

  if (hasRecordValue(record.bags_count)) {
    parts.push(`${toMarathiNumerals(record.bags_count)} बॅग`);
  }

  return parts.join(" · ");
}

function VoiceButton({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="आवाजाने भरा"
      className={`min-h-[56px] min-w-[56px] rounded-lg border-2 text-[22px] font-extrabold ${
        active
          ? "border-green-300 bg-green-100 text-sheti"
          : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
      }`}
    >
      🎙️
    </button>
  );
}

function TextWithVoice({ value, onChange, placeholder, field, voiceField, startVoice }) {
  return (
    <MarathiTextInput
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      className={inputClass}
      rightAdornment={<VoiceButton active={voiceField === field} onClick={() => startVoice(field)} />}
    />
  );
}

export default function CharaCostPage() {
  const [monthValue, setMonthValue] = useState(getInitialMonth);
  const [activeSection, setActiveSection] = useState(FEED_SECTION_CATTLE_FEED);
  const [form, setForm] = useState(() => emptyForm(FEED_SECTION_CATTLE_FEED));
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0, bySection: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [voiceField, setVoiceField] = useState("");

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJson(
        `/api/feed-expenses?month=${monthValue.month}&year=${monthValue.year}`,
        { unwrapData: false }
      );

      setRecords(result.data || []);
      setSummary(result.summary || { total: 0, count: 0, bySection: [] });
    } catch (fetchError) {
      setError(fetchError.message || "चारा खर्च मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, [monthValue]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
    setError("");
    setSuccess("");
  }

  function changeSection(sectionId) {
    setActiveSection(sectionId);
    setForm(emptyForm(sectionId));
    setError("");
    setSuccess("");
  }

  function selectItem(itemName) {
    setForm((currentForm) => ({
      ...currentForm,
      item_name: itemName,
      custom_item: ""
    }));
  }

  function startVoice(field) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("या फोनमध्ये आवाजाने भरण्याची सुविधा उपलब्ध नाही.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "mr-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceField(field);
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      updateField(field, normalizeFeedText(text));
    };
    recognition.onend = () => setVoiceField("");
    recognition.onerror = () => {
      setVoiceField("");
      setError("आवाज ओळखता आला नाही.");
    };
    recognition.start();
  }

  async function saveExpense(event) {
    event.preventDefault();
    const total = calculateTotal(form);

    if (total <= 0) {
      setError("खर्चाची रक्कम भरा.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await fetchJson("/api/feed-expenses", {
        method: "POST",
        body: JSON.stringify(buildPayload(form))
      });

      setSuccess(`${displayFeedSectionName(form.section)} खर्च जतन झाला: ${formatCurrency(total)}`);
      setForm(emptyForm(activeSection));
      await fetchExpenses();
    } catch (saveError) {
      setError(saveError.message || "चारा खर्च जतन झाला नाही.");
    } finally {
      setSaving(false);
    }
  }

  const activeConfig = getSection(activeSection);
  const activeRecords = useMemo(
    () => records.filter((record) => record.section === activeSection),
    [activeSection, records]
  );
  const sectionTotals = useMemo(() => {
    return new Map((summary.bySection || []).map((item) => [item.section, item.amount]));
  }, [summary.bySection]);
  const totalCost = calculateTotal(form);
  const activePeriod = getFeedExpenseAccountingPeriod(activeSection);
  const activePeriodLabel = getAccountingPeriodLabel(activePeriod);

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="🌾 चारा खर्च" subtitle="खाद्य मासिक, मुरघास/भुसा वार्षिक" />
      <MonthSelector value={monthValue} onChange={setMonthValue} />

      {loading ? <LoadingState text="चारा खर्च लोड होत आहे..." /> : null}
      {error ? <ErrorState message={error} onRetry={fetchExpenses} /> : null}

      <section className="grid grid-cols-2 gap-3" aria-label="चारा खर्च विभाग">
        {sections.map((section) => {
          const active = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => changeSection(section.id)}
              className={`min-h-[112px] rounded-lg border-2 p-3 text-left shadow-soft ${
                active ? section.tone : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              <span className="block text-[30px] leading-none" aria-hidden="true">
                {section.emoji}
              </span>
              <span className="mt-2 block text-[21px] font-extrabold leading-tight">
                {section.label}
              </span>
              <span className="mt-1 block text-[15px] font-extrabold">
                {getAccountingPeriodLabel(getFeedExpenseAccountingPeriod(section.id))}
              </span>
              <span className="mt-1 block text-[17px] font-bold">
                {formatCurrency(sectionTotals.get(section.id) || 0)}
              </span>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="चारा खर्च सारांश">
        <article className="rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="text-[18px] font-extrabold text-green-900">मासिक खर्च</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-green-950">
            {formatCurrency(summary.monthlyTotal || summary.total || 0)}
          </p>
          <p className="mt-1 text-[15px] font-bold text-green-800">खाद्य + इतर</p>
        </article>
        <article className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-[18px] font-extrabold text-blue-900">वार्षिक खर्च</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-blue-950">
            {formatCurrency(summary.annualTotal || 0)}
          </p>
          <p className="mt-1 text-[15px] font-bold text-blue-800">मुरघास + भुसा</p>
        </article>
      </section>

      <form onSubmit={saveExpense} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            {activeConfig.emoji} {activeConfig.label}
          </h2>
          <p className="rounded-lg bg-green-50 px-3 py-2 text-[20px] font-extrabold text-sheti">
            {activePeriodLabel} · {formatCurrency(totalCost)}
          </p>
        </div>

        <FormField label="तारीख" required>
          <input
            type="date"
            value={form.date}
            onChange={(event) => updateField("date", event.target.value)}
            className={inputClass}
            required
          />
        </FormField>

        {activeConfig.items ? (
          <div>
            <p className="mb-2 text-[20px] font-extrabold text-slate-900">नाव</p>
            <div className="grid grid-cols-2 gap-2">
              {activeConfig.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectItem(item)}
                  className={`min-h-[52px] rounded-lg border-2 px-3 text-[18px] font-extrabold ${
                    form.item_name === item && !form.custom_item
                      ? "border-green-300 bg-green-100 text-sheti"
                      : "border-slate-200 bg-white text-slate-700 active:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <TextWithVoice
                field="custom_item"
                value={form.custom_item}
                onChange={(value) => updateField("custom_item", value)}
                placeholder="नवीन नाव"
                voiceField={voiceField}
                startVoice={startVoice}
              />
            </div>
          </div>
        ) : null}

        {activeSection === "मुरघास" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="नवीन बॅग">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.murghas_new_bags_count}
                  onChange={(event) => updateField("murghas_new_bags_count", event.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="प्रति बॅग दर">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.murghas_new_bag_rate}
                  onChange={(event) => updateField("murghas_new_bag_rate", event.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="प्लास्टिक इनर">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.murghas_inner_count}
                  onChange={(event) => updateField("murghas_inner_count", event.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="प्रति इनर दर">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.murghas_inner_rate}
                  onChange={(event) => updateField("murghas_inner_rate", event.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="भरलेल्या बॅग">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.murghas_filled_bags_count}
                  onChange={(event) => updateField("murghas_filled_bags_count", event.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="मजुरी / बॅग">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.murghas_filling_labor_rate}
                  onChange={(event) => updateField("murghas_filling_labor_rate", event.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>
        ) : activeSection === FEED_SECTION_CATTLE_FEED ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="एकूण बॅग">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.bags_count}
                onChange={(event) => updateField("bags_count", event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="दर">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(event) => updateField("rate", event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="एकक">
              <input type="text" value="बॅग" readOnly className={inputClass} />
            </FormField>
          </div>
        ) : activeSection === "भुसा" ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="एकूण गाड्या">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={form.quantity}
                onChange={(event) => updateField("quantity", event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="दर">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(event) => updateField("rate", event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="एकक">
              <input type="text" value="गाडी" readOnly className={inputClass} />
            </FormField>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="प्रमाण">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={(event) => updateField("quantity", event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="दर">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.rate}
                onChange={(event) => updateField("rate", event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="एकक">
              <select
                value={form.unit}
                onChange={(event) => updateField("unit", event.target.value)}
                className={inputClass}
              >
                {["किलो", "बॅग", "टन", "गाडी", "नग"].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="थेट रक्कम">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        )}

        {activeSection === "इतर" ? (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="मजुरी">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={form.labor_cost}
                onChange={(event) => updateField("labor_cost", event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="वाहतूक">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={form.transport_cost}
                onChange={(event) => updateField("transport_cost", event.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        ) : null}

        {activeSection === "मुरघास" ? (
          <FormField label="इतर खर्च">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={form.other_cost}
              onChange={(event) => updateField("other_cost", event.target.value)}
              className={inputClass}
            />
          </FormField>
        ) : null}

        <FormField label="पुरवठादार">
          <TextWithVoice
            field="supplier_name"
            value={form.supplier_name}
            onChange={(value) => updateField("supplier_name", value)}
            placeholder="नाव"
            voiceField={voiceField}
            startVoice={startVoice}
          />
        </FormField>

        <FormField label="नोंद">
          <MarathiTextInput
            multiline
            value={form.notes}
            onValueChange={(value) => updateField("notes", value)}
            rows={3}
            className="min-h-[96px] w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-3 text-[20px] font-bold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
            rightAdornment={<VoiceButton active={voiceField === "notes"} onClick={() => startVoice("notes")} />}
          />
        </FormField>

        <button
          type="submit"
          disabled={saving}
          className="min-h-[58px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
        >
          {saving ? "जतन होत आहे..." : `${activeConfig.label} ${activePeriodLabel} खर्च जतन करा`}
        </button>

        {success ? (
          <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-[19px] font-extrabold text-green-800">
            {success}
          </p>
        ) : null}
      </form>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            {activePeriodLabel} इतिहास
          </h2>
          <p className="text-[19px] font-extrabold text-slate-700">
            {formatCurrency(sectionTotals.get(activeSection) || 0)}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {!loading && activeRecords.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
              अजून नोंदी नाहीत.
            </p>
          ) : null}

          {activeRecords.slice(0, 12).map((record) => (
            <article key={record.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[20px] font-extrabold text-slate-950">{record.item_name}</p>
                  <p className="mt-1 text-[17px] font-bold text-slate-600">{buildRecordDetails(record)}</p>
                  <p className="mt-1 text-[16px] font-extrabold text-slate-500">
                    {getAccountingPeriodLabel(record.accounting_period || getFeedExpenseAccountingPeriod(record.section))}
                  </p>
                  {record.supplier_name ? (
                    <p className="mt-1 text-[17px] font-bold text-slate-500">
                      {record.supplier_name}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-[20px] font-extrabold text-red-700">
                  {formatCurrency(record.total_cost)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
