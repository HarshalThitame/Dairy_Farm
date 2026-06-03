import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { normalizeFaq, normalizeSearch, normalizeTicket, normalizeTutorial } from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const q = normalizeSearch(searchParams.get("q"));

    if (!q || q.length < 2) {
      return NextResponse.json({ query: q, faqs: [], tutorials: [], tickets: [] });
    }

    const like = `%${q}%`;
    const [faqResult, tutorialsResult, ticketsResult] = await Promise.all([
      supabase
        .from("faq_articles")
        .select("*")
        .eq("is_published", true)
        .or(`title.ilike.${like},body.ilike.${like}`)
        .order("views_count", { ascending: false })
        .limit(8),
      supabase
        .from("tutorials")
        .select("*")
        .eq("is_published", true)
        .or(`title.ilike.${like},description.ilike.${like},content.ilike.${like}`)
        .order("views_count", { ascending: false })
        .limit(8),
      supabase
        .from("support_tickets")
        .select("*, super_admins(id, name)")
        .eq("farm_id", auth.farmId)
        .or(`ticket_number.ilike.${like},subject.ilike.${like},description.ilike.${like}`)
        .order("updated_at", { ascending: false })
        .limit(8)
    ]);

    [faqResult, tutorialsResult, ticketsResult].forEach((result) => {
      if (result.error) throw result.error;
    });

    return NextResponse.json({
      query: q,
      faqs: (faqResult.data || []).map(normalizeFaq),
      tutorials: (tutorialsResult.data || []).map(normalizeTutorial),
      tickets: (ticketsResult.data || []).map(normalizeTicket)
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

