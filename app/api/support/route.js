import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  normalizeFaq,
  normalizeFeature,
  normalizeTicket,
  normalizeTutorial,
  ticketSummaryStats
} from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function latestByService(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.service_name)) {
      map.set(row.service_name, row);
    }
  });
  return Array.from(map.values());
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();

    const [ticketsResult, faqResult, tutorialsResult, featuresResult, votesResult, statusResult] = await Promise.all([
      supabase
        .from("support_tickets")
        .select("*, super_admins(id, name)")
        .eq("farm_id", auth.farmId)
        .order("updated_at", { ascending: false })
        .limit(6),
      supabase
        .from("faq_articles")
        .select("*")
        .eq("is_published", true)
        .order("views_count", { ascending: false })
        .limit(5),
      supabase
        .from("tutorials")
        .select("*")
        .eq("is_published", true)
        .order("views_count", { ascending: false })
        .limit(4),
      supabase
        .from("feature_requests")
        .select("*")
        .eq("farm_id", auth.farmId)
        .order("votes_count", { ascending: false })
        .limit(5),
      supabase
        .from("feature_votes")
        .select("feature_request_id")
        .eq("farm_id", auth.farmId)
        .eq("user_id", auth.userId),
      supabase
        .from("system_status_logs")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(20)
    ]);

    [ticketsResult, faqResult, tutorialsResult, featuresResult, votesResult, statusResult].forEach((result) => {
      if (result.error) throw result.error;
    });

    const tickets = ticketsResult.data || [];
    const votedIds = new Set((votesResult.data || []).map((row) => row.feature_request_id));

    return NextResponse.json({
      stats: ticketSummaryStats(tickets),
      recentTickets: tickets.map(normalizeTicket),
      topFaq: (faqResult.data || []).map(normalizeFaq),
      tutorials: (tutorialsResult.data || []).map(normalizeTutorial),
      featureRequests: (featuresResult.data || []).map((row) => normalizeFeature(row, votedIds)),
      status: latestByService(statusResult.data || []),
      quickActions: [
        { title: "FAQ", href: "/support/faq", icon: "❓" },
        { title: "Ticket तयार करा", href: "/support/tickets", icon: "🎫" },
        { title: "Contact Support", href: "/support/contact", icon: "📞" },
        { title: "Tutorials", href: "/support/tutorials", icon: "🎥" }
      ]
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

