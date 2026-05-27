import { NextResponse } from "next/server";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const healthFields = [
  "cow_id",
  "date",
  "type",
  "description",
  "doctor_name",
  "cost",
  "next_due_date",
  "vaccine_name",
  "notes"
];

function pickFields(body) {
  return healthFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

function normalizeHealthPayload(body) {
  const payload = pickFields(body);

  if (payload.cost !== undefined) {
    payload.cost = payload.cost === "" || payload.cost === null ? null : Number(payload.cost);
  }

  ["description", "doctor_name", "vaccine_name", "notes"].forEach((field) => {
    if (payload[field] !== undefined) {
      const text = String(payload[field] || "").trim();
      payload[field] = text || null;
    }
  });

  return payload;
}

function validateHealth(body) {
  if (!body.cow_id || !body.date || !body.type) {
    return "गाय, तारीख आणि प्रकार आवश्यक आहे.";
  }

  if (
    body.cost !== undefined &&
    body.cost !== "" &&
    body.cost !== null &&
    (!Number.isFinite(Number(body.cost)) || Number(body.cost) < 0)
  ) {
    return "खर्च शून्य किंवा त्यापेक्षा जास्त असावा.";
  }

  return "";
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const cowId = searchParams.get("cow_id");
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("health_records")
      .select("*, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (cowId) {
      await verifyFarmAccess(request, cowId);
      query = query.eq("cow_id", cowId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validationError = validateHealth(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const payload = {
      ...normalizeHealthPayload(body),
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("health_records")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (Number(data.cost || 0) > 0) {
      await refreshSummaryForDate(supabase, farmId, data.date);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
