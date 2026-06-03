import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim();
    const supabase = getSupabaseServerClient();
    const query = supabase
      .from("ai_assistant_logs")
      .select("id, question, response, execution_ms, feedback, feedback_at, created_at")
      .eq("farm_id", auth.farmId)
      .eq("user_id", auth.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data, error } = await query;
    if (error) throw error;
    const rows = data || [];
    const normalizedSearch = search.toLowerCase();
    const filtered = normalizedSearch
      ? rows.filter((row) =>
          String(row.question || "").toLowerCase().includes(normalizedSearch) ||
          String(row.response || "").toLowerCase().includes(normalizedSearch)
        )
      : rows;

    return NextResponse.json({ history: filtered });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all") === "true";

    if (!id && !all) {
      return NextResponse.json({ error: "कुठली history delete करायची ते निवडा." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("ai_assistant_logs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("farm_id", auth.farmId)
      .eq("user_id", auth.userId)
      .is("deleted_at", null);

    if (id) {
      query = query.eq("id", id);
    }

    const { error } = await query;
    if (error) throw error;

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, all ? "ai_history_deleted_all" : "ai_history_deleted", {
      id: id || null
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
