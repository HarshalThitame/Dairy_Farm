import { NextResponse } from "next/server";
import { ACCOUNTING_PERIOD_MONTHLY } from "@/lib/accountingPeriods";
import { addDaysToISODate, getCalfAgeText, getCalfLifecycleDates, getCalfMilkStatus } from "@/lib/calfLifecycle";
import { buildCalfPayload, CALF_SELECT, insertCalfWithReminders } from "@/lib/calfServer";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getTodayISODate } from "@/lib/marathiUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set(["active", "historical", "sold", "dead", "converted_to_cow"]);
const allowedGenders = new Set(["नर", "मादी"]);
const editableTextFields = ["name", "color", "breed", "notes"];
const editablePhotoFields = ["photo_url", "photo_storage_path"];

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
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function normalizeGender(value) {
  return value === "नर" ? "नर" : "मादी";
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

  const cost = parseOptionalAmount(conversion.cost);

  if (cost === undefined) {
    return { error: "रेतन खर्च चुकीचा आहे." };
  }

  const pregnancyCheckDate =
    conversion.pregnancy_check_date && isISODate(conversion.pregnancy_check_date)
      ? conversion.pregnancy_check_date
      : addDaysToISODate(conversion.ai_date, 60);

  const { data: cow, error: cowError } = await supabase
    .from("cows")
    .insert({
      farm_id: farmId,
      name: cowName,
      breed: cleanText(conversion.breed || calf.breed || calf.mother?.breed) || "जर्सी",
      date_of_birth: calf.birth_date,
      tag_number: cleanText(conversion.tag_number),
      color: cleanText(conversion.color || calf.color),
      status: "गाभण",
      photo_url: cleanText(conversion.photo_url || calf.photo_url),
      photo_storage_path: cleanText(conversion.photo_storage_path || calf.photo_storage_path),
      notes: buildConversionNotes(calf, conversion),
      is_active: true
    })
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
    const body = await request.json();

    if (!body.birth_date || !body.gender) {
      return NextResponse.json({ error: "जन्म तारीख आणि लिंग आवश्यक आहे." }, { status: 400 });
    }

    if (!allowedGenders.has(body.gender)) {
      return NextResponse.json({ error: "वासराचे लिंग नर किंवा मादी असावे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.mother_cow_id || null);
    const supabase = getSupabaseServerClient();
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
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "वासराचा आयडी आवश्यक आहे." }, { status: 400 });
    }

    const requestedStatus = body.status === undefined ? null : body.status;

    if (requestedStatus && !allowedStatuses.has(requestedStatus)) {
      return NextResponse.json({ error: "वासराची स्थिती चुकीची आहे." }, { status: 400 });
    }

    const auth = await verifyFarmAccess(request);
    const { farmId } = auth;
    if (body.mother_cow_id) {
      await verifyFarmAccess(request, body.mother_cow_id);
    }

    const supabase = getSupabaseServerClient();
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
          ? Boolean(body.is_raised !== undefined ? body.is_raised : existingCalf.is_raised)
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

    if (calf.status === "sold" && Number(calf.sale_amount || 0) > 0 && calf.sold_date) {
      const financeRecord = await upsertSaleFinanceRecord(supabase, farmId, calf);

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
