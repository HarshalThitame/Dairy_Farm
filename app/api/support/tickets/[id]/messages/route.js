import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  createSupportNotification,
  getTicketForFarm,
  loadTicketBundle,
  logSupportAudit
} from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request, { params }) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const message = String(body.message || "").trim().slice(0, 5000);

    if (message.length < 2) {
      return NextResponse.json({ error: "उत्तर लिहा." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const ticket = await getTicketForFarm(supabase, auth.farmId, params.id);

    if (["closed", "rejected"].includes(ticket.status)) {
      return NextResponse.json({ error: "हे ticket बंद आहे. आधी पुन्हा सुरू करा." }, { status: 400 });
    }

    const { error: messageError } = await supabase.from("ticket_messages").insert({
      ticket_id: params.id,
      farm_id: auth.farmId,
      user_id: auth.userId,
      sender_type: "user",
      message
    });
    if (messageError) throw messageError;

    if (["waiting_for_user", "resolved"].includes(ticket.status)) {
      const { error: statusError } = await supabase
        .from("support_tickets")
        .update({ status: "open", resolved_at: null, closed_at: null })
        .eq("id", params.id)
        .eq("farm_id", auth.farmId);
      if (statusError) throw statusError;
    }

    await logSupportAudit(supabase, request, auth, "ticket_reply_added", { ticketNumber: ticket.ticket_number }, params.id);
    await createSupportNotification(supabase, auth, {
      title: "Support reply जतन झाला",
      message: `${ticket.ticket_number} मध्ये तुमचा reply जतन झाला.`,
      url: `/support/tickets/${params.id}`
    });

    const bundle = await loadTicketBundle(supabase, auth.farmId, params.id);
    return NextResponse.json({ ...bundle, message: "Reply जतन झाला." });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

