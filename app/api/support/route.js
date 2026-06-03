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

async function safeSupportQuery(query, fallback = []) {
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

    const [recentTickets, statsTickets, faqRows, tutorialRows, featureRows, voteRows, statusRows] = await Promise.all([
      safeSupportQuery(
        supabase
          .from("support_tickets")
          .select("*")
          .eq("farm_id", auth.farmId)
          .order("updated_at", { ascending: false })
          .limit(6)
      ),
      safeSupportQuery(
        supabase
          .from("support_tickets")
          .select("id, status, priority")
          .eq("farm_id", auth.farmId)
          .limit(1000)
      ),
      safeSupportQuery(
        supabase
          .from("faq_articles")
          .select("*")
          .eq("is_published", true)
          .order("views_count", { ascending: false })
          .limit(5)
      ),
      safeSupportQuery(
        supabase
          .from("tutorials")
          .select("*")
          .eq("is_published", true)
          .order("views_count", { ascending: false })
          .limit(4)
      ),
      safeSupportQuery(
        supabase
          .from("feature_requests")
          .select("*")
          .eq("farm_id", auth.farmId)
          .order("votes_count", { ascending: false })
          .limit(5)
      ),
      safeSupportQuery(
        supabase
          .from("feature_votes")
          .select("feature_request_id")
          .eq("farm_id", auth.farmId)
          .eq("user_id", auth.userId)
      ),
      safeSupportQuery(
        supabase
          .from("system_status_logs")
          .select("*")
          .order("checked_at", { ascending: false })
          .limit(20)
      )
    ]);

    const votedIds = new Set((voteRows || []).map((row) => row.feature_request_id));

    return NextResponse.json({
      stats: ticketSummaryStats(statsTickets || []),
      recentTickets: (recentTickets || []).map(normalizeTicket),
      topFaq: (faqRows || []).map(normalizeFaq),
      tutorials: (tutorialRows || []).map(normalizeTutorial),
      featureRequests: (featureRows || []).map((row) => normalizeFeature(row, votedIds)),
      status: latestByService(statusRows || []),
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
