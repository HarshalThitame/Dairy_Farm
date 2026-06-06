import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";
import { isUuid } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", auth.userId)
      .order("last_active_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ sessions: data || [] });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "current";
    const sessionId = auth.decoded?.sessionId;
    const targetSessionId = searchParams.get("session_id") || "";
    const supabase = getSupabaseServerClient();
    const update = {
      is_active: false,
      logout_at: new Date().toISOString()
    };

    let query = supabase
      .from("user_sessions")
      .update(update)
      .eq("user_id", auth.userId);

    if (mode === "current" && sessionId) {
      query = query.eq("id", sessionId);
    } else if (mode === "all") {
      query = query.eq("is_active", true);
    } else if (targetSessionId) {
      if (!isUuid(targetSessionId)) {
        return NextResponse.json({ error: "Session आयडी चुकीचा आहे." }, { status: 400 });
      }
      query = query.eq("id", targetSessionId);
    } else {
      return NextResponse.json({ error: "Session निवडा." }, { status: 400 });
    }

    const { data, error } = await query.select("id");
    if (error) throw error;
    if (!data?.length) {
      if (mode === "all") {
        await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "logout_all_devices");
        return NextResponse.json({ success: true, affected: 0 });
      }
      return NextResponse.json({ error: "Session सापडली नाही किंवा आधीच बंद आहे." }, { status: 404 });
    }

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, mode === "all" ? "logout_all_devices" : "logout_device");
    return NextResponse.json({ success: true, affected: data.length });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
