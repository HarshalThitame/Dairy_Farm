import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { normalizeFaq, normalizeSearch, normalizeTicket, normalizeTutorial } from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function safeSearchQuery(query, fallback = []) {
  const { data, error } = await query;

  if (!error) {
    return data || fallback;
  }

  if (["42P01", "42703", "PGRST200", "PGRST201"].includes(error.code)) {
    return fallback;
  }

  throw error;
}

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
    const [faqRows, tutorialRows, ticketRows] = await Promise.all([
      safeSearchQuery(
        supabase
          .from("faq_articles")
          .select("*")
          .eq("is_published", true)
          .or(`title.ilike.${like},body.ilike.${like}`)
          .order("views_count", { ascending: false })
          .limit(8)
      ),
      safeSearchQuery(
        supabase
          .from("tutorials")
          .select("*")
          .eq("is_published", true)
          .or(`title.ilike.${like},description.ilike.${like},content.ilike.${like}`)
          .order("views_count", { ascending: false })
          .limit(8)
      ),
      safeSearchQuery(
        supabase
          .from("support_tickets")
          .select("*")
          .eq("farm_id", auth.farmId)
          .or(`ticket_number.ilike.${like},subject.ilike.${like},description.ilike.${like}`)
          .order("updated_at", { ascending: false })
          .limit(8)
      )
    ]);

    return NextResponse.json({
      query: q,
      faqs: (faqRows || []).map(normalizeFaq),
      tutorials: (tutorialRows || []).map(normalizeTutorial),
      tickets: (ticketRows || []).map(normalizeTicket)
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
