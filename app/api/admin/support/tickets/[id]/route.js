import { NextResponse } from "next/server";
import { badRequest, isUuid } from "@/lib/apiSafety";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  createSupportNotification,
  loadTicketBundle,
  normalizeTicket
} from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedStatuses = ["open", "in_progress", "waiting_for_user", "resolved", "closed", "rejected"];

async function getTicket(supabase, ticketId) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*, farms(id, farm_name, owner_mobile), users(id, name, mobile), super_admins(id, name)")
    .eq("id", ticketId)
    .single();
  if (error || !data) {
    const notFound = new Error("Ticket not found");
    notFound.status = 404;
    throw notFound;
  }
  return data;
}

async function loadAdminBundle(supabase, ticketId) {
  const ticketRow = await getTicket(supabase, ticketId);
  const bundle = await loadTicketBundle(supabase, ticketRow.farm_id, ticketId);
  return {
    ...bundle,
    ticket: {
      ...normalizeTicket(ticketRow),
      farm: ticketRow.farms || null,
      user: ticketRow.users || null
    }
  };
}

export async function GET(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Ticket ID चुकीचा आहे.");
    }
    await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const bundle = await loadAdminBundle(supabase, params.id);
    return NextResponse.json(bundle);
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Ticket ID चुकीचा आहे.");
    }
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const supabase = getSupabaseServerClient();
    const ticket = await getTicket(supabase, params.id);

    if (action === "reply") {
      const message = String(body.message || "").trim().slice(0, 5000);
      if (message.length < 2) {
        return NextResponse.json({ error: "Reply message is required." }, { status: 400 });
      }

      const { error: messageError } = await supabase.from("ticket_messages").insert({
        ticket_id: params.id,
        farm_id: ticket.farm_id,
        admin_id: adminId,
        sender_type: "admin",
        message
      });
      if (messageError) throw messageError;

      const nextStatus = body.status && allowedStatuses.includes(body.status) ? body.status : "waiting_for_user";
      const patch = { status: nextStatus, assigned_admin_id: adminId };
      if (nextStatus === "resolved") patch.resolved_at = new Date().toISOString();
      if (nextStatus === "closed") patch.closed_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("support_tickets")
        .update(patch)
        .eq("id", params.id);
      if (updateError) throw updateError;

      await createSupportNotification(supabase, { userId: ticket.user_id, farmId: ticket.farm_id }, {
        title: "Support team ने reply दिला",
        message: `${ticket.ticket_number} ticket मध्ये नवीन reply आला आहे.`,
        url: `/support/tickets/${params.id}`,
        priority: ticket.priority === "critical" ? "urgent" : "normal"
      });

      await logAdminAction(request, adminId, "support_ticket_replied", ticket.farm_id, {
        ticketId: params.id,
        ticketNumber: ticket.ticket_number,
        status: nextStatus
      });
    } else if (action === "status") {
      const status = body.status;
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }

      const patch = { status, assigned_admin_id: adminId };
      if (status === "resolved") patch.resolved_at = new Date().toISOString();
      if (status === "closed") patch.closed_at = new Date().toISOString();
      if (!["resolved", "closed"].includes(status)) {
        patch.resolved_at = null;
        patch.closed_at = null;
      }

      const { error } = await supabase.from("support_tickets").update(patch).eq("id", params.id);
      if (error) throw error;

      await supabase.from("ticket_messages").insert({
        ticket_id: params.id,
        farm_id: ticket.farm_id,
        admin_id: adminId,
        sender_type: "system",
        message: `Admin ने ticket status "${status}" केला.`
      });

      await createSupportNotification(supabase, { userId: ticket.user_id, farmId: ticket.farm_id }, {
        title: "Support ticket status बदलला",
        message: `${ticket.ticket_number} ticket status update झाला.`,
        url: `/support/tickets/${params.id}`
      });

      await logAdminAction(request, adminId, "support_ticket_status_changed", ticket.farm_id, {
        ticketId: params.id,
        ticketNumber: ticket.ticket_number,
        status
      });
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const bundle = await loadAdminBundle(supabase, params.id);
    return NextResponse.json({ ...bundle, message: "Ticket updated." });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
