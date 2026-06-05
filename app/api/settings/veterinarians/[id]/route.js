import { NextResponse } from "next/server";
import { isUuid, readJsonBody } from "@/lib/apiSafety";
import { farmErrorResponse, verifyFarmOwner } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

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
  const payload = textFields.reduce((current, field) => {
    if (body[field] !== undefined) {
      current[field] = cleanText(body[field]);
    }
    return current;
  }, {});

  if (body.is_active !== undefined) {
    payload.is_active = Boolean(body.is_active);
  }

  payload.updated_at = new Date().toISOString();
  return payload;
}

function validatePayload(payload) {
  if (payload.name !== undefined && (!payload.name || payload.name.length < 2)) {
    return "पशुवैद्यकाचे नाव किमान २ अक्षरे असावे.";
  }

  if (payload.mobile && !/^[0-9+\-\s]{7,15}$/.test(payload.mobile)) {
    return "मोबाईल नंबर योग्य format मध्ये लिहा.";
  }

  return "";
}

export async function PATCH(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: "पशुवैद्यक क्रमांक चुकीचा आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmOwner(request);
    const body = await readJsonBody(request);
    const payload = buildPayload(body);
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("farm_veterinarians")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", farmId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "हे पशुवैद्यक आधीच जोडलेले आहेत." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ data: normalizeVeterinarian(data) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: "पशुवैद्यक क्रमांक चुकीचा आहे." }, { status: 400 });
    }

    const { farmId } = await verifyFarmOwner(request);
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("farm_veterinarians")
      .delete()
      .eq("id", params.id)
      .eq("farm_id", farmId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
