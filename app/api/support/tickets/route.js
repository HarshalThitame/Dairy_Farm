import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  createSupportNotification,
  logSupportAudit,
  normalizeTicket,
  sanitizeTicketPayload,
  ticketSummaryStats,
  validateTicketPayload
} from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") || 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("support_tickets")
      .select("*, super_admins(id, name, email)", { count: "exact" })
      .eq("farm_id", auth.farmId);

    if (status !== "all") query = query.eq("status", status);

    const { data, error, count } = await query
      .order("updated_at", { ascending: false })
      .range(from, to);
    if (error) throw error;

    const { data: allForStats, error: statsError } = await supabase
      .from("support_tickets")
      .select("id, status, priority")
      .eq("farm_id", auth.farmId);
    if (statsError) throw statsError;

    return NextResponse.json({
      tickets: (data || []).map(normalizeTicket),
      stats: ticketSummaryStats(allForStats || []),
      pagination: { page, pageSize, total: count || 0 }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const payload = sanitizeTicketPayload(body, request);
    const validationError = validateTicketPayload(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const supabase = getSupabaseServerClient();
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        farm_id: auth.farmId,
        user_id: auth.userId,
        subject: payload.subject,
        category: payload.category,
        priority: payload.priority,
        description: payload.description,
        preferred_contact_method: payload.preferred_contact_method,
        device_info: payload.device_info,
        metadata: payload.metadata
      })
      .select("*, super_admins(id, name, email)")
      .single();
    if (error) throw error;

    const { error: messageError } = await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      farm_id: auth.farmId,
      user_id: auth.userId,
      sender_type: "user",
      message: payload.description
    });
    if (messageError) throw messageError;

    await logSupportAudit(supabase, request, auth, "ticket_created", {
      ticketNumber: ticket.ticket_number,
      category: ticket.category,
      priority: ticket.priority
    }, ticket.id);

    await createSupportNotification(supabase, auth, {
      title: "Support ticket तयार झाले",
      message: `${ticket.ticket_number} ticket तयार झाले आहे. Support team लवकरच उत्तर देईल.`,
      url: `/support/tickets/${ticket.id}`,
      priority: ticket.priority === "critical" ? "urgent" : "normal"
    });

    return NextResponse.json({
      ticket: normalizeTicket(ticket),
      message: "Support ticket तयार झाले."
    }, { status: 201 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

