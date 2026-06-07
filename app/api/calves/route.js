import { NextResponse } from "next/server";
import { ACCOUNTING_PERIOD_MONTHLY } from "@/lib/accountingPeriods";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import { addDaysToISODate, getCalfAgeText, getCalfLifecycleDates, getCalfMilkStatus } from "@/lib/calfLifecycle";
import { buildCalfPayload, CALF_SELECT, insertCalfWithReminders, syncCalfReminders } from "@/lib/calfServer";
import { validateCowPayload } from "@/lib/cowValidation";
import { farmErrorResponse, verifyFarmAccess, verifyFarmOwner } from "@/lib/farmGuard";
import { getTodayISODate } from "@/lib/marathiUtils";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set(["active", "historical", "sold", "dead", "converted_to_cow"]);
const allowedGenders = new Set(["नर", "मादी"]);
const editableTextFields = ["name", "color", "breed", "notes"];
const editablePhotoFields = ["photo_url", "photo_storage_path"];

function isFinanceCategorySchemaError(error) {
  return error?.code === "23514" && String(error?.message || "").includes("finance_records_category_check");
}

function getSupabaseProjectRef() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname.split(".")[0];
  } catch {
    return "";
  }
}

function financeCategorySchemaError() {
  const projectRef = getSupabaseProjectRef();
  const projectHint = projectRef ? ` Project: ${projectRef}.` : "";
  const error = new Error(
    `हिशोब category constraint जुना आहे.${projectHint} Supabase SQL Editor मध्ये supabase/fix_finance_records_category_check.sql पूर्ण file run करा.`
  );
  error.status = 409;
  return error;
}

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeDigits(value) {
  const digitMap = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9"
  };

  return String(value || "").replace(/[०-९]/g, (digit) => digitMap[digit] || digit);
}

function parseSaleAmount(value) {
  const amount = Number(normalizeDigits(value).replace(/[₹,\s]/g, ""));

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
}

function parseOptionalAmount(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const amount = Number(normalizeDigits(value).replace(/[₹,\s]/g, ""));

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return Number(amount.toFixed(2));
}

function isISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isFutureISODate(value) {
  return isISODate(value) && value > getTodayISODate();
}

function normalizeGender(value) {
  return value === "नर" ? "नर" : "मादी";
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const text = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "y", "हो"].includes(text)) return true;
  if (["false", "0", "no", "n", "नाही"].includes(text)) return false;

  return false;
}

function buildSaleDescription(calf) {
  const calfName = calf.name || (calf.gender === "मादी" ? "मादी वासरी" : "नर वासरू");
  const details = [
    `${calfName} विक्री`,
    calf.mother?.name ? `आई: ${calf.mother.name}` : "",
    calf.sale_notes
  ].filter(Boolean);

  return details.join(" | ");
}

async function upsertSaleFinanceRecord(supabase, farmId, calf) {
  const payload = {
    farm_id: farmId,
    date: calf.sold_date,
    type: "उत्पन्न",
    category: "वासरू विक्री",
    amount: Number(calf.sale_amount || 0),
    cow_id: calf.mother_cow_id || null,
    accounting_period: ACCOUNTING_PERIOD_MONTHLY,
    description: buildSaleDescription(calf)
  };

  if (calf.finance_record_id) {
    const { data, error } = await supabase
      .from("finance_records")
      .update(payload)
      .eq("id", calf.finance_record_id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (isFinanceCategorySchemaError(error)) {
      throw financeCategorySchemaError();
    }

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("finance_records")
    .insert(payload)
    .select()
    .single();

  if (isFinanceCategorySchemaError(error)) {
    throw financeCategorySchemaError();
  }

  if (error) {
    throw error;
  }

  return data;
}

async function deleteSaleFinanceRecord(supabase, farmId, financeRecordId) {
  if (!financeRecordId) {
    return;
  }

  const { error } = await supabase
    .from("finance_records")
    .delete()
    .eq("id", financeRecordId)
    .eq("farm_id", farmId);

  if (error) {
    throw error;
  }
}

async function updateFarmCowCount(supabase, farmId) {
  const { count } = await supabase
    .from("cows")
    .select("id", { count: "exact", head: true })
    .eq("farm_id", farmId)
    .eq("is_active", true);

  await supabase
    .from("farms")
    .update({ total_cows: count || 0, updated_at: new Date().toISOString() })
    .eq("id", farmId);
}

function buildConversionNotes(calf, conversion) {
  return [
    "वासरीपासून गाय झाली",
    calf.mother?.name ? `आई: ${calf.mother.name}` : "",
    cleanText(conversion.notes),
    calf.notes ? `वासरी नोंद: ${calf.notes}` : ""
  ]
    .filter(Boolean)
    .join(" | ");
}

async function createCowFromConversion(supabase, farmId, calf, conversion) {
  const cowName = cleanText(conversion.cow_name || conversion.name || calf.name);

  if (!cowName) {
    return { error: "गायीचे नाव आवश्यक आहे." };
  }

  if (!conversion.ai_date || !isISODate(conversion.ai_date)) {
    return { error: "रेतन तारीख आवश्यक आहे." };
  }

  if (isFutureISODate(conversion.ai_date)) {
    return { error: "रेतन तारीख भविष्यातील नसावी." };
  }

  const cost = parseOptionalAmount(conversion.cost);

  if (cost === undefined) {
    return { error: "रेतन खर्च चुकीचा आहे." };
  }

  const pregnancyCheckDate =
    conversion.pregnancy_check_date && isISODate(conversion.pregnancy_check_date)
      ? conversion.pregnancy_check_date
      : addDaysToISODate(conversion.ai_date, 60);

  const tagNumber = cleanText(conversion.tag_number);
  const cowPayload = {
    farm_id: farmId,
    name: cowName,
    breed: cleanText(conversion.breed || calf.breed || calf.mother?.breed) || "जर्सी",
    date_of_birth: calf.birth_date,
    tag_number: tagNumber,
    color: cleanText(conversion.color || calf.color),
    status: "गाभण",
    photo_url: cleanText(conversion.photo_url || calf.photo_url),
    photo_storage_path: cleanText(conversion.photo_storage_path || calf.photo_storage_path),
    notes: buildConversionNotes(calf, conversion),
    is_active: true
  };

  const cowValidationErrors = validateCowPayload(cowPayload, { requireName: true });

  if (cowValidationErrors.length > 0) {
    return { error: cowValidationErrors[0] };
  }

  if (tagNumber) {
    const { data: duplicateCow, error: duplicateError } = await supabase
      .from("cows")
      .select("id")
      .eq("farm_id", farmId)
      .eq("tag_number", tagNumber)
      .eq("is_active", true)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicateCow) {
      return { error: "हा कान टॅग नंबर आधीच दुसऱ्या गायीला वापरला आहे." };
    }
  }

  const { data: cow, error: cowError } = await supabase
    .from("cows")
    .insert(cowPayload)
    .select()
    .single();

  if (cowError) {
    throw cowError;
  }

  const { data: aiRecord, error: aiError } = await supabase
    .from("ai_records")
    .insert({
      farm_id: farmId,
      cow_id: cow.id,
      ai_date: conversion.ai_date,
      bull_code: cleanText(conversion.bull_code),
      bull_breed: cleanText(conversion.bull_breed) || "जर्सी",
      doctor_name: cleanText(conversion.doctor_name),
      cost,
      pregnancy_check_date: pregnancyCheckDate,
      pregnancy_result: "pending",
      notes: cleanText(conversion.ai_notes || conversion.notes)
    })
    .select()
    .single();

  if (aiError) {
    await supabase.from("cows").delete().eq("id", cow.id).eq("farm_id", farmId);
    throw aiError;
  }

  if (Number(aiRecord.cost || 0) > 0) {
    await refreshSummaryForDate(supabase, farmId, aiRecord.ai_date);
  }

  await updateFarmCowCount(supabase, farmId);

  return { cow, aiRecord };
}

function enrichCalf(calf) {
  return {
    ...calf,
    age_text: getCalfAgeText(calf.birth_date),
    milk_status_label: getCalfMilkStatus(calf)
  };
}

function buildStats(calves) {
  const active = calves.filter((calf) => calf.status === "active" && calf.is_raised);
  const milkFeeding = active.filter((calf) => calf.milk_status_label === "दूध पाजायचे सुरू आहे");

  return {
    total: calves.length,
    active: active.length,
    milkFeeding: milkFeeding.length,
    historical: calves.filter((calf) => calf.status === "historical").length,
    sold: calves.filter((calf) => calf.status === "sold").length,
    dead: calves.filter((calf) => calf.status === "dead").length,
    converted: calves.filter((calf) => calf.status === "converted_to_cow").length
  };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("calves")
      .select(CALF_SELECT)
      .eq("farm_id", farmId)
      .order("birth_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (allowedStatuses.has(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const calves = (data || []).map(enrichCalf);

    return NextResponse.json({
      data: calves,
      summary: buildStats(calves)
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);

    if (!body.birth_date || !body.gender) {
      return NextResponse.json({ error: "जन्म तारीख आणि लिंग आवश्यक आहे." }, { status: 400 });
    }

    if (!isISODate(body.birth_date)) {
      return NextResponse.json({ error: "जन्म तारीख चुकीची आहे." }, { status: 400 });
    }

    if (isFutureISODate(body.birth_date)) {
      return NextResponse.json({ error: "जन्म तारीख भविष्यातील नसावी." }, { status: 400 });
    }

    if (!allowedGenders.has(body.gender)) {
      return NextResponse.json({ error: "वासराचे लिंग नर किंवा मादी असावे." }, { status: 400 });
    }

    if (body.status && !["active", "historical"].includes(body.status)) {
      return NextResponse.json(
        { error: "नवीन वासरासाठी फक्त सक्रिय किंवा जन्म नोंद स्थिती वापरा." },
        { status: 400 }
      );
    }

    if (body.mother_cow_id && !isUuid(body.mother_cow_id)) {
      return NextResponse.json({ error: "आई गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmOwner(request);
    const supabase = getSupabaseServerClient();

    if (body.mother_cow_id) {
      const { data: motherCow, error: motherCowError } = await supabase
        .from("cows")
        .select("id")
        .eq("id", body.mother_cow_id)
        .eq("farm_id", farmId)
        .single();

      if (motherCowError || !motherCow) {
        return NextResponse.json({ error: "ही गाय तुमच्या डेअरीतील नाही." }, { status: 403 });
      }
    }

    const calf = await insertCalfWithReminders(supabase, buildCalfPayload(body, farmId));

    return NextResponse.json({ data: enrichCalf(calf) }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  let conversionCowIdToCleanup = null;
  let conversionFarmIdToCleanup = null;

  try {
    const body = await readJsonBody(request);

    if (!isUuid(body.id)) {
      return NextResponse.json({ error: "वासराचा आयडी आवश्यक आहे." }, { status: 400 });
    }

    const requestedStatus = body.status === undefined ? null : body.status;

    if (requestedStatus && !allowedStatuses.has(requestedStatus)) {
      return NextResponse.json({ error: "वासराची स्थिती चुकीची आहे." }, { status: 400 });
    }

    const auth = await verifyFarmOwner(request);
    const { farmId } = auth;
    if (body.mother_cow_id && !isUuid(body.mother_cow_id)) {
      return NextResponse.json({ error: "आई गाय क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    const supabase = getSupabaseServerClient();

    if (body.mother_cow_id) {
      const { data: motherCow, error: motherCowError } = await supabase
        .from("cows")
        .select("id")
        .eq("id", body.mother_cow_id)
        .eq("farm_id", farmId)
        .single();

      if (motherCowError || !motherCow) {
        return NextResponse.json({ error: "ही गाय तुमच्या डेअरीतील नाही." }, { status: 403 });
      }
    }

    const { data: existingCalf, error: existingError } = await supabase
      .from("calves")
      .select(CALF_SELECT)
      .eq("id", body.id)
      .eq("farm_id", farmId)
      .single();

    if (existingError || !existingCalf) {
      return NextResponse.json({ error: "वासरू सापडले नाही." }, { status: 404 });
    }

    const updates = {};

    if (requestedStatus) {
      updates.status = requestedStatus;
    }

    if (
      existingCalf.status === "converted_to_cow" &&
      existingCalf.converted_cow_id &&
      requestedStatus &&
      requestedStatus !== "converted_to_cow"
    ) {
      return NextResponse.json(
        { error: "ही वासरी गाय म्हणून जोडली आहे. बदल गायीच्या यादीतून करा." },
        { status: 400 }
      );
    }

    if (requestedStatus === "converted_to_cow" && !["active", "historical"].includes(existingCalf.status)) {
      return NextResponse.json(
        { error: "फक्त सक्रिय किंवा जन्म नोंद असलेली मादी वासरी गाय म्हणून जोडता येते." },
        { status: 400 }
      );
    }

    if (existingCalf.status === "dead" && requestedStatus && requestedStatus !== "dead") {
      return NextResponse.json(
        { error: "मृत वासराची स्थिती बदलता येत नाही. चुकीची नोंद असल्यास नवीन नोंद तयार करा." },
        { status: 400 }
      );
    }

    if (existingCalf.status === "sold" && requestedStatus === "dead") {
      return NextResponse.json(
        { error: "विकलेले वासरू मृत म्हणून बदलता येत नाही." },
        { status: 400 }
      );
    }

    if (["sold", "dead"].includes(requestedStatus) && existingCalf.status === "converted_to_cow") {
      return NextResponse.json(
        { error: "ही वासरी गाय म्हणून जोडली आहे. बदल गायीच्या यादीतून करा." },
        { status: 400 }
      );
    }

    editableTextFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = cleanText(body[field]);
      }
    });

    editablePhotoFields.forEach((field) => {
      if (body[field] !== undefined) {
        updates[field] = cleanText(body[field]);
      }
    });

    if (body.mother_cow_id !== undefined) {
      updates.mother_cow_id = body.mother_cow_id || null;
    }

    if (body.birth_date !== undefined) {
      if (!isISODate(body.birth_date)) {
        return NextResponse.json({ error: "जन्म तारीख चुकीची आहे." }, { status: 400 });
      }

      if (isFutureISODate(body.birth_date)) {
        return NextResponse.json({ error: "जन्म तारीख भविष्यातील नसावी." }, { status: 400 });
      }

      updates.birth_date = body.birth_date;
    }

    if (body.gender !== undefined) {
      if (!allowedGenders.has(body.gender)) {
        return NextResponse.json({ error: "वासराचे लिंग नर किंवा मादी असावे." }, { status: 400 });
      }
      updates.gender = normalizeGender(body.gender);
    }

    const lifecycleChanged =
      body.birth_date !== undefined || body.gender !== undefined || body.is_raised !== undefined;

    if (lifecycleChanged) {
      const nextGender = updates.gender || existingCalf.gender;
      const nextBirthDate = updates.birth_date || existingCalf.birth_date;
      const nextStatus = requestedStatus || existingCalf.status;
      const nextIsRaised =
        nextGender === "मादी"
          ? normalizeBoolean(body.is_raised !== undefined ? body.is_raised : existingCalf.is_raised)
          : false;
      const lifecycle = getCalfLifecycleDates(nextBirthDate);

      updates.is_raised = nextIsRaised;
      updates.milk_reduce_date = nextIsRaised ? lifecycle.milkReduceDate : null;
      updates.milk_stop_date = nextIsRaised ? lifecycle.milkStopDate : null;
      updates.milk_feeding_status = nextIsRaised && nextStatus === "active"
        ? getCalfMilkStatus({
            ...existingCalf,
            ...updates,
            status: "active"
          })
        : "not_tracked";

      if (!requestedStatus && ["active", "historical"].includes(existingCalf.status)) {
        updates.status = nextIsRaised ? "active" : "historical";
      }
    }

    if (requestedStatus === "converted_to_cow") {
      if (existingCalf.gender !== "मादी") {
        return NextResponse.json({ error: "फक्त मादी वासरी गाय म्हणून जोडता येते." }, { status: 400 });
      }

      if (!auth.user.isFarmOwner && auth.user.role !== "admin") {
        return NextResponse.json({ error: "ही कृती फक्त मालकासाठी आहे." }, { status: 403 });
      }

      if (!existingCalf.converted_cow_id) {
        const conversion = body.conversion || {};

        if (Object.keys(conversion).length === 0) {
          return NextResponse.json(
            { error: "गाय बनवण्यासाठी गायीचे नाव आणि कृत्रिम रेतन माहिती भरा." },
            { status: 400 }
          );
        }

        const conversionResult = await createCowFromConversion(supabase, farmId, existingCalf, conversion);

        if (conversionResult.error) {
          return NextResponse.json({ error: conversionResult.error }, { status: 400 });
        }

        conversionCowIdToCleanup = conversionResult.cow.id;
        conversionFarmIdToCleanup = farmId;
        updates.converted_cow_id = conversionResult.cow.id;
        updates.conversion_ai_record_id = conversionResult.aiRecord.id;
        updates.converted_at = new Date().toISOString();
      }

      updates.is_raised = false;
      updates.milk_feeding_status = "not_tracked";
    } else if (requestedStatus === "sold") {
      const saleAmount = parseSaleAmount(body.sale_amount);

      if (saleAmount === null) {
        return NextResponse.json({ error: "विक्रीची योग्य रक्कम लिहा." }, { status: 400 });
      }

      const soldDate = body.sold_date || getTodayISODate();

      if (!isISODate(soldDate)) {
        return NextResponse.json({ error: "विक्री तारीख चुकीची आहे." }, { status: 400 });
      }

      if (isFutureISODate(soldDate)) {
        return NextResponse.json({ error: "विक्री तारीख भविष्यातील नसावी." }, { status: 400 });
      }

      updates.sold_date = soldDate;
      updates.sale_amount = saleAmount;
      updates.sale_notes = cleanText(body.sale_notes);
    } else if (requestedStatus && existingCalf.status === "sold") {
      updates.sold_date = null;
      updates.sale_amount = null;
      updates.sale_notes = null;
      updates.finance_record_id = null;
    } else if (
      existingCalf.status === "sold" &&
      (body.sale_amount !== undefined || body.sold_date !== undefined || body.sale_notes !== undefined)
    ) {
      if (body.sale_amount !== undefined) {
        const saleAmount = parseSaleAmount(body.sale_amount);

        if (saleAmount === null) {
          return NextResponse.json({ error: "विक्रीची योग्य रक्कम लिहा." }, { status: 400 });
        }

        updates.sale_amount = saleAmount;
      }

      if (body.sold_date !== undefined) {
        if (!isISODate(body.sold_date)) {
          return NextResponse.json({ error: "विक्री तारीख चुकीची आहे." }, { status: 400 });
        }

        if (isFutureISODate(body.sold_date)) {
          return NextResponse.json({ error: "विक्री तारीख भविष्यातील नसावी." }, { status: 400 });
        }

        updates.sold_date = body.sold_date;
      }

      if (body.sale_notes !== undefined) {
        updates.sale_notes = cleanText(body.sale_notes);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती नाही." }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("calves")
      .update(updates)
      .eq("id", body.id)
      .eq("farm_id", farmId)
      .select(CALF_SELECT)
      .single();

    if (error) {
      throw error;
    }

    let calf = data;
    conversionCowIdToCleanup = null;
    conversionFarmIdToCleanup = null;

    const summaryRefreshDates = new Set();

    if (existingCalf.sold_date) {
      summaryRefreshDates.add(existingCalf.sold_date);
    }

    if (calf.status === "sold" && Number(calf.sale_amount || 0) > 0 && calf.sold_date) {
      const financeRecord = await upsertSaleFinanceRecord(supabase, farmId, calf);
      summaryRefreshDates.add(calf.sold_date);

      if (financeRecord.id !== calf.finance_record_id) {
        const { data: calfWithFinanceRecord, error: financeLinkError } = await supabase
          .from("calves")
          .update({
            finance_record_id: financeRecord.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", calf.id)
          .eq("farm_id", farmId)
          .select(CALF_SELECT)
          .single();

        if (financeLinkError) {
          throw financeLinkError;
        }

        calf = calfWithFinanceRecord;
      }
    } else if (existingCalf.status === "sold" && existingCalf.finance_record_id) {
      await deleteSaleFinanceRecord(supabase, farmId, existingCalf.finance_record_id);
    }

    for (const date of summaryRefreshDates) {
      await refreshSummaryForDate(supabase, farmId, date);
    }

    calf = {
      ...calf,
      reminders: await syncCalfReminders(supabase, calf)
    };

    return NextResponse.json({ data: enrichCalf(calf) });
  } catch (error) {
    if (conversionCowIdToCleanup) {
      const supabase = getSupabaseServerClient();
      await supabase.from("cows").delete().eq("id", conversionCowIdToCleanup);

      if (conversionFarmIdToCleanup) {
        await updateFarmCowCount(supabase, conversionFarmIdToCleanup);
      }
    }
    return farmErrorResponse(error);
  }
}
