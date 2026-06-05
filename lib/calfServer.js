import {
  CALF_REMINDER_DEHORNING,
  CALF_REMINDER_MILK_REDUCE,
  CALF_REMINDER_MILK_STOP,
  getCalfLifecycleDates,
  getCalfMilkStatus
} from "@/lib/calfLifecycle";

const allowedStatuses = new Set(["active", "historical", "sold", "dead", "converted_to_cow"]);

export const CALF_SELECT = `
  *,
  mother:cows!calves_mother_cow_id_fkey(id, name, breed, status, photo_url),
  converted_cow:cows!calves_converted_cow_id_fkey(id, name, breed, status, photo_url)
`;

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeGender(value) {
  return value === "नर" ? "नर" : "मादी";
}

function normalizeStatus(status, isRaised) {
  if (allowedStatuses.has(status)) {
    return status;
  }

  return isRaised ? "active" : "historical";
}

export function buildCalfPayload(input, farmId) {
  const gender = normalizeGender(input.gender || input.calf_gender);
  const birthDate = input.birth_date || input.actual_date;
  const isRaised = gender === "मादी" && Boolean(input.is_raised ?? input.raise_calf);
  const lifecycle = getCalfLifecycleDates(birthDate);
  const payload = {
    farm_id: farmId,
    mother_cow_id: input.mother_cow_id || input.cow_id || null,
    calving_record_id: input.calving_record_id || null,
    name: cleanText(input.name || input.calf_name),
    birth_date: birthDate,
    gender,
    breed: cleanText(input.breed || input.calf_breed),
    color: cleanText(input.color || input.calf_color),
    photo_url: cleanText(input.photo_url || input.calf_photo_url),
    photo_storage_path: cleanText(input.photo_storage_path || input.calf_photo_storage_path),
    status: normalizeStatus(input.status, isRaised),
    is_raised: isRaised,
    milk_reduce_date: isRaised ? lifecycle.milkReduceDate : null,
    milk_stop_date: isRaised ? lifecycle.milkStopDate : null,
    notes: cleanText(input.notes || input.calving_notes)
  };

  payload.milk_feeding_status = isRaised ? getCalfMilkStatus(payload) : "not_tracked";
  return payload;
}

function reminderRowsForCalf(calf) {
  if (!calf.is_raised || calf.status !== "active") {
    return [];
  }

  const name = calf.name || "वासरी";
  const lifecycle = getCalfLifecycleDates(calf.birth_date);
  const rows = [
    {
      farm_id: calf.farm_id,
      cow_id: calf.mother_cow_id || null,
      reminder_date: lifecycle.dehorningDate,
      type: CALF_REMINDER_DEHORNING,
      message: `${name}चे शिंग काढण्याची योग्य वेळ झाली आहे.`,
      related_record_id: calf.id,
      is_done: false
    }
  ];

  if (calf.gender === "मादी") {
    rows.push(
      {
        farm_id: calf.farm_id,
        cow_id: calf.mother_cow_id || null,
        reminder_date: calf.milk_reduce_date,
        type: CALF_REMINDER_MILK_REDUCE,
        message: `${name} ४० दिवसांची झाल्यावर दूध कमी करण्यास सुरुवात करा.`,
        related_record_id: calf.id,
        is_done: false
      },
      {
        farm_id: calf.farm_id,
        cow_id: calf.mother_cow_id || null,
        reminder_date: calf.milk_stop_date,
        type: CALF_REMINDER_MILK_STOP,
        message: `${name} ६० दिवसांची झाल्यावर दूध बंद करा.`,
        related_record_id: calf.id,
        is_done: false
      }
    );
  }

  return rows.filter((row) => row.reminder_date);
}

export async function syncCalfReminders(supabase, calf) {
  const reminderTypes = [CALF_REMINDER_DEHORNING, CALF_REMINDER_MILK_REDUCE, CALF_REMINDER_MILK_STOP];
  const reminderRows = reminderRowsForCalf(calf);

  const { data: existingReminders, error: existingError } = await supabase
    .from("reminders")
    .select("type, is_done, skipped")
    .eq("farm_id", calf.farm_id)
    .eq("related_record_id", calf.id)
    .in("type", reminderTypes);

  if (existingError) {
    throw existingError;
  }

  const completedTypes = new Set(
    (existingReminders || [])
      .filter((reminder) => reminder.is_done && !reminder.skipped)
      .map((reminder) => reminder.type)
  );

  const { error: deleteError } = await supabase
    .from("reminders")
    .delete()
    .eq("farm_id", calf.farm_id)
    .eq("related_record_id", calf.id)
    .in("type", reminderTypes)
    .eq("is_done", false);

  if (deleteError) {
    throw deleteError;
  }

  if (reminderRows.length === 0 && calf.name) {
    const { error: legacyDeleteError } = await supabase
      .from("reminders")
      .delete()
      .eq("farm_id", calf.farm_id)
      .in("type", reminderTypes)
      .eq("is_done", false)
      .ilike("message", `${calf.name}%`);

    if (legacyDeleteError) {
      throw legacyDeleteError;
    }
  }

  const rowsToInsert = reminderRows.filter((row) => !completedTypes.has(row.type));

  if (rowsToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("reminders")
    .insert(rowsToInsert)
    .select();

  if (error) {
    throw error;
  }

  return data || [];
}

export async function insertCalfWithReminders(supabase, payload) {
  const { data: calf, error } = await supabase
    .from("calves")
    .insert(payload)
    .select(CALF_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await syncCalfReminders(supabase, calf);

  return calf;
}

export async function createCalvesForCalving(supabase, farmId, calvingRecord, body) {
  const calfCount = Math.max(1, Math.min(2, Number(body.calf_count || 1)));
  const calves = [];

  for (let index = 0; index < calfCount; index += 1) {
    const payload = buildCalfPayload(
      {
        ...body,
        cow_id: calvingRecord.cow_id,
        calving_record_id: calvingRecord.id,
        birth_date: calvingRecord.actual_date,
        calf_name: calfCount === 1 ? body.calf_name : null,
        calving_notes:
          calfCount === 1
            ? body.calving_notes
            : [body.calving_notes, `जुळे वासरू ${index + 1}`].filter(Boolean).join(" | ")
      },
      farmId
    );

    calves.push(await insertCalfWithReminders(supabase, payload));
  }

  return calves;
}
