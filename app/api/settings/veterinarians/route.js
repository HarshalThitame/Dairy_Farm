import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess, verifyFarmOwner } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const textFields = ["name", "mobile", "village", "notes"];

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeVeterinarian(row) {
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    mobile: row.mobile,
    village: row.village,
    notes: row.notes,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildPayload(body) {
  return textFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = cleanText(body[field]);
    }
    return payload;
  }, {});
}

function validatePayload(payload) {
  if (!payload.name || payload.name.length < 2) {
    return "पशुवैद्यकाचे नाव किमान २ अक्षरे असावे.";
  }

  if (payload.mobile && !/^[0-9+\-\s]{7,15}$/.test(payload.mobile)) {
    return "मोबाईल नंबर योग्य format मध्ये लिहा.";
  }

  return "";
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("farm_veterinarians")
      .select("*")
      .eq("farm_id", farmId)
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data: (data || []).map(normalizeVeterinarian) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmOwner(request);
    const body = await readJsonBody(request);
    const payload = {
      ...buildPayload(body),
      farm_id: farmId,
      is_active: body.is_active === undefined ? true : Boolean(body.is_active)
    };
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("farm_veterinarians")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "हे पशुवैद्यक आधीच जोडलेले आहेत." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data: normalizeVeterinarian(data) }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
