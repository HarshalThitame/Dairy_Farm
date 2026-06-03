import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logSupportAudit, normalizeSearch, normalizeTutorial, tutorialCategories } from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const q = normalizeSearch(searchParams.get("q"));
    const tutorialId = searchParams.get("tutorialId");

    if (tutorialId) {
      const { data, error } = await supabase
        .from("tutorials")
        .select("*")
        .eq("id", tutorialId)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      await supabase.from("tutorials").update({ views_count: Number(data.views_count || 0) + 1 }).eq("id", tutorialId);
      await logSupportAudit(supabase, request, auth, "tutorial_viewed", { tutorialId, title: data.title });
      return NextResponse.json({ tutorial: normalizeTutorial({ ...data, views_count: Number(data.views_count || 0) + 1 }) });
    }

    let query = supabase.from("tutorials").select("*").eq("is_published", true);
    if (category !== "all") query = query.eq("category", category);
    if (q) {
      const like = `%${q}%`;
      query = query.or(`title.ilike.${like},description.ilike.${like},content.ilike.${like}`);
    }

    const { data, error } = await query.order("views_count", { ascending: false }).limit(50);
    if (error) throw error;

    return NextResponse.json({
      categories: tutorialCategories,
      tutorials: (data || []).map(normalizeTutorial)
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

