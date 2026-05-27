"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AnimalPhotoInput from "@/components/AnimalPhotoInput";
import CowSelector from "@/components/CowSelector";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { calfStatuses } from "@/lib/calfLifecycle";
import {
  addDaysToDate,
  formatCowBreed,
  formatCurrency,
  formatMarathiDate,
  getTodayISODate,
  toISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { fetchJson } from "@/lib/offlineActions";

const statusFilters = [
  { value: "all", label: "सर्व" },
  { value: "active", label: "सक्रिय" },
  { value: "historical", label: "जन्म नोंद" },
  { value: "sold", label: "विकली" },
  { value: "dead", label: "मृत" },
  { value: "converted_to_cow", label: "गाय झाली" }
];

const ageFilters = [
  { value: "all", label: "सर्व वय" },
  { value: "0-60", label: "०-२ महिने" },
  { value: "61-180", label: "२-६ महिने" },
  { value: "181+", label: "६ महिने +" }
];

const breedOptions = [
  { value: "HF", label: "एच एफ" },
  { value: "गीर", label: "गीर" },
  { value: "साहिवाल", label: "साहिवाल" },
  { value: "देशी", label: "देशी" },
  { value: "जर्सी", label: "जर्सी" },
  { value: "इतर", label: "इतर" }
];

const defaultBreed = "जर्सी";

function getAgeDays(birthDate) {
  if (!birthDate) {
    return 0;
  }

  const birth = new Date(`${birthDate}T00:00:00`);
  const today = new Date(`${getTodayISODate()}T00:00:00`);
  return Math.max(0, Math.floor((today - birth) / 86400000));
}

function matchesAgeFilter(calf, filter) {
  const days = getAgeDays(calf.birth_date);

  if (filter === "0-60") {
    return days <= 60;
  }

  if (filter === "61-180") {
    return days > 60 && days <= 180;
  }

  if (filter === "181+") {
    return days > 180;
  }

  return true;
}

function VoiceButton({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[56px] min-w-[56px] rounded-lg border-2 text-[22px] font-extrabold ${
        active ? "border-green-300 bg-green-100 text-sheti" : "border-slate-200 bg-white text-slate-700"
      }`}
      aria-label="आवाजाने लिहा"
    >
      🎤
    </button>
  );
}

function getCalfTitle(calf) {
  return calf.name || (calf.gender === "मादी" ? "मादी वासरी" : "नर वासरू");
}

function CalfCard({ calf, onEdit, onStatusChange }) {
  const canChangeStatus = ["active", "historical"].includes(calf.status);
  const statusActions = [
    { status: "sold", label: "विकली" },
    { status: "dead", label: "मृत" },
    ...(calf.gender === "मादी" ? [{ status: "converted_to_cow", label: "गाय झाली" }] : [])
  ];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {calf.photo_url ? (
            <img src={calf.photo_url} alt={getCalfTitle(calf)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[42px]">🐮</div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-[24px] font-extrabold leading-tight text-slate-950">
            {getCalfTitle(calf)}
          </h2>
          <p className="mt-1 text-[18px] font-bold text-slate-700">
            जन्म: {formatMarathiDate(calf.birth_date)} | वय: {calf.age_text}
          </p>
          <p className="mt-1 text-[18px] font-bold text-slate-700">
            आई: {calf.mother?.name || "माहिती नाही"}
          </p>
          <p className="mt-1 text-[18px] font-bold text-slate-700">
            लिंग: {calf.gender} | जात: {formatCowBreed(calf.breed)}
          </p>
          {calf.color ? (
            <p className="mt-1 text-[18px] font-bold text-slate-700">रंग: {calf.color}</p>
          ) : null}
          {calf.identification_mark ? (
            <p className="mt-1 text-[18px] font-bold text-slate-700">
              ओळख खूण: {calf.identification_mark}
            </p>
          ) : null}
          {calf.notes ? (
            <p className="mt-2 text-[18px] font-semibold leading-snug text-slate-600">
              {calf.notes}
            </p>
          ) : null}
        </div>
        <p className="ml-auto shrink-0 rounded-full bg-green-50 px-3 py-1 text-[16px] font-extrabold text-sheti">
          {calfStatuses[calf.status] || calf.status}
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-yellow-950">
        <p className="text-[18px] font-extrabold">दूध स्थिती</p>
        <p className="mt-1 text-[20px] font-extrabold">{calf.milk_status_label}</p>
        {calf.is_raised ? (
          <p className="mt-1 text-[17px] font-bold">
            कमी: {formatMarathiDate(calf.milk_reduce_date)} | बंद: {formatMarathiDate(calf.milk_stop_date)}
          </p>
        ) : null}
      </div>

      {calf.status === "sold" ? (
        <div className="mt-3 rounded-lg bg-green-50 p-3 text-green-950">
          <p className="text-[18px] font-extrabold">विक्री माहिती</p>
          <p className="mt-1 text-[18px] font-bold">
            तारीख: {formatMarathiDate(calf.sold_date)} | रक्कम: {formatCurrency(calf.sale_amount || 0)}
          </p>
          {calf.sale_notes ? (
            <p className="mt-1 text-[17px] font-semibold leading-snug">{calf.sale_notes}</p>
          ) : null}
        </div>
      ) : null}

      {calf.status === "converted_to_cow" ? (
        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-blue-950">
          <p className="text-[18px] font-extrabold">गायीच्या यादीत जोडली</p>
          {calf.converted_cow ? (
            <Link
              href={`/gayi/${calf.converted_cow.id}`}
              className="mt-2 inline-flex min-h-[46px] items-center rounded-lg bg-white px-3 text-[18px] font-extrabold text-blue-900 shadow-sm active:bg-blue-100"
            >
              🐄 {calf.converted_cow.name} बघा
            </Link>
          ) : (
            <p className="mt-1 text-[17px] font-bold">गाय नोंद सापडली नाही.</p>
          )}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={() => onEdit(calf)}
          className="min-h-[50px] rounded-lg border-2 border-green-200 bg-green-50 px-3 text-[17px] font-extrabold text-sheti active:bg-green-100"
        >
          ✏️ संपादित करा
        </button>

        {canChangeStatus ? (
          <div className={`grid gap-2 ${statusActions.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {statusActions.map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() => onStatusChange(calf, action.status)}
              className="min-h-[48px] rounded-lg border-2 border-slate-200 bg-slate-50 px-2 text-[16px] font-extrabold text-slate-800 active:bg-green-50"
            >
              {action.label}
            </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function emptyForm() {
  return {
    birth_date: getTodayISODate(),
    gender: "मादी",
    is_raised: "हो",
    name: "",
    color: "",
    breed: "",
    identification_mark: "",
    notes: "",
    status: "active",
    sold_date: getTodayISODate(),
    sale_amount: "",
    sale_notes: "",
    photo_url: "",
    photo_storage_path: ""
  };
}

function emptyConversionForm(calf) {
  return {
    cow_name: calf ? getCalfTitle(calf) : "",
    breed: calf?.breed || defaultBreed,
    color: calf?.color || "",
    tag_number: calf?.identification_mark || "",
    ai_date: getTodayISODate(),
    bull_code: "",
    bull_breed: defaultBreed,
    doctor_name: "",
    cost: "",
    notes: ""
  };
}

export default function CalvesPage() {
  const [calves, setCalves] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const [ageFilter, setAgeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedCow, setSelectedCow] = useState(null);
  const [editingCalfId, setEditingCalfId] = useState(null);
  const [conversionCalf, setConversionCalf] = useState(null);
  const [conversionForm, setConversionForm] = useState(() => emptyConversionForm(null));
  const [conversionSaving, setConversionSaving] = useState(false);
  const [voiceField, setVoiceField] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchCalves = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchJson("/api/calves", { unwrapData: false });
      setCalves(result.data || []);
      setSummary(result.summary || null);
    } catch (fetchError) {
      setError(fetchError.message || "वासरांची माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalves();
  }, [fetchCalves]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "status" && value === "sold" && !current.sold_date) {
        next.sold_date = getTodayISODate();
      }

      return next;
    });
    setMessage("");
    setError("");
  }

  function updateConversionField(field, value) {
    setConversionForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function resetForm() {
    setForm(emptyForm());
    setSelectedCow(null);
    setEditingCalfId(null);
    setFormOpen(false);
  }

  function closeConversionForm() {
    setConversionCalf(null);
    setConversionForm(emptyConversionForm(null));
    setConversionSaving(false);
  }

  function openAddForm() {
    if (formOpen && !editingCalfId) {
      resetForm();
      return;
    }

      setForm(emptyForm());
      setSelectedCow(null);
      setEditingCalfId(null);
      closeConversionForm();
      setFormOpen(true);
      setMessage("");
      setError("");
  }

  function startEdit(calf) {
    setEditingCalfId(calf.id);
    setForm({
      birth_date: calf.birth_date || getTodayISODate(),
      gender: calf.gender || "मादी",
      is_raised: calf.is_raised ? "हो" : "नाही",
      name: calf.name || "",
      color: calf.color || "",
      breed: calf.breed || "",
      identification_mark: calf.identification_mark || "",
      notes: calf.notes || "",
      status: calf.status || "active",
      sold_date: calf.sold_date || getTodayISODate(),
      sale_amount: calf.sale_amount ? String(calf.sale_amount) : "",
      sale_notes: calf.sale_notes || "",
      photo_url: calf.photo_url || "",
      photo_storage_path: calf.photo_storage_path || ""
    });
    setSelectedCow(calf.mother || null);
    closeConversionForm();
    setFormOpen(true);
    setMessage("");
    setError("");
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function startVoice(field) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("या मोबाईलमध्ये आवाजाने लिहिण्याची सुविधा उपलब्ध नाही.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "mr-IN";
    recognition.interimResults = false;
    setVoiceField(field);
    recognition.onresult = (event) => {
      updateField(field, event.results?.[0]?.[0]?.transcript || "");
    };
    recognition.onend = () => setVoiceField("");
    recognition.onerror = () => {
      setVoiceField("");
      setError("आवाज ओळखता आला नाही.");
    };
    recognition.start();
  }

  const filteredCalves = useMemo(() => {
    return calves.filter((calf) => {
      const statusMatches = statusFilter === "all" || calf.status === statusFilter;
      return statusMatches && matchesAgeFilter(calf, ageFilter);
    });
  }, [ageFilter, calves, statusFilter]);

  async function submitCalf(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        mother_cow_id: selectedCow?.id || null,
        birth_date: form.birth_date,
        gender: form.gender,
        is_raised: form.gender === "मादी" && form.is_raised === "हो",
        name: form.name.trim() || null,
        color: form.color.trim() || null,
        breed: form.breed.trim() || selectedCow?.breed || null,
        identification_mark: form.identification_mark.trim() || null,
        photo_url: form.photo_url || null,
        photo_storage_path: form.photo_storage_path || null,
        notes: form.notes.trim() || null
      };

      if (editingCalfId) {
        payload.id = editingCalfId;
        payload.status = form.status;

        if (form.status === "sold") {
          payload.sold_date = form.sold_date || getTodayISODate();
          payload.sale_amount = form.sale_amount;
          payload.sale_notes = form.sale_notes.trim() || null;
        }
      }

      await fetchJson("/api/calves", {
        method: editingCalfId ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });

      setMessage(editingCalfId ? "✅ वासराची माहिती बदलली." : "✅ वासराची नोंद जतन झाली.");
      resetForm();
      fetchCalves();
    } catch (saveError) {
      setError(saveError.message || "वासराची नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(calf, status) {
    setError("");
    setMessage("");

    try {
      const statusLabel = calfStatuses[status] || status;
      const calfTitle = getCalfTitle(calf);
      const payload = { id: calf.id, status };

      if (status === "sold") {
        const confirmed = window.confirm(
          `${calfTitle} विकली म्हणून नोंद करायची आहे का? ही रक्कम उत्पन्न आणि नफा मध्ये जोडली जाईल.`
        );

        if (!confirmed) {
          return;
        }

        const amount = window.prompt("किती रुपयांना विकली? फक्त रक्कम लिहा.");

        if (amount === null) {
          return;
        }

        if (!String(amount).trim()) {
          setError("विक्रीची रक्कम आवश्यक आहे.");
          return;
        }

        const saleNotes = window.prompt("विक्रीची छोटी नोंद (ऐच्छिक)", "") || "";
        payload.sold_date = getTodayISODate();
        payload.sale_amount = amount;
        payload.sale_notes = saleNotes.trim() || null;
      } else if (status === "converted_to_cow") {
        setFormOpen(false);
        setConversionCalf(calf);
        setConversionForm(emptyConversionForm(calf));
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
        return;
      } else {
        const confirmed = window.confirm(`${calfTitle} ची स्थिती '${statusLabel}' करायची आहे का?`);

        if (!confirmed) {
          return;
        }
      }

      await fetchJson("/api/calves", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      setMessage(
        status === "sold"
          ? "✅ वासराची विक्री नोंद झाली. रक्कम उत्पन्न आणि नफा मध्ये जोडली."
          : "✅ वासराची स्थिती बदलली."
      );
      fetchCalves();
    } catch (statusError) {
      setError(statusError.message || "स्थिती बदलली नाही.");
    }
  }

  const conversionDates = useMemo(() => {
    return {
      pregnancyCheckDate: toISODate(addDaysToDate(conversionForm.ai_date, 60)),
      expectedCalvingDate: toISODate(addDaysToDate(conversionForm.ai_date, 270))
    };
  }, [conversionForm.ai_date]);

  async function submitConversion(event) {
    event.preventDefault();

    if (!conversionCalf) {
      return;
    }

    if (!conversionForm.cow_name.trim()) {
      setError("गायीचे नाव लिहा.");
      return;
    }

    if (!conversionForm.ai_date) {
      setError("रेतन तारीख निवडा.");
      return;
    }

    setConversionSaving(true);
    setError("");
    setMessage("");

    try {
      await fetchJson("/api/calves", {
        method: "PATCH",
        body: JSON.stringify({
          id: conversionCalf.id,
          status: "converted_to_cow",
          conversion: {
            cow_name: conversionForm.cow_name.trim(),
            breed: conversionForm.breed || defaultBreed,
            color: conversionForm.color.trim() || null,
            tag_number: conversionForm.tag_number.trim() || null,
            ai_date: conversionForm.ai_date,
            bull_code: conversionForm.bull_code.trim() || null,
            bull_breed: conversionForm.bull_breed || defaultBreed,
            doctor_name: conversionForm.doctor_name.trim() || null,
            cost: conversionForm.cost === "" ? null : conversionForm.cost,
            pregnancy_check_date: conversionDates.pregnancyCheckDate,
            notes: conversionForm.notes.trim() || null
          }
        })
      });

      setMessage("✅ वासरी गाय म्हणून जोडली आणि कृत्रिम रेतन नोंद जतन झाली.");
      setStatusFilter("converted_to_cow");
      closeConversionForm();
      fetchCalves();
    } catch (conversionError) {
      setError(conversionError.message || "गाय आणि रेतन नोंद जतन झाली नाही.");
    } finally {
      setConversionSaving(false);
    }
  }

  if (loading) {
    return <LoadingState text="वासरे लोड होत आहेत..." />;
  }

  if (error && calves.length === 0) {
    return <ErrorState message={error} onRetry={fetchCalves} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="🐮 वासरे" subtitle="वासरांची वाढ, दूध आणि आई गाय" />

      <section className="grid grid-cols-2 gap-3">
        <SummaryCard emoji="🐮" title="सक्रिय वासरे" value={toMarathiNumerals(summary?.active || 0)} color="green" />
        <SummaryCard emoji="🥛" title="दूध सुरू" value={toMarathiNumerals(summary?.milkFeeding || 0)} color="yellow" />
        <SummaryCard emoji="📝" title="जन्म नोंदी" value={toMarathiNumerals(summary?.historical || 0)} color="slate" />
        <SummaryCard emoji="📦" title="विकली" value={toMarathiNumerals(summary?.sold || 0)} color="purple" />
      </section>

      <button
        type="button"
        onClick={formOpen ? resetForm : openAddForm}
        className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm active:bg-green-700"
      >
        {formOpen ? "फॉर्म बंद करा" : "➕ जुने / नवीन वासरू जोडा"}
      </button>

      {formOpen ? (
        <form onSubmit={submitCalf} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-[24px] font-extrabold text-slate-950">
            {editingCalfId ? "वासरू संपादित करा" : "वासरू जोडा"}
          </h2>

          <FormField label="जन्म तारीख" required>
            <input
              type="date"
              required
              value={form.birth_date}
              onChange={(event) => updateField("birth_date", event.target.value)}
              className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
            />
          </FormField>

          <FormField label="आई गाय">
            <CowSelector
              selectedCow={selectedCow}
              onSelect={setSelectedCow}
              placeholder="आई गायीचे नाव शोधा..."
            />
          </FormField>

          <div>
            <p className="mb-2 text-[20px] font-extrabold text-slate-900">लिंग</p>
            <div className="grid grid-cols-2 gap-3">
              {["मादी", "नर"].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => updateField("gender", gender)}
                  className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                    form.gender === gender
                      ? "border-green-300 bg-green-100 text-sheti"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {gender === "मादी" ? "🐄 मादी" : "🐂 नर"}
                </button>
              ))}
            </div>
          </div>

          {form.gender === "मादी" ? (
            <div>
              <p className="mb-2 text-[20px] font-extrabold text-slate-900">
                आपल्याला ही वासरी पाळायची आहे का?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {["हो", "नाही"].map((answer) => (
                  <button
                    key={answer}
                    type="button"
                    onClick={() => updateField("is_raised", answer)}
                    className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                      form.is_raised === answer
                        ? "border-green-300 bg-green-100 text-sheti"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {answer === "हो" ? "✅ हो" : "नाही"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <AnimalPhotoInput
            label="वासराचा फोटो"
            animalType="calf"
            value={{ photo_url: form.photo_url, photo_storage_path: form.photo_storage_path }}
            onChange={(photo) => {
              updateField("photo_url", photo.photo_url || "");
              updateField("photo_storage_path", photo.photo_storage_path || "");
            }}
          />

          {form.gender === "मादी" && form.is_raised === "हो" ? (
            <>
              <FormField label="वासरीचे नाव">
                <MarathiTextInput
                  value={form.name}
                  onValueChange={(value) => updateField("name", value)}
                  rightAdornment={<VoiceButton active={voiceField === "name"} onClick={() => startVoice("name")} />}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
                />
              </FormField>
              <FormField label="रंग">
                <MarathiTextInput
                  value={form.color}
                  onValueChange={(value) => updateField("color", value)}
                  rightAdornment={<VoiceButton active={voiceField === "color"} onClick={() => startVoice("color")} />}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
                />
              </FormField>
              <FormField label="जात">
                <MarathiTextInput
                  value={form.breed}
                  onValueChange={(value) => updateField("breed", value)}
                  placeholder={selectedCow?.breed || "जर्सी"}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
                />
              </FormField>
              <FormField label="ओळख खूण">
                <MarathiTextInput
                  value={form.identification_mark}
                  onValueChange={(value) => updateField("identification_mark", value)}
                  rightAdornment={
                    <VoiceButton
                      active={voiceField === "identification_mark"}
                      onClick={() => startVoice("identification_mark")}
                    />
                  }
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
                />
              </FormField>
            </>
          ) : null}

          <FormField label="नोंद">
            <MarathiTextInput
              multiline
              rows={4}
              value={form.notes}
              onValueChange={(value) => updateField("notes", value)}
              rightAdornment={<VoiceButton active={voiceField === "notes"} onClick={() => startVoice("notes")} />}
              className="min-h-[132px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
            />
          </FormField>

          {editingCalfId ? (
            <div>
              <p className="mb-2 text-[20px] font-extrabold text-slate-900">स्थिती</p>
              <div className="grid grid-cols-2 gap-3">
                {statusFilters
                  .filter(
                    (filter) =>
                      filter.value !== "all" &&
                      (filter.value !== "converted_to_cow" || form.status === "converted_to_cow")
                  )
                  .map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => updateField("status", status.value)}
                      className={`min-h-[56px] rounded-lg border-2 px-3 text-[18px] font-extrabold ${
                        form.status === status.value
                          ? "border-green-300 bg-green-100 text-sheti"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}

          {editingCalfId && form.status === "sold" ? (
            <div className="space-y-4 rounded-lg border border-green-100 bg-green-50 p-3">
              <FormField label="विक्री तारीख" required>
                <input
                  type="date"
                  required
                  value={form.sold_date}
                  onChange={(event) => updateField("sold_date", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-green-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
                />
              </FormField>

              <FormField label="विक्री रक्कम" required>
                <div className="grid grid-cols-[auto_1fr] items-center rounded-lg border-2 border-green-200 bg-white focus-within:border-sheti">
                  <span className="px-4 text-[22px] font-extrabold text-slate-700">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.sale_amount}
                    onChange={(event) => updateField("sale_amount", event.target.value)}
                    className="min-h-[56px] w-full rounded-r-lg border-0 bg-transparent px-2 text-[20px] font-semibold text-slate-950 outline-none"
                  />
                </div>
              </FormField>

              <FormField label="विक्री नोंद">
                <MarathiTextInput
                  value={form.sale_notes}
                  onValueChange={(value) => updateField("sale_notes", value)}
                  rightAdornment={
                    <VoiceButton active={voiceField === "sale_notes"} onClick={() => startVoice("sale_notes")} />
                  }
                  className="min-h-[56px] w-full rounded-lg border-2 border-green-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
                />
              </FormField>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
          >
            {saving ? "⏳ जतन होत आहे..." : editingCalfId ? "✅ बदल जतन करा" : "✅ वासरू जतन करा"}
          </button>
        </form>
      ) : null}

      {conversionCalf ? (
        <form onSubmit={submitConversion} className="space-y-4 rounded-lg border border-blue-200 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-extrabold text-slate-950">गाय झाली</h2>
              <p className="mt-1 text-[18px] font-bold text-slate-600">
                {getCalfTitle(conversionCalf)} साठी गाय आणि रेतन नोंद
              </p>
            </div>
            <button
              type="button"
              onClick={closeConversionForm}
              className="min-h-[48px] min-w-[48px] rounded-lg border-2 border-slate-200 bg-white text-[22px] font-extrabold active:bg-slate-100"
              aria-label="बंद करा"
            >
              ✕
            </button>
          </div>

          <section className="space-y-4 rounded-lg bg-blue-50 p-3">
            <h3 className="text-[21px] font-extrabold text-blue-950">गायीची माहिती</h3>
            <FormField label="गायीचे नाव" required>
              <MarathiTextInput
                value={conversionForm.cow_name}
                onValueChange={(value) => updateConversionField("cow_name", value)}
                required
                className="min-h-[56px] w-full rounded-lg border-2 border-blue-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              />
            </FormField>

            <FormField label="जात" required>
              <select
                value={conversionForm.breed}
                onChange={(event) => updateConversionField("breed", event.target.value)}
                required
                className="min-h-[56px] w-full rounded-lg border-2 border-blue-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              >
                {breedOptions.map((breed) => (
                  <option key={breed.value} value={breed.value}>
                    {breed.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="रंग">
              <MarathiTextInput
                value={conversionForm.color}
                onValueChange={(value) => updateConversionField("color", value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-blue-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              />
            </FormField>

            <FormField label="कान टॅग नंबर">
              <input
                type="text"
                value={conversionForm.tag_number}
                onChange={(event) => updateConversionField("tag_number", event.target.value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-blue-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              />
            </FormField>
          </section>

          <section className="space-y-4 rounded-lg bg-green-50 p-3">
            <h3 className="text-[21px] font-extrabold text-green-950">कृत्रिम रेतन</h3>
            <FormField label="रेतन तारीख" required>
              <input
                type="date"
                required
                value={conversionForm.ai_date}
                onChange={(event) => updateConversionField("ai_date", event.target.value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-green-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              />
            </FormField>

            <FormField label="सिमेन / बैल कोड">
              <input
                type="text"
                value={conversionForm.bull_code}
                onChange={(event) => updateConversionField("bull_code", event.target.value)}
                placeholder="उदा. एच एफ-२३४१"
                className="min-h-[56px] w-full rounded-lg border-2 border-green-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              />
            </FormField>

            <FormField label="बैलाची जात">
              <select
                value={conversionForm.bull_breed}
                onChange={(event) => updateConversionField("bull_breed", event.target.value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-green-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              >
                {breedOptions.map((breed) => (
                  <option key={breed.value} value={breed.value}>
                    {breed.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="पशुवैद्यकाचे नाव">
              <MarathiTextInput
                value={conversionForm.doctor_name}
                onValueChange={(value) => updateConversionField("doctor_name", value)}
                className="min-h-[56px] w-full rounded-lg border-2 border-green-100 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              />
            </FormField>

            <FormField label="रेतन खर्च">
              <div className="grid grid-cols-[auto_1fr] items-center rounded-lg border-2 border-green-100 bg-white focus-within:border-sheti">
                <span className="px-4 text-[22px] font-extrabold text-slate-700">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={conversionForm.cost}
                  onChange={(event) => updateConversionField("cost", event.target.value)}
                  className="min-h-[56px] w-full rounded-r-lg border-0 bg-transparent px-2 text-[20px] font-semibold text-slate-950 outline-none"
                />
              </div>
            </FormField>

            <FormField label="नोंद">
              <MarathiTextInput
                multiline
                rows={3}
                value={conversionForm.notes}
                onValueChange={(value) => updateConversionField("notes", value)}
                className="min-h-[112px] w-full rounded-lg border-2 border-green-100 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti"
              />
            </FormField>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-yellow-950">
              <p className="text-[18px] font-extrabold">आठवणी</p>
              <p className="mt-1 text-[17px] font-bold">
                गर्भधारणा तपासणी: {formatMarathiDate(conversionDates.pregnancyCheckDate)}
              </p>
              <p className="mt-1 text-[17px] font-bold">
                अपेक्षित व्यायण: {formatMarathiDate(conversionDates.expectedCalvingDate)}
              </p>
            </div>
          </section>

          <button
            type="submit"
            disabled={conversionSaving}
            className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
          >
            {conversionSaving ? "⏳ जतन होत आहे..." : "✅ गाय आणि रेतन नोंद जतन करा"}
          </button>
        </form>
      ) : null}

      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-[20px] font-extrabold text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-[24px] font-extrabold text-slate-950">फिल्टर</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`min-h-[48px] shrink-0 rounded-lg border-2 px-3 text-[17px] font-extrabold ${
                statusFilter === filter.value
                  ? "border-green-300 bg-green-100 text-sheti"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {ageFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setAgeFilter(filter.value)}
              className={`min-h-[48px] shrink-0 rounded-lg border-2 px-3 text-[17px] font-extrabold ${
                ageFilter === filter.value
                  ? "border-yellow-300 bg-yellow-100 text-yellow-900"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {filteredCalves.map((calf) => (
          <CalfCard key={calf.id} calf={calf} onEdit={startEdit} onStatusChange={updateStatus} />
        ))}

        {filteredCalves.length === 0 ? (
          <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
            या फिल्टरमध्ये वासरे नाहीत.
          </p>
        ) : null}
      </section>
    </div>
  );
}
