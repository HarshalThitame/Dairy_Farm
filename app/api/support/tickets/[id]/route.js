import { NextResponse } from "next/server";
import { badRequest, isUuid } from "@/lib/apiSafety";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  createSupportNotification,
  loadTicketBundle,
  logSupportAudit
} from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Ticket क्रमांक चुकीचा आहे.");
    }
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const bundle = await loadTicketBundle(supabase, auth.farmId, params.id);
    return NextResponse.json(bundle);
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Ticket क्रमांक चुकीचा आहे.");
    }
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (!["close", "reopen", "rate"].includes(action)) {
      return NextResponse.json({ error: "Action चुकीची आहे." }, { status: 400 });
    }

    const current = await loadTicketBundle(supabase, auth.farmId, params.id);

    if (action === "close") {
      if (["closed", "resolved"].includes(current.ticket.status)) {
        return NextResponse.json({ error: "हे ticket आधीच बंद/सोडवले आहे." }, { status: 400 });
      }

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "closed", closed_at: now })
        .eq("id", params.id)
        .eq("farm_id", auth.farmId);
      if (error) throw error;

      await supabase.from("ticket_messages").insert({
        ticket_id: params.id,
        farm_id: auth.farmId,
        user_id: auth.userId,
        sender_type: "system",
        message: "User ने ticket बंद केले."
      });

      await logSupportAudit(supabase, request, auth, "ticket_closed", {}, params.id);
      await createSupportNotification(supabase, auth, {
        title: "Support ticket बंद झाले",
        message: `${current.ticket.ticketNumber} ticket बंद झाले आहे.`,
        url: `/support/tickets/${params.id}`
      });
    }

    if (action === "reopen") {
      if (!["closed", "resolved", "rejected"].includes(current.ticket.status)) {
        return NextResponse.json({ error: "फक्त बंद/सोडवलेले ticket पुन्हा सुरू करता येते." }, { status: 400 });
      }

      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "open", closed_at: null, resolved_at: null })
        .eq("id", params.id)
        .eq("farm_id", auth.farmId);
      if (error) throw error;

      await supabase.from("ticket_messages").insert({
        ticket_id: params.id,
        farm_id: auth.farmId,
        user_id: auth.userId,
        sender_type: "user",
        message: String(body.message || "Ticket पुन्हा सुरू करा.").slice(0, 1000)
      });

      await logSupportAudit(supabase, request, auth, "ticket_reopened", {}, params.id);
    }

    if (action === "rate") {
      const rating = Number(body.rating || 0);
      const feedback = String(body.feedback || "").trim().slice(0, 1200) || null;
      if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating १ ते ५ मध्ये असावी." }, { status: 400 });
      }
      if (!["resolved", "closed"].includes(current.ticket.status)) {
        return NextResponse.json({ error: "Ticket बंद/सोडवले झाल्यावरच rating देता येते." }, { status: 400 });
      }

      const { error } = await supabase
        .from("support_ratings")
        .upsert({
          ticket_id: params.id,
          farm_id: auth.farmId,
          user_id: auth.userId,
          rating,
          feedback
        }, { onConflict: "ticket_id" });
      if (error) throw error;

      await logSupportAudit(supabase, request, auth, "ticket_rated", { rating }, params.id);
    }

    const bundle = await loadTicketBundle(supabase, auth.farmId, params.id);
    return NextResponse.json({
      ...bundle,
      message: action === "rate" ? "Rating जतन झाले." : "Ticket update झाले."
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
