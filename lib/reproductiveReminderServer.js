import {
  addDaysToISODate,
  buildRepeatBreedingReminder,
  calculateCalvingFollowupReminders,
  HEAT_CHECK_REMINDER_TYPE,
  MISSED_PREGNANCY_REMINDER_TYPE,
  NEXT_BREEDING_READY_REMINDER_TYPE,
  PREGNANCY_CHECK_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE
} from "@/lib/reminderUtils";

async function getCowName(supabase, farmId, cowId) {
  if (!cowId) {
    return "गाय";
  }

  const { data, error } = await supabase
    .from("cows")
    .select("name")
    .eq("farm_id", farmId)
    .eq("id", cowId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.name || "गाय";
}

export async function ensureReminderForRecord(supabase, farmId, payload) {
  const { relatedRecordId, type } = payload;

  if (relatedRecordId) {
    const { data: existing, error: existingError } = await supabase
      .from("reminders")
      .select()
      .eq("farm_id", farmId)
      .eq("related_record_id", relatedRecordId)
      .eq("type", type)
      .order("is_done", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      if (existing.is_done) {
        const { data: reactivated, error: reactivateError } = await supabase
          .from("reminders")
          .update({
            cow_id: payload.cowId || existing.cow_id || null,
            reminder_date: payload.reminderDate,
            message: payload.message,
            is_done: false,
            skipped: false,
            done_at: null
          })
          .eq("id", existing.id)
          .eq("farm_id", farmId)
          .select()
          .single();

        if (reactivateError) {
          throw reactivateError;
        }

        return reactivated;
      }

      return existing;
    }
  }

  const { data, error } = await supabase
    .from("reminders")
    .insert({
      farm_id: farmId,
      cow_id: payload.cowId || null,
      reminder_date: payload.reminderDate,
      type,
      message: payload.message,
      related_record_id: relatedRecordId || null,
      is_done: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureMissedPregnancyReminder(supabase, farmId, aiRecord) {
  if (!aiRecord?.id || (aiRecord.pregnancy_result || "pending") !== "pending") {
    return null;
  }

  const cowName = await getCowName(supabase, farmId, aiRecord.cow_id);
  const reminderDate = aiRecord.pregnancy_check_date
    ? addDaysToISODate(aiRecord.pregnancy_check_date, 1)
    : addDaysToISODate(aiRecord.ai_date, 61);

  return ensureReminderForRecord(supabase, farmId, {
    cowId: aiRecord.cow_id,
    relatedRecordId: aiRecord.id,
    reminderDate,
    type: MISSED_PREGNANCY_REMINDER_TYPE,
    message: `${cowName} साठी ६० दिवस झाले आहेत. गर्भधारणा तपासणी नोंद करा.`
  });
}

export async function ensureRepeatBreedingReminder(supabase, farmId, aiRecord, reminderDate) {
  if (!aiRecord?.id || aiRecord.pregnancy_result !== "negative") {
    return null;
  }

  const cowName = await getCowName(supabase, farmId, aiRecord.cow_id);
  const reminder = buildRepeatBreedingReminder(reminderDate, cowName);

  return ensureReminderForRecord(supabase, farmId, {
    cowId: aiRecord.cow_id,
    relatedRecordId: aiRecord.id,
    reminderDate: reminder.reminder_date,
    type: REPEAT_BREEDING_REMINDER_TYPE,
    message: reminder.message
  });
}

export async function closeAiPregnancyLifecycleReminders(
  supabase,
  farmId,
  aiRecordId,
  reminderTypes = [
    HEAT_CHECK_REMINDER_TYPE,
    PREGNANCY_CHECK_REMINDER_TYPE,
    MISSED_PREGNANCY_REMINDER_TYPE,
    "दूध बंद",
    "व्यायण"
  ]
) {
  if (!aiRecordId) {
    return [];
  }

  const runUpdate = (payload) =>
    supabase
      .from("reminders")
      .update(payload)
      .eq("farm_id", farmId)
      .eq("related_record_id", aiRecordId)
      .in("type", reminderTypes)
      .eq("is_done", false)
      .select();

  let result = await runUpdate({
    is_done: true,
    skipped: true,
    done_at: new Date().toISOString()
  });

  if (result.error && String(result.error.message || "").includes("done_at")) {
    result = await runUpdate({
      is_done: true,
      skipped: true
    });
  }

  if (result.error) {
    throw result.error;
  }

  return result.data || [];
}

export async function ensureNextBreedingReadinessReminder(supabase, farmId, calvingRecord) {
  if (!calvingRecord?.id || !calvingRecord.actual_date) {
    return null;
  }

  const cowName = await getCowName(supabase, farmId, calvingRecord.cow_id);
  const [reminder] = calculateCalvingFollowupReminders(calvingRecord.actual_date, cowName);

  return ensureReminderForRecord(supabase, farmId, {
    cowId: calvingRecord.cow_id,
    relatedRecordId: calvingRecord.id,
    reminderDate: reminder.reminder_date,
    type: NEXT_BREEDING_READY_REMINDER_TYPE,
    message: reminder.message
  });
}
