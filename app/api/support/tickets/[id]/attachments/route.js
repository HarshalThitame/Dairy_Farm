import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { badRequest, isUuid } from "@/lib/apiSafety";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  getTicketForFarm,
  loadTicketBundle,
  logSupportAudit,
  SUPPORT_BUCKET,
  validateAttachment
} from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeFileName(name = "attachment") {
  return String(name).replace(/[^\w.\-() ]/g, "_").slice(0, 120) || "attachment";
}

export async function POST(request, { params }) {
  try {
    if (!isUuid(params.id)) {
      throw badRequest("Ticket क्रमांक चुकीचा आहे.");
    }
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const ticket = await getTicketForFarm(supabase, auth.farmId, params.id);

    if (["closed", "rejected"].includes(ticket.status)) {
      return NextResponse.json({ error: "बंद ticket मध्ये attachment जोडता येत नाही." }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const messageId = String(formData.get("messageId") || "").trim() || null;
    const validation = validateAttachment(file);
    if (validation) return NextResponse.json({ error: validation }, { status: 400 });

    const fileName = safeFileName(file.name);
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
    const storagePath = `${auth.farmId}/${params.id}/${Date.now()}-${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(SUPPORT_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("ticket_attachments").insert({
      ticket_id: params.id,
      message_id: messageId,
      farm_id: auth.farmId,
      user_id: auth.userId,
      file_name: fileName,
      file_type: file.type,
      file_size: file.size,
      storage_bucket: SUPPORT_BUCKET,
      storage_path: storagePath
    });
    if (insertError) throw insertError;

    await logSupportAudit(supabase, request, auth, "ticket_attachment_added", {
      ticketNumber: ticket.ticket_number,
      fileName,
      fileSize: file.size
    }, params.id);

    const bundle = await loadTicketBundle(supabase, auth.farmId, params.id);
    return NextResponse.json({ ...bundle, message: "Attachment upload झाली." });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
