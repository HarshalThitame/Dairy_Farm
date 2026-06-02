import { NextResponse } from "next/server";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const aiFields = [
  "cow_id",
  "ai_date",
  "bull_code",
  "bull_breed",
  "doctor_name",
  "cost",
  "pregnancy_check_date",
  "pregnancy_result",
  "notes"
];

const defaultBullBreed = "जर्सी";
const allowedPregnancyResults = new Set(["positive", "negative", "pending"]);

function pickFields(body) {
  return aiFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const cowId = searchParams.get("cow_id");
    const summaryOnly = searchParams.get("summary") === "true";
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("ai_records")
      .select(summaryOnly ? "id, cow_id, ai_date, pregnancy_check_date, pregnancy_result" : "*, cows(id, name, breed)")
      .eq("farm_id", farmId)
      .order("ai_date", { ascending: false })
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

    if (!body.cow_id || !body.ai_date) {
      return NextResponse.json({ error: "गाय आणि रेतन तारीख आवश्यक आहे." }, { status: 400 });
    }

    if (
      body.pregnancy_result !== undefined &&
      body.pregnancy_result !== "" &&
      !allowedPregnancyResults.has(body.pregnancy_result)
    ) {
      return NextResponse.json({ error: "गर्भधारणा निकाल चुकीचा आहे." }, { status: 400 });
    }

    if (
      body.cost !== undefined &&
      body.cost !== "" &&
      body.cost !== null &&
      (!Number.isFinite(Number(body.cost)) || Number(body.cost) < 0)
    ) {
      return NextResponse.json({ error: "रेतन खर्च शून्य किंवा त्यापेक्षा जास्त असावा." }, { status: 400 });
    }

    const { farmId } = await verifyFarmAccess(request, body.cow_id);
    const payload = {
      ...pickFields(body),
      bull_breed:
        body.bull_breed && String(body.bull_breed).trim()
          ? String(body.bull_breed).trim()
          : defaultBullBreed,
      cost: body.cost === "" || body.cost === null || body.cost === undefined ? null : Number(body.cost),
      pregnancy_result: body.pregnancy_result || "pending",
      farm_id: farmId
    };
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("ai_records")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (Number(data.cost || 0) > 0) {
      await refreshSummaryForDate(supabase, farmId, data.ai_date);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
