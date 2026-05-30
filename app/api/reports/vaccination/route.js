import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  getIndiaMonthParts,
  getNextVaccinationDate,
  getVaccinationStatus,
  vaccineTypes
} from "@/lib/reportUtils";
import { getTodayISODate } from "@/lib/marathiUtils";

export const dynamic = "force-dynamic";

function addDays(date, days) {
  const [year, month, day] = String(date).split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day));
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  const first = new Date(`${from}T00:00:00`);
  const second = new Date(`${to}T00:00:00`);
  return Math.round((second - first) / 86400000);
}

function getVaccineName(record) {
  return record.vaccine_name || record.notes || record.type || "लसीकरण";
}

function matchesVaccineType(vaccineName, vaccineType) {
  const name = String(vaccineName || "").toLocaleLowerCase("mr-IN");
  const type = String(vaccineType || "").toLocaleLowerCase("mr-IN");
  const synonyms = {
    "खुरपका-तोंडपका": ["fmd", "खुरपका", "तोंडपका"],
    "घटसर्प": ["bq", "घटसर्प"],
    "हेमोरेजिक सेप्टिसेमिया": ["hs", "हेमोरेजिक", "सेप्टिसेमिया"],
    "ब्रुसेलोसिस": ["brucellosis", "ब्रुसेलोसिस"],
    "थायलेरिया": ["theileria", "थायलेरिया"],
    "जंतनाशक": ["deworming", "जंतनाशक"]
  };

  return (synonyms[vaccineType] || [type]).some((word) => name.includes(word));
}

function buildDueItem(record, today) {
  const dueDate = record.next_due_date || getNextVaccinationDate(record.date, getVaccineName(record));
  const remaining = dueDate ? daysBetween(today, dueDate) : 0;

  return {
    id: record.id,
    cow_id: record.cow_id,
    cow_name: record.cows?.name || "गाय",
    cow: record.cows || null,
    vaccine_name: getVaccineName(record),
    given_date: record.date,
    due_date: dueDate,
    days_late: remaining < 0 ? Math.abs(remaining) : 0,
    days_left: remaining > 0 ? remaining : 0
  };
}

function buildGrid(cows, records) {
  const latestByCowAndVaccine = new Map();

  records.forEach((record) => {
    const cowId = record.cow_id;
    const vaccineName = getVaccineName(record);
    const matchedType = vaccineTypes.find((type) => matchesVaccineType(vaccineName, type)) || vaccineName;
    const key = `${cowId}:${matchedType}`;
    const current = latestByCowAndVaccine.get(key);

    if (!current || record.date > current.date) {
      latestByCowAndVaccine.set(key, record);
    }
  });

  return cows.map((cow) => ({
    cow_id: cow.id,
    name: cow.name,
    breed: cow.breed,
    status: cow.status,
    vaccines: vaccineTypes.map((vaccineName) => {
      const record = latestByCowAndVaccine.get(`${cow.id}:${vaccineName}`);
      const dueDate = record?.next_due_date || getNextVaccinationDate(record?.date, vaccineName);

      return {
        vaccine_name: vaccineName,
        last_date: record?.date || null,
        due_date: dueDate,
        status: record ? getVaccinationStatus(record.date, vaccineName) : "overdue"
      };
    })
  }));
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const today = getTodayISODate();
    const thirtyDays = addDays(today, 30);
    const ninetyDays = addDays(today, 90);
    const currentYear = getIndiaMonthParts().year;
    const supabase = getSupabaseServerClient();

    const [recordsResult, cowsResult] = await Promise.all([
      supabase
        .from("health_records")
        .select("*, cows(id, name, breed, status, date_of_birth, color)")
        .eq("farm_id", farmId)
        .in("type", ["लसीकरण", "जंतनाशक"])
        .order("date", { ascending: false }),
      supabase
        .from("cows")
        .select("id, name, breed, status, date_of_birth, color")
        .eq("farm_id", farmId)
        .eq("is_active", true)
        .order("name", { ascending: true })
    ]);

    if (recordsResult.error) {
      throw recordsResult.error;
    }

    if (cowsResult.error) {
      throw cowsResult.error;
    }

    const records = recordsResult.data || [];
    const dueItems = records
      .filter((record) => record.next_due_date)
      .map((record) => buildDueItem(record, today));

    const overdue = dueItems
      .filter((item) => item.due_date < today)
      .sort((first, second) => first.due_date.localeCompare(second.due_date));
    const dueThisMonth = dueItems
      .filter((item) => item.due_date >= today && item.due_date <= thirtyDays)
      .sort((first, second) => first.due_date.localeCompare(second.due_date));
    const upcoming = dueItems
      .filter((item) => item.due_date > thirtyDays && item.due_date <= ninetyDays)
      .sort((first, second) => first.due_date.localeCompare(second.due_date));
    const completedThisYear = records
      .filter((record) => record.date >= `${currentYear}-01-01` && record.date <= `${currentYear}-12-31`)
      .map((record) => ({
        id: record.id,
        cow_id: record.cow_id,
        cow_name: record.cows?.name || "गाय",
        cow: record.cows || null,
        vaccine_name: getVaccineName(record),
        date: record.date,
        next_due_date: record.next_due_date
      }))
      .sort((first, second) => second.date.localeCompare(first.date));

    return NextResponse.json({
      data: {
        overdue,
        dueThisMonth,
        upcoming,
        completedThisYear,
        vaccinationGrid: buildGrid(cowsResult.data || [], records)
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
