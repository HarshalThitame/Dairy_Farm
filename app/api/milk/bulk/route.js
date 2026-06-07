import { NextResponse } from "next/server";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { pickMilkFields, validateMilkRecordInput } from "@/lib/milkRecordFields";
import { syncMilkRecordToDairySlips } from "@/lib/milkDairySync";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const selectMilkRecord = "*, cows(id, name, breed, status)";

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function weightedAverage(records, litresField, valueField, fallbackField = null) {
  let weightedTotal = 0;
  let litresTotal = 0;

  records.forEach((record) => {
    const litres = toNumber(record[litresField]);
    const value = toOptionalNumber(record[valueField] ?? (fallbackField ? record[fallbackField] : null));

    if (litres > 0 && value !== null) {
      weightedTotal += litres * value;
      litresTotal += litres;
    }
  });

  return litresTotal > 0 ? Number((weightedTotal / litresTotal).toFixed(2)) : null;
}

function aggregateDateRecords(records) {
  return {
    date: records[0].date,
    cow_id: null,
    morning_litres: Number(records.reduce((sum, record) => sum + toNumber(record.morning_litres), 0).toFixed(2)),
    evening_litres: Number(records.reduce((sum, record) => sum + toNumber(record.evening_litres), 0).toFixed(2)),
    price_per_litre: null,
    morning_price_per_litre: weightedAverage(records, "morning_litres", "morning_price_per_litre", "price_per_litre"),
    evening_price_per_litre: weightedAverage(records, "evening_litres", "evening_price_per_litre", "price_per_litre"),
    fat_percentage: null,
    morning_fat_percentage: weightedAverage(records, "morning_litres", "morning_fat_percentage", "fat_percentage"),
    evening_fat_percentage: weightedAverage(records, "evening_litres", "evening_fat_percentage", "fat_percentage"),
    snf_value: null,
    morning_snf_value: weightedAverage(records, "morning_litres", "morning_snf_value", "snf_value"),
    evening_snf_value: weightedAverage(records, "evening_litres", "evening_snf_value", "snf_value"),
    degree_reading: null,
    morning_degree_reading: weightedAverage(records, "morning_litres", "morning_degree_reading", "degree_reading"),
    evening_degree_reading: weightedAverage(records, "evening_litres", "evening_degree_reading", "degree_reading"),
    notes: records.length > 1 ? `एकत्रित दूध नोंद: ${records.length} नोंदी` : records[0].notes || null
  };
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    const inputRecords = Array.isArray(body) ? body : body.records;

    if (!Array.isArray(inputRecords) || inputRecords.length === 0) {
      return NextResponse.json({ error: "जतन करण्यासाठी दूधाची नोंद द्या." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request);

    for (let index = 0; index < inputRecords.length; index += 1) {
      const validationErrors = validateMilkRecordInput(inputRecords[index] || {}, {
        requireDate: true,
        requireMilk: true
      });

      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: `${index + 1} क्रमांकाच्या दूध नोंदीत चूक आहे: ${validationErrors[0]}`,
            errors: validationErrors
          },
          { status: 400 }
        );
      }
    }

    const records = inputRecords.map((record) => pickMilkFields(record || {}));
    const invalidRecord = records.find((record) => !record.date);

    if (invalidRecord) {
      return NextResponse.json({ error: "प्रत्येक नोंदीसाठी तारीख आवश्यक आहे." }, { status: 400 });
    }

    const groupedByDate = new Map();

    records.forEach((record) => {
      const group = groupedByDate.get(record.date) || [];
      group.push(record);
      groupedByDate.set(record.date, group);
    });

    const supabase = getSupabaseServerClient();
    const savedRecords = [];

    for (const group of groupedByDate.values()) {
      const payload = {
        ...aggregateDateRecords(group),
        farm_id: farmId
      };
      const aggregateErrors = validateMilkRecordInput(payload, { requireDate: true, requireMilk: true });

      if (aggregateErrors.length > 0) {
        return NextResponse.json({ error: aggregateErrors[0], errors: aggregateErrors }, { status: 400 });
      }

      const { data: existingRecord, error: existingError } = await supabase
        .from("milk_records")
        .select("id")
        .eq("farm_id", farmId)
        .eq("date", payload.date)
        .is("cow_id", null)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      const query = existingRecord?.id
        ? supabase
            .from("milk_records")
            .update(payload)
            .eq("id", existingRecord.id)
            .eq("farm_id", farmId)
        : supabase.from("milk_records").insert(payload);

      const { data, error } = await query.select(selectMilkRecord).single();

      if (error) {
        throw error;
      }

      await syncMilkRecordToDairySlips(supabase, farmId, data);
      await refreshSummaryForDate(supabase, farmId, data.date);
      savedRecords.push(data);
    }

    return NextResponse.json({ data: savedRecords });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
