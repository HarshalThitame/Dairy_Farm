"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorState from "@/components/ErrorState";
import FormField from "@/components/FormField";
import LoadingState from "@/components/LoadingState";
import MarathiTextInput from "@/components/MarathiTextInput";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  addDaysToDate,
  formatMarathiDate,
  getTodayISODate,
  toISODate,
  toMarathiNumerals
} from "@/lib/marathiUtils";
import { getReminderDayDistance, getReminderEmoji } from "@/lib/reminderUtils";
import {
  fetchCows as fetchCowsOffline,
  saveCalvingRecord
} from "@/lib/offlineActions";
async function fetchAllAIRecords() {
  try {
    const response = await fetch("/api/ai?summary=true", { cache: "no-store" });
    const result = await response.json();

    if (response.ok) {
      return result.data || [];
    }
  } catch {
    // The page can still render cows without AI context.
  }

  return [];
}

async function fetchCalvingReminders() {
  try {
    const response = await fetch(
      "/api/reminders?from=2000-01-01&to=2099-12-31&type=व्यायण",
      { cache: "no-store" }
    );
    const result = await response.json();

    if (response.ok) {
      return (result.data || []).filter((reminder) => !reminder.is_done);
    }
  } catch {
    // Reminder cards can still render from AI dates when reminders fail.
  }

  return [];
}

function groupLatestAIByCow(records = []) {
  const byCow = new Map();

  records.forEach((record) => {
    if (!record?.cow_id || byCow.has(record.cow_id)) {
      return;
    }

    byCow.set(record.cow_id, record);
  });

  return byCow;
}

function groupRemindersByCow(records = []) {
  return records.reduce((groups, reminder) => {
    if (!reminder?.cow_id) {
      return groups;
    }

    if (!groups.has(reminder.cow_id)) {
      groups.set(reminder.cow_id, []);
    }

    groups.get(reminder.cow_id).push(reminder);
    return groups;
  }, new Map());
}

function reminderDistanceText(date) {
  const distance = getReminderDayDistance(date);

  if (distance < 0) {
    return `${toMarathiNumerals(Math.abs(distance))} दिवस उशीर`;
  }

  if (distance === 0) {
    return "आज";
  }

  if (distance === 1) {
    return "उद्या";
  }

  return `${toMarathiNumerals(distance)} दिवस बाकी`;
}

function getPendingCalvingReminder(cow) {
  return (cow?.pending_reminders || []).find((reminder) => reminder.type === "व्यायण") || null;
}

function isBeforeExpectedCalving(cow, today) {
  return Boolean(cow?.expected_calving_date && cow.expected_calving_date > today);
}

function CalvingCowPrompt({ cow, today, onConfirm, onChangeCow }) {
  if (!cow) {
    return null;
  }

  const early = isBeforeExpectedCalving(cow, today);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 p-4 sm:items-center sm:justify-center">
      <section className="w-full max-w-md rounded-lg border border-green-200 bg-white p-4 shadow-xl">
        <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-[17px] font-extrabold text-green-900">
          {early ? "आधी व्यायण झाले" : "व्यायण नोंद सुरू"}
        </p>
        <h2 className="mt-3 text-[28px] font-extrabold leading-tight text-slate-950">
          हीच गाय आहे का?
        </h2>
        <div className="mt-4 rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <p className="text-[30px] font-extrabold leading-tight text-sheti">
            🐄 {cow.name}
          </p>
          <p className="mt-2 text-[19px] font-bold text-green-900">
            अपेक्षित व्यायण: {formatMarathiDate(cow.expected_calving_date)}
          </p>
          <p className="mt-1 text-[18px] font-bold text-green-800">
            जात: {cow.breed || "माहिती नाही"}
          </p>
        </div>
        {early ? (
          <p className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-[18px] font-extrabold leading-relaxed text-yellow-900">
            अपेक्षित तारीख अजून आलेली नाही. तरीही प्रत्यक्षात व्यायण झाले असेल तर
            इथेच नोंद करा.
          </p>
        ) : null}
        <p className="mt-4 text-[19px] font-bold leading-relaxed text-slate-700">
          पुढच्या फॉर्ममध्ये याच गायीचे वासरू/वासरी जोडले जाईल. जतन केल्यावर
          या गायीचा status <span className="text-sheti">व्याललेली</span> होईल.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[58px] rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white active:bg-green-700"
          >
            ✅ हो, याच गायीचे वासरू नोंद करा
          </button>
          <button
            type="button"
            onClick={onChangeCow}
            className="min-h-[54px] rounded-lg border-2 border-slate-200 bg-white px-4 text-[19px] font-extrabold text-slate-700 active:bg-slate-50"
          >
            गाय बदला
          </button>
        </div>
      </section>
    </div>
  );
}

export default function VyayanNondPage() {
  const router = useRouter();
  const today = getTodayISODate();
  const [initialCowId, setInitialCowId] = useState("");
  const [reminderId, setReminderId] = useState("");
  const [cows, setCows] = useState([]);
  const [selectedCow, setSelectedCow] = useState(null);
  const [promptCow, setPromptCow] = useState(null);
  const [formReady, setFormReady] = useState(false);
  const [initialSelectionDone, setInitialSelectionDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    actual_date: today,
    calf_count: "1",
    calf_gender: "मादी",
    raise_female_calf: "हो",
    calf_name: "",
    calf_color: "",
    calf_breed: "",
    calving_notes: "",
    milk_start_date: today
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPregnantCows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchCowsOffline();
      const params = new URLSearchParams(window.location.search);
      const requestedCowId = params.get("cow_id") || "";

      const pregnantCows = (result.data || []).filter(
        (cow) => cow.status === "गाभण" || cow.id === requestedCowId
      );
      const [aiRecords, reminderRecords] = await Promise.all([
        fetchAllAIRecords(),
        fetchCalvingReminders()
      ]);
      const aiByCow = groupLatestAIByCow(aiRecords);
      const remindersByCow = groupRemindersByCow(reminderRecords);
      const cowsWithAI = pregnantCows.map((cow) => {
          const lastAI = aiByCow.get(cow.id) || null;
          const pendingReminders = remindersByCow.get(cow.id) || [];
          const heatCheckDate = lastAI ? toISODate(addDaysToDate(lastAI.ai_date, 21)) : "";
          const pregnancyCheckDate =
            lastAI?.pregnancy_check_date || (lastAI ? toISODate(addDaysToDate(lastAI.ai_date, 60)) : "");
          const expectedDate = lastAI ? toISODate(addDaysToDate(lastAI.ai_date, 270)) : "";

          return {
            ...cow,
            last_ai_record: lastAI,
            heat_check_date: heatCheckDate,
            pregnancy_check_date: pregnancyCheckDate,
            pending_reminders: pendingReminders,
            expected_calving_date: expectedDate
          };
      });

      setCows(cowsWithAI);
    } catch (fetchError) {
      setError(fetchError.message || "माहिती मिळवताना चूक झाली.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitialCowId(params.get("cow_id") || "");
    setReminderId(params.get("reminder_id") || "");
    fetchPregnantCows();
  }, [fetchPregnantCows]);

  useEffect(() => {
    if (!initialCowId || initialSelectionDone || selectedCow || cows.length === 0) {
      return;
    }

    const cow = cows.find((item) => item.id === initialCowId);

    if (cow) {
      setSelectedCow(cow);
      setPromptCow(cow);
      setFormReady(false);
      setInitialSelectionDone(true);
      setReminderId((current) => current || getPendingCalvingReminder(cow)?.id || "");
    }
  }, [cows, initialCowId, initialSelectionDone, selectedCow]);

  function scrollToElement(id) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function selectCowForCalving(cow) {
    setSelectedCow(cow);
    setPromptCow(cow);
    setFormReady(false);
    setReminderId(getPendingCalvingReminder(cow)?.id || "");
    setSaveError("");
    setSuccess("");
  }

  function confirmCowForCalving() {
    setPromptCow(null);
    setFormReady(true);
    scrollToElement("vyayan-form");
  }

  function changeCowSelection() {
    setPromptCow(null);
    setSelectedCow(null);
    setFormReady(false);
    setReminderId("");
    scrollToElement("pregnant-cows-list");
  }

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
    setSaveError("");
    setSuccess("");
  }

  const dryOffDate = useMemo(() => {
    return toISODate(addDaysToDate(form.actual_date, 60));
  }, [form.actual_date]);

  async function saveCalving(event) {
    event.preventDefault();

    if (!selectedCow) {
      setSaveError("गाय निवडा.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSuccess("");

    try {
      const result = await saveCalvingRecord({
        cow_id: selectedCow.id,
        cowName: selectedCow.name,
        cow: selectedCow,
        ai_record_id: selectedCow.last_ai_record?.id || null,
        expected_date: selectedCow.expected_calving_date || null,
        actual_date: form.actual_date,
        calf_count: Number(form.calf_count || 1),
        calf_gender: form.calf_gender,
        calf_name: form.calf_name.trim() || null,
        calving_notes: form.calving_notes.trim() || null,
        raise_calf: form.calf_gender === "मादी" && form.raise_female_calf === "हो",
        calf_color:
          form.calf_gender === "मादी" && form.raise_female_calf === "हो"
            ? form.calf_color.trim() || null
            : null,
        calf_breed:
          form.calf_gender === "मादी" && form.raise_female_calf === "हो"
            ? form.calf_breed.trim() || selectedCow.breed || null
            : null,
        dryOffDate,
        reminderId
      });

      setSuccess(
        result.offline
          ? "⏳ व्यायण नोंद फोनवर साठवली. इंटरनेट आल्यावर आपोआप समक्रमण होईल."
          : "✅ व्यायण नोंद जतन झाली! 🐄 वासरू जन्मले!"
      );
      window.setTimeout(
        () => router.push(form.calf_gender === "मादी" && form.raise_female_calf === "हो" ? "/vasare" : `/gayi/${selectedCow.id}`),
        1100
      );
    } catch (saveFailure) {
      setSaveError(saveFailure.message || "व्यायण नोंद जतन झाली नाही.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState text="गाभण गायी लोड होत आहेत..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPregnantCows} />;
  }

  return (
    <div className="space-y-5">
      <CalvingCowPrompt
        cow={promptCow}
        today={today}
        onConfirm={confirmCowForCalving}
        onChangeCow={changeCowSelection}
      />

      <PageHeader title="🐄 गाभण गायी" subtitle="तारखा, आठवणी आणि व्यायण नोंद" />

      {reminderId ? (
        <section className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-soft">
          <h2 className="text-[23px] font-extrabold text-green-900">
            व्यायण आठवण जोडलेली आहे
          </h2>
          <p className="mt-2 text-[18px] font-bold leading-relaxed text-green-800">
            ही नोंद जतन झाल्यावर वासरू तयार होईल, गायीची स्थिती व्याललेली होईल
            आणि त्या गायीची व्यायण आठवण आपोआप पूर्ण होईल.
          </p>
        </section>
      ) : null}

      <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-soft">
        <h2 className="text-[23px] font-extrabold text-yellow-950">
          तारीख आधी व्यायण झाले तर?
        </h2>
        <p className="mt-2 text-[18px] font-bold leading-relaxed text-yellow-900">
          गायीची expected date अजून आली नसेल तरी `आधी व्यायण झाले` दाबून नोंद करा.
          जतन केल्यावर future व्यायण आठवण आपोआप बंद होईल.
        </p>
      </section>

      <section id="pregnant-cows-list" className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="mb-3 text-[24px] font-extrabold text-slate-950">गाभण गायींची यादी</h2>
        <div className="space-y-3">
          {cows.map((cow) => {
            const overdueDays = cow.expected_calving_date
              ? Math.abs(Math.min(getReminderDayDistance(cow.expected_calving_date), 0))
              : 0;
            const overdue = cow.expected_calving_date && cow.expected_calving_date < today;
            const active = selectedCow?.id === cow.id;
            const dateItems = [
              { label: "रेतन", date: cow.last_ai_record?.ai_date },
              { label: "माज तपासणी", date: cow.heat_check_date },
              { label: "गर्भ तपासणी", date: cow.pregnancy_check_date },
              { label: "अपेक्षित व्यायण", date: cow.expected_calving_date }
            ];
            const pendingReminders = cow.pending_reminders || [];

            return (
              <article
                key={cow.id}
                className={`rounded-lg border-2 p-3 shadow-sm ${
                  active
                    ? "border-green-300 bg-green-50"
                    : overdue
                      ? "border-red-200 bg-red-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[22px] font-extrabold text-slate-950">{cow.name}</p>
                    <p className="mt-1 text-[18px] font-bold text-slate-700">
                      अपेक्षित तारीख: {formatMarathiDate(cow.expected_calving_date)}
                    </p>
                    {overdue ? (
                      <p className="mt-1 text-[18px] font-extrabold text-red-800">
                        {toMarathiNumerals(overdueDays)} दिवस उशीर झाला
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={cow.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {dateItems.map((item) => (
                    <div key={item.label} className="rounded-lg bg-white/80 p-3">
                      <p className="text-[15px] font-extrabold text-slate-500">{item.label}</p>
                      <p className="mt-1 text-[18px] font-extrabold text-slate-900">
                        {formatMarathiDate(item.date)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[18px] font-extrabold text-slate-900">बाकी आठवणी</p>
                  {pendingReminders.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {pendingReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="rounded-lg bg-slate-50 p-3 text-[17px] font-bold text-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span>
                              {getReminderEmoji(reminder.type)} {reminder.type}
                            </span>
                            <span className="shrink-0 text-sheti">
                              {reminderDistanceText(reminder.reminder_date)}
                            </span>
                          </div>
                          <p className="mt-1 text-[16px] text-slate-500">
                            {formatMarathiDate(reminder.reminder_date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[17px] font-bold text-slate-500">
                      बाकी आठवण नाही.
                    </p>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    href={`/gayi/${cow.id}`}
                    className="flex min-h-[52px] items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 px-3 text-center text-[18px] font-extrabold text-sheti active:bg-green-100"
                  >
                    माहिती बघा
                  </Link>
                  <button
                    type="button"
                    onClick={() => selectCowForCalving(cow)}
                    className="min-h-[52px] rounded-lg bg-sheti px-3 text-[18px] font-extrabold text-white active:bg-green-700"
                  >
                    {active
                      ? "✅ निवडलेली गाय"
                      : isBeforeExpectedCalving(cow, today)
                        ? "आधी व्यायण झाले"
                        : "व्यायण नोंद"}
                  </button>
                </div>
              </article>
            );
          })}

          {cows.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-[19px] font-bold text-slate-600">
              सध्या गाभण गाय नाही.
            </p>
          ) : null}
        </div>
      </section>

      {selectedCow && formReady ? (
        <form id="vyayan-form" onSubmit={saveCalving} className="space-y-5 scroll-mt-4">
          <section className="rounded-lg border-2 border-green-300 bg-green-50 p-4 shadow-soft">
            <p className="text-[18px] font-extrabold text-green-800">आता नोंद करत आहात</p>
            <h2 className="mt-2 text-[30px] font-extrabold leading-tight text-sheti">
              🐄 {selectedCow.name}
            </h2>
            <p className="mt-2 text-[19px] font-bold text-green-900">
              या फॉर्ममधील वासरू/वासरी या गायीशी जोडली जाईल.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-[15px] font-extrabold text-green-700">अपेक्षित व्यायण</p>
                <p className="mt-1 text-[18px] font-extrabold text-slate-950">
                  {formatMarathiDate(selectedCow.expected_calving_date)}
                </p>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-[15px] font-extrabold text-green-700">जात</p>
                <p className="mt-1 text-[18px] font-extrabold text-slate-950">
                  {selectedCow.breed || "माहिती नाही"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={changeCowSelection}
              className="mt-3 min-h-[48px] w-full rounded-lg border-2 border-green-200 bg-white px-3 text-[18px] font-extrabold text-sheti active:bg-green-100"
            >
              गाय बदलायची असल्यास इथे दाबा
            </button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="mb-4 text-[24px] font-extrabold text-slate-950">
              वासरू / वासरी माहिती
            </h2>
            <div className="space-y-5">
              <FormField label="व्यायण तारीख" required>
                <input
                  type="date"
                  value={form.actual_date}
                  onChange={(event) => updateField("actual_date", event.target.value)}
                  required
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <div>
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">
                  वासराचे लिंग <span className="text-tatkal">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {["नर", "मादी"].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => updateField("calf_gender", gender)}
                      className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                        form.calf_gender === gender
                          ? "border-green-300 bg-green-100 text-sheti"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {gender === "नर" ? "🐂 नर" : "🐄 मादी"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[20px] font-extrabold text-slate-900">
                  वासरांची संख्या
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "1", label: "१ वासरू" },
                    { value: "2", label: "जुळे" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField("calf_count", option.value)}
                      className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                        form.calf_count === option.value
                          ? "border-green-300 bg-green-100 text-sheti"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.calf_gender === "मादी" ? (
                <div>
                  <p className="mb-2 text-[20px] font-extrabold text-slate-900">
                    आपल्याला ही वासरी पाळायची आहे का?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {["हो", "नाही"].map((answer) => (
                      <button
                        key={answer}
                        type="button"
                        onClick={() => updateField("raise_female_calf", answer)}
                        className={`min-h-[58px] rounded-lg border-2 px-4 text-[20px] font-extrabold ${
                          form.raise_female_calf === answer
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

              {form.calf_gender === "मादी" && form.raise_female_calf === "हो" ? (
                <>
                  <FormField label="वासरीचे नाव">
                    <MarathiTextInput
                      value={form.calf_name}
                      onValueChange={(value) => updateField("calf_name", value)}
                      className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                  <FormField label="रंग">
                    <MarathiTextInput
                      value={form.calf_color}
                      onValueChange={(value) => updateField("calf_color", value)}
                      className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                  <FormField label="जात">
                    <MarathiTextInput
                      value={form.calf_breed}
                      onValueChange={(value) => updateField("calf_breed", value)}
                      placeholder={selectedCow.breed || "जर्सी"}
                      className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>

                </>
              ) : null}

              <FormField label="व्यायणाची नोंद">
                <MarathiTextInput
                  multiline
                  value={form.calving_notes}
                  onValueChange={(value) => updateField("calving_notes", value)}
                  placeholder="सामान्य / कठीण / डॉक्टर बोलावले..."
                  rows={4}
                  className="min-h-[132px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <FormField label="दूध सुरू तारीख">
                <input
                  type="date"
                  value={form.milk_start_date}
                  onChange={(event) => updateField("milk_start_date", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

              <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-[19px] font-extrabold text-yellow-900">
                दूध बंद आठवण: {formatMarathiDate(dryOffDate)}
              </p>
            </div>
          </section>

        {success ? (
          <p
            className={`rounded-lg border p-4 text-[20px] font-extrabold ${
              success.startsWith("⏳")
                ? "border-yellow-200 bg-yellow-50 text-yellow-900"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {success}
          </p>
        ) : null}

          {saveError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-[20px] font-extrabold text-red-800">
              {saveError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[56px] w-full rounded-lg bg-sheti px-4 text-[20px] font-extrabold text-white shadow-sm disabled:opacity-70 active:bg-green-700"
          >
            {saving ? "⏳ नोंद जतन होत आहे..." : "✅ व्यायण नोंद जतन करा"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
