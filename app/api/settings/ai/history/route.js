import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim().toLowerCase();
    const supabase = getSupabaseServerClient();
    const query = supabase
      .from("ai_assistant_logs")
      .select("id, question, response, execution_ms, feedback, feedback_at, created_at")
      .eq("farm_id", auth.farmId)
      .eq("user_id", auth.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(search ? 1000 : 100);

    const { data, error } = await query;
    if (error) throw error;
    const rows = data || [];
    const filtered = search
      ? rows.filter((row) =>
          String(row.question || "").toLowerCase().includes(search) ||
          String(row.response || "").toLowerCase().includes(search)
        )
      : rows;

    return NextResponse.json({ history: filtered.slice(0, 100) });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get("id") || "").trim();
    const all = searchParams.get("all") === "true";

    if (!id && !all) {
      return NextResponse.json({ error: "कुठली history delete करायची ते निवडा." }, { status: 400 });
    }
    if (id && !uuidPattern.test(id)) {
      return NextResponse.json({ error: "AI history record चुकीचा आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("ai_assistant_logs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("farm_id", auth.farmId)
      .eq("user_id", auth.userId)
      .is("deleted_at", null);

    if (id && !all) {
      query = query.eq("id", id);
    }

    const { data, error } = await query.select("id");
    if (error) throw error;

    if (id && !all && !data?.length) {
      return NextResponse.json({ error: "AI history record सापडला नाही." }, { status: 404 });
    }

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, all ? "ai_history_deleted_all" : "ai_history_deleted", {
      id: all ? null : id,
      deletedCount: data?.length || 0
    });

    return NextResponse.json({ success: true, deletedCount: data?.length || 0 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
