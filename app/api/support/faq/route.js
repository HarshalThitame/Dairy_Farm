import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { faqCategories, logSupportAudit, normalizeFaq, normalizeSearch } from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const q = normalizeSearch(searchParams.get("q"));
    const articleId = searchParams.get("articleId");

    if (articleId) {
      const { data, error } = await supabase
        .from("faq_articles")
        .select("*")
        .eq("id", articleId)
        .eq("is_published", true)
        .single();
      if (error) throw error;

      await supabase
        .from("faq_articles")
        .update({ views_count: Number(data.views_count || 0) + 1 })
        .eq("id", articleId);

      return NextResponse.json({ article: normalizeFaq({ ...data, views_count: Number(data.views_count || 0) + 1 }) });
    }

    let query = supabase
      .from("faq_articles")
      .select("*")
      .eq("is_published", true);

    if (category !== "all") {
      query = query.eq("category", category);
    }
    if (q) {
      const like = `%${q}%`;
      query = query.or(`title.ilike.${like},body.ilike.${like}`);
    }

    const { data, error } = await query.order("views_count", { ascending: false }).limit(50);
    if (error) throw error;

    return NextResponse.json({
      categories: faqCategories,
      articles: (data || []).map(normalizeFaq)
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const body = await request.json().catch(() => ({}));
    const articleId = body.articleId;
    const action = body.action;

    if (!articleId || !["helpful", "not_helpful", "view"].includes(action)) {
      return NextResponse.json({ error: "Action चुकीची आहे." }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabase
      .from("faq_articles")
      .select("*")
      .eq("id", articleId)
      .eq("is_published", true)
      .single();
    if (fetchError) throw fetchError;

    const patch = {};
    if (action === "helpful") patch.helpful_count = Number(current.helpful_count || 0) + 1;
    if (action === "not_helpful") patch.not_helpful_count = Number(current.not_helpful_count || 0) + 1;
    if (action === "view") patch.views_count = Number(current.views_count || 0) + 1;

    const { data, error } = await supabase
      .from("faq_articles")
      .update(patch)
      .eq("id", articleId)
      .select("*")
      .single();
    if (error) throw error;

    await logSupportAudit(supabase, request, auth, `faq_${action}`, { articleId, title: data.title });
    return NextResponse.json({ article: normalizeFaq(data), message: "Feedback जतन झाला." });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

