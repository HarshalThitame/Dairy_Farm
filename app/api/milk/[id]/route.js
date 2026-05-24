import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const milkFields = [
  "cow_id",
  "date",
  "morning_litres",
  "evening_litres",
  "fat_percentage",
  "notes"
];

function pickFields(body) {
  return milkFields.reduce((payload, field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
    return payload;
  }, {});
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const auth = await verifyFarmAccess(request, body.cow_id || null);
    const payload = pickFields(body);

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("milk_records")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", auth.farmId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "दूध नोंद सापडली नाही." }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
