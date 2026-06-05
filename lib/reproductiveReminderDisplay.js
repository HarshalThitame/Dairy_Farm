import {
  CALVING_REMINDER_TYPE,
  DRY_OFF_REMINDER_TYPE,
  MISSED_PREGNANCY_REMINDER_TYPE,
  PREGNANCY_CHECK_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE
} from "@/lib/reminderUtils";

const aiLifecycleTypes = new Set([
  PREGNANCY_CHECK_REMINDER_TYPE,
  MISSED_PREGNANCY_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE,
  DRY_OFF_REMINDER_TYPE,
  CALVING_REMINDER_TYPE
]);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isAiLifecycleReminder(reminder) {
  return reminder?.related_record_id && aiLifecycleTypes.has(reminder.type);
}

function hasLaterRecord(records, cowId, afterDate, dateField) {
  return (records || []).some(
    (record) =>
      record.cow_id === cowId &&
      String(record[dateField] || "") > String(afterDate || "")
  );
}

export async function removeResolvedReproductiveReminders(supabase, farmId, reminders) {
  const rows = reminders || [];
  const aiLinkedRows = rows.filter((reminder) => !reminder.is_done && isAiLifecycleReminder(reminder));

  if (aiLinkedRows.length === 0) {
    return rows;
  }

  const aiIds = unique(aiLinkedRows.map((reminder) => reminder.related_record_id));
  const { data: aiRecords, error: aiError } = await supabase
    .from("ai_records")
    .select("id, cow_id, ai_date, pregnancy_result")
    .eq("farm_id", farmId)
    .in("id", aiIds);

  if (aiError) {
    throw aiError;
  }

  const aiById = new Map((aiRecords || []).map((record) => [record.id, record]));
  const lifecycleTargets = aiLinkedRows
    .map((reminder) => aiById.get(reminder.related_record_id))
    .filter(Boolean);
  const cowIds = unique(lifecycleTargets.map((record) => record.cow_id));
  const minAiDate = lifecycleTargets.reduce(
    (date, record) => (!date || String(record.ai_date) < date ? String(record.ai_date) : date),
    ""
  );

  let laterAiRecords = [];
  let laterCalvingRecords = [];

  if (cowIds.length > 0 && minAiDate) {
    const [laterAiResult, laterCalvingResult] = await Promise.all([
      supabase
        .from("ai_records")
        .select("id, cow_id, ai_date")
        .eq("farm_id", farmId)
        .in("cow_id", cowIds)
        .gt("ai_date", minAiDate),
      supabase
        .from("calving_records")
        .select("id, cow_id, actual_date")
        .eq("farm_id", farmId)
        .in("cow_id", cowIds)
        .gt("actual_date", minAiDate)
    ]);

    if (laterAiResult.error) {
      throw laterAiResult.error;
    }
    if (laterCalvingResult.error) {
      throw laterCalvingResult.error;
    }

    laterAiRecords = laterAiResult.data || [];
    laterCalvingRecords = laterCalvingResult.data || [];
  }

  return rows.filter((reminder) => {
    if (!isAiLifecycleReminder(reminder)) {
      return true;
    }

    const aiRecord = aiById.get(reminder.related_record_id);

    if (!aiRecord) {
      return Boolean(reminder.is_done);
    }

    const hasNewerLifecycle =
      hasLaterRecord(laterAiRecords, aiRecord.cow_id, aiRecord.ai_date, "ai_date") ||
      hasLaterRecord(laterCalvingRecords, aiRecord.cow_id, aiRecord.ai_date, "actual_date");

    if (hasNewerLifecycle) {
      return false;
    }

    if (reminder.type === PREGNANCY_CHECK_REMINDER_TYPE || reminder.type === MISSED_PREGNANCY_REMINDER_TYPE) {
      return (aiRecord.pregnancy_result || "pending") === "pending";
    }

    if (reminder.type === DRY_OFF_REMINDER_TYPE || reminder.type === CALVING_REMINDER_TYPE) {
      return aiRecord.pregnancy_result !== "negative";
    }

    if (reminder.type === REPEAT_BREEDING_REMINDER_TYPE) {
      if (aiRecord.pregnancy_result !== "negative") {
        return false;
      }

      return true;
    }

    return true;
  });
}
