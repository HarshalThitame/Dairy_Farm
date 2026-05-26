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
import { getCachedAIByCow } from "@/lib/localDB";

async function fetchLastAI(cowId) {
  try {
    const response = await fetch(`/api/ai?cow_id=${cowId}`, { cache: "no-store" });
    const result = await response.json();

    if (response.ok) {
      return (result.data || [])[0] || null;
    }
  } catch {
    // Fall back to local AI records below.
  }

  const cachedRecords = await getCachedAIByCow(cowId);
  return cachedRecords[0] || null;
}

async function fetchCowReminders(cowId) {
  try {
    const response = await fetch(
      `/api/reminders?cow_id=${cowId}&from=2000-01-01&to=2099-12-31`,
      { cache: "no-store" }
    );
    const result = await response.json();

    if (response.ok) {
      return (result.data || []).filter((reminder) => !reminder.is_done);
    }
  } catch {
    // Reminder cards can still render from AI dates when online reminders fail.
  }

  return [];
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

export default function VyayanNondPage() {
  const router = useRouter();
  const today = getTodayISODate();
  const [initialCowId, setInitialCowId] = useState("");
  const [reminderId, setReminderId] = useState("");
  const [cows, setCows] = useState([]);
  const [selectedCow, setSelectedCow] = useState(null);
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
    calf_identification_mark: "",
    calf_weight: "",
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

      const pregnantCows = (result.data || []).filter((cow) => cow.status === "गाभण");
      const cowsWithAI = await Promise.all(
        pregnantCows.map(async (cow) => {
          const lastAI = await fetchLastAI(cow.id);
          const pendingReminders = await fetchCowReminders(cow.id);
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
        })
      );

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
    if (!initialCowId || selectedCow || cows.length === 0) {
      return;
    }

    const cow = cows.find((item) => item.id === initialCowId);

    if (cow) {
      setSelectedCow(cow);
    }
  }, [cows, initialCowId, selectedCow]);

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
        calf_weight: form.calf_weight === "" ? null : Number(form.calf_weight),
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
        calf_identification_mark:
          form.calf_gender === "मादी" && form.raise_female_calf === "हो"
            ? form.calf_identification_mark.trim() || null
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
      <PageHeader title="🤰 गाभण गायी" subtitle="तारखा, आठवणी आणि व्यायण नोंद" />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
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
                    onClick={() => setSelectedCow(cow)}
                    className="min-h-[52px] rounded-lg bg-sheti px-3 text-[18px] font-extrabold text-white active:bg-green-700"
                  >
                    व्यायण नोंद
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

      {selectedCow ? (
        <form onSubmit={saveCalving} className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
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

                  <FormField label="ओळख खूण">
                    <MarathiTextInput
                      value={form.calf_identification_mark}
                      onValueChange={(value) => updateField("calf_identification_mark", value)}
                      className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                    />
                  </FormField>
                </>
              ) : null}

              <FormField label="वासराचे वजन" hint="किलोमध्ये लिहा">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={form.calf_weight}
                  onChange={(event) => updateField("calf_weight", event.target.value)}
                  className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
                />
              </FormField>

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
