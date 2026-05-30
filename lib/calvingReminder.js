export const CALVING_REMINDER_TYPE = "व्यायण";

export function isCalvingReminder(reminder) {
  return reminder?.type === CALVING_REMINDER_TYPE;
}

export function getCalvingRecordHref(reminder) {
  const query = new URLSearchParams();

  if (reminder?.cow_id) {
    query.set("cow_id", reminder.cow_id);
  }

  if (reminder?.id) {
    query.set("reminder_id", reminder.id);
  }

  const queryText = query.toString();
  return `/nondi/vyayan${queryText ? `?${queryText}` : ""}`;
}
