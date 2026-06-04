import { isUuid } from "@/lib/apiSafety";

export const COW_DRY_OFF_REMINDER_TYPE = "दूध बंद";

export function isCowDryOffReminder(reminder) {
  return reminder?.type === COW_DRY_OFF_REMINDER_TYPE;
}

export function isLegacyPostCalvingDryOffReminder(reminder) {
  return (
    isCowDryOffReminder(reminder) &&
    reminder?._generated &&
    String(reminder.message || "").includes("चे दूध बंद करण्याची वेळ आली आहे")
  );
}

export async function removePostCalvingDryOffReminders(supabase, farmId, reminders = []) {
  const rows = Array.isArray(reminders) ? reminders : [];
  const relatedIds = [
    ...new Set(
      rows
        .filter((reminder) => isCowDryOffReminder(reminder) && !reminder.is_done)
        .map((reminder) => reminder.related_record_id)
        .filter(isUuid)
    )
  ];

  if (!relatedIds.length) {
    return rows;
  }

  const { data, error } = await supabase
    .from("calving_records")
    .select("id")
    .eq("farm_id", farmId)
    .in("id", relatedIds);

  if (error) {
    throw error;
  }

  const calvingRecordIds = new Set((data || []).map((record) => record.id));

  if (!calvingRecordIds.size) {
    return rows;
  }

  return rows.filter(
    (reminder) =>
      !(
        isCowDryOffReminder(reminder) &&
        !reminder.is_done &&
        calvingRecordIds.has(reminder.related_record_id)
      )
  );
}
