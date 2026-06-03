import { NextResponse } from "next/server";
import { refreshSummaryForDate } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { pickMilkFields } from "@/lib/milkRecordFields";
import { deleteDairySlipsForMilkDate, syncMilkRecordToDairySlips } from "@/lib/milkDairySync";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isUuid, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      return NextResponse.json({ error: "दूध नोंद क्रमांक चुकीचा आहे." }, { status: 400 });
    }
    const body = await readJsonBody(request);
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
    const { data: oldRecord, error: oldRecordError } = await supabase
      .from("milk_records")
      .select("id, date")
      .eq("id", params.id)
      .eq("farm_id", auth.farmId)
      .is("cow_id", null)
      .maybeSingle();

    if (oldRecordError) {
      throw oldRecordError;
    }

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

    if (oldRecord?.date && oldRecord.date !== data.date) {
      await deleteDairySlipsForMilkDate(supabase, auth.farmId, oldRecord.date);
      await refreshSummaryForDate(supabase, auth.farmId, oldRecord.date);
    }

    await syncMilkRecordToDairySlips(supabase, auth.farmId, data);
    await refreshSummaryForDate(supabase, auth.farmId, data.date);

    return NextResponse.json({ data });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
