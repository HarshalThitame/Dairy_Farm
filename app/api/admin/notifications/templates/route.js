import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";
import { notificationPriorities, notificationTypes } from "@/lib/notificationCenter";
import { badRequest, readJsonBody } from "@/lib/apiSafety";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value) {
  return String(value || "").trim();
}

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notification_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ templates: data || [] });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const body = await readJsonBody(request);
    const name = cleanText(body.name);
    const title = cleanText(body.title);
    const message = cleanText(body.message);

    if (!name || !title || !message) {
      throw badRequest("Template name, title आणि message आवश्यक आहेत.");
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("notification_templates")
      .insert({
        name,
        title,
        message,
        type: notificationTypes.includes(body.type) ? body.type : "information",
        priority: notificationPriorities.includes(body.priority) ? body.priority : "normal",
        action_text: cleanText(body.actionText || body.action_text) || null,
        action_url: cleanText(body.actionUrl || body.action_url) || null,
        image_url: cleanText(body.imageUrl || body.image_url) || null,
        created_by: adminId
      })
      .select("*")
      .single();

    if (error) throw error;

    await logAdminAction(request, adminId, "created_notification_template", null, { templateId: data.id });
    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
