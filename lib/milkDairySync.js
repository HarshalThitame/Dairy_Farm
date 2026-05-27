import {
  DAIRY_SESSION_EVENING,
  DAIRY_SESSION_MORNING,
  matchSettlementToSlips
} from "@/lib/accountingUtils";

const milkSelect = "*, cows(id, name, breed)";

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function firstPositive(...values) {
  for (const value of values) {
    const numberValue = toNumber(value, 0);
    if (numberValue > 0) {
      return numberValue;
    }
  }

  return 32;
}

async function getFarmDairyDefaults(supabase, farmId) {
  const { data, error } = await supabase
    .from("farms")
    .select("dairy_name, dairy_member_number, milk_rate_default")
    .eq("id", farmId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || {};
}

function buildSessionSlip(milkRecord, session, farmDefaults = {}) {
  const isMorning = session === DAIRY_SESSION_MORNING;
  const liters = toNumber(isMorning ? milkRecord.morning_litres : milkRecord.evening_litres, 0);
  const rate = firstPositive(
    isMorning ? milkRecord.morning_price_per_litre : milkRecord.evening_price_per_litre,
    milkRecord.price_per_litre,
    farmDefaults.milk_rate_default
  );

  return {
    farm_id: milkRecord.farm_id,
    slip_date: milkRecord.date,
    session,
    dairy_name: farmDefaults.dairy_name || null,
    dairy_member_number: farmDefaults.dairy_member_number || null,
    liters,
    fat_percentage: toOptionalNumber(
      isMorning ? milkRecord.morning_fat_percentage : milkRecord.evening_fat_percentage
    ) ?? toOptionalNumber(milkRecord.fat_percentage),
    snf_percentage: toOptionalNumber(
      isMorning ? milkRecord.morning_snf_value : milkRecord.evening_snf_value
    ) ?? toOptionalNumber(milkRecord.snf_value),
    clr_degree: toOptionalNumber(
      isMorning ? milkRecord.morning_degree_reading : milkRecord.evening_degree_reading
    ) ?? toOptionalNumber(milkRecord.degree_reading),
    rate_per_liter: rate,
    notes: milkRecord.notes || null,
    slip_image_url: null,
    updated_at: new Date().toISOString()
  };
}

function combineSlipNotes(morningSlip, eveningSlip) {
  const notes = [
    morningSlip?.notes ? `${DAIRY_SESSION_MORNING}: ${morningSlip.notes}` : "",
    eveningSlip?.notes ? `${DAIRY_SESSION_EVENING}: ${eveningSlip.notes}` : ""
  ].filter(Boolean);

  if (notes.length === 0) {
    return null;
  }

  if (morningSlip?.notes && morningSlip.notes === eveningSlip?.notes) {
    return morningSlip.notes;
  }

  return notes.join("\n");
}

async function getExistingMilkRecordId(supabase, farmId, date) {
  const { data, error } = await supabase
    .from("milk_records")
    .select("id")
    .eq("farm_id", farmId)
    .eq("date", date)
    .is("cow_id", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

export async function refreshSettlementMatchesForDate(supabase, farmId, date) {
  const { data: settlements, error } = await supabase
    .from("dairy_settlements")
    .select("*")
    .eq("farm_id", farmId)
    .lte("period_start", date)
    .gte("period_end", date);

  if (error) {
    throw error;
  }

  const refreshed = [];

  for (const settlement of settlements || []) {
    const result = await matchSettlementToSlips(supabase, farmId, settlement);
    refreshed.push(result.settlement);
  }

  return refreshed;
}

export async function syncMilkRecordToDairySlips(supabase, farmId, milkRecord) {
  if (!milkRecord?.date || milkRecord.cow_id) {
    return [];
  }

  const farmDefaults = await getFarmDairyDefaults(supabase, farmId);
  const savedSlips = [];

  for (const session of [DAIRY_SESSION_MORNING, DAIRY_SESSION_EVENING]) {
    const slipPayload = buildSessionSlip(
      { ...milkRecord, farm_id: milkRecord.farm_id || farmId },
      session,
      farmDefaults
    );

    if (slipPayload.liters > 0) {
      const { data, error } = await supabase
        .from("dairy_slips")
        .upsert(slipPayload, { onConflict: "farm_id,slip_date,session" })
        .select()
        .single();

      if (error) {
        throw error;
      }

      savedSlips.push(data);
    } else {
      const { error } = await supabase
        .from("dairy_slips")
        .delete()
        .eq("farm_id", farmId)
        .eq("slip_date", milkRecord.date)
        .eq("session", session);

      if (error) {
        throw error;
      }
    }
  }

  await refreshSettlementMatchesForDate(supabase, farmId, milkRecord.date);
  return savedSlips;
}

export async function deleteDairySlipsForMilkDate(supabase, farmId, date) {
  if (!date) {
    return;
  }

  const { error } = await supabase
    .from("dairy_slips")
    .delete()
    .eq("farm_id", farmId)
    .eq("slip_date", date);

  if (error) {
    throw error;
  }

  await refreshSettlementMatchesForDate(supabase, farmId, date);
}

export async function recomputeMilkRecordFromDairySlips(supabase, farmId, date) {
  if (!date) {
    return null;
  }

  const { data: slips, error: slipsError } = await supabase
    .from("dairy_slips")
    .select("*")
    .eq("farm_id", farmId)
    .eq("slip_date", date);

  if (slipsError) {
    throw slipsError;
  }

  const existingId = await getExistingMilkRecordId(supabase, farmId, date);

  if (!slips || slips.length === 0) {
    if (existingId) {
      const { error } = await supabase
        .from("milk_records")
        .delete()
        .eq("id", existingId)
        .eq("farm_id", farmId)
        .is("cow_id", null);

      if (error) {
        throw error;
      }
    }

    await refreshSettlementMatchesForDate(supabase, farmId, date);
    return null;
  }

  const morningSlip = slips.find((slip) => slip.session === DAIRY_SESSION_MORNING) || null;
  const eveningSlip = slips.find((slip) => slip.session === DAIRY_SESSION_EVENING) || null;
  const payload = {
    farm_id: farmId,
    cow_id: null,
    date,
    morning_litres: toNumber(morningSlip?.liters, 0),
    evening_litres: toNumber(eveningSlip?.liters, 0),
    price_per_litre: null,
    morning_price_per_litre: toOptionalNumber(morningSlip?.rate_per_liter),
    evening_price_per_litre: toOptionalNumber(eveningSlip?.rate_per_liter),
    fat_percentage: null,
    morning_fat_percentage: toOptionalNumber(morningSlip?.fat_percentage),
    evening_fat_percentage: toOptionalNumber(eveningSlip?.fat_percentage),
    snf_value: null,
    morning_snf_value: toOptionalNumber(morningSlip?.snf_percentage),
    evening_snf_value: toOptionalNumber(eveningSlip?.snf_percentage),
    degree_reading: null,
    morning_degree_reading: toOptionalNumber(morningSlip?.clr_degree),
    evening_degree_reading: toOptionalNumber(eveningSlip?.clr_degree),
    notes: combineSlipNotes(morningSlip, eveningSlip)
  };

  const query = existingId
    ? supabase
        .from("milk_records")
        .update(payload)
        .eq("id", existingId)
        .eq("farm_id", farmId)
        .is("cow_id", null)
    : supabase.from("milk_records").insert(payload);

  const { data, error } = await query.select(milkSelect).single();

  if (error) {
    throw error;
  }

  await refreshSettlementMatchesForDate(supabase, farmId, date);
  return data;
}
