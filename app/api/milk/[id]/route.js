import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { pickMilkFields } from "@/lib/milkRecordFields";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const auth = await verifyFarmAccess(request);
    const pickedFields = pickMilkFields(body);

    if (Object.keys(pickedFields).length === 0) {
      return NextResponse.json({ error: "बदल करण्यासाठी माहिती द्या." }, { status: 400 });
    }

    const payload = {
      ...pickedFields,
      cow_id: null
    };

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("milk_records")
      .update(payload)
      .eq("id", params.id)
      .eq("farm_id", auth.farmId)
      .is("cow_id", null)
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
