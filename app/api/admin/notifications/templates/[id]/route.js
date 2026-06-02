import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { notificationPriorities, notificationTypes } from "@/lib/notificationCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value) {
  return String(value || "").trim();
}

function templatePayload(body = {}) {
  const name = cleanText(body.name);
  const title = cleanText(body.title);
  const message = cleanText(body.message);

  if (!name || !title || !message) {
    throw new Error("Template name, title, and message are required.");
  }

  return {
    name,
    title,
    message,
    type: notificationTypes.includes(body.type) ? body.type : "information",
    priority: notificationPriorities.includes(body.priority) ? body.priority : "normal",
    action_text: cleanText(body.actionText || body.action_text) || null,
    action_url: cleanText(body.actionUrl || body.action_url) || null,
    image_url: cleanText(body.imageUrl || body.image_url) || null,
    is_active: body.isActive === false || body.is_active === false ? false : true
  };
}

export async function PUT(request, { params }) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await request.json();
    const payload = templatePayload(body);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notification_templates")
      .update(payload)
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) throw error;

    await logAdminAction(request, adminId, "edited_notification_template", null, { templateId: params.id });
    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notification_templates")
      .update({ is_active: false })
      .eq("id", params.id)
      .select("id")
      .single();

    if (error) throw error;

    await logAdminAction(request, adminId, "deleted_notification_template", null, { templateId: data.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
