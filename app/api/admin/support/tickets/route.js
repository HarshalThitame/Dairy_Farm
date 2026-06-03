import { NextResponse } from "next/server";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { normalizeTicket, ticketSummaryStats } from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const q = String(searchParams.get("q") || "").replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

    let query = supabase
      .from("support_tickets")
      .select("*, farms(id, farm_name, owner_mobile), users(id, name, mobile), super_admins(id, name)")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (status !== "all") query = query.eq("status", status);
    if (q) query = query.or(`ticket_number.ilike.%${q}%,subject.ilike.%${q}%,description.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    const { data: statsRows, error: statsError } = await supabase
      .from("support_tickets")
      .select("id, status, priority");
    if (statsError) throw statsError;

    return NextResponse.json({
      tickets: (data || []).map((row) => ({
        ...normalizeTicket(row),
        farm: row.farms || null,
        user: row.users || null
      })),
      stats: ticketSummaryStats(statsRows || [])
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    await logAdminAction(request, adminId, "support_ticket_admin_endpoint_used", null, {});
    return NextResponse.json({ message: "Use ticket detail endpoint for replies." });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
