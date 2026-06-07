import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValidPushEndpoint(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function cleanPushKey(value) {
  const text = String(value || "").trim();
  return text.length >= 16 && text.length <= 4096 ? text : "";
}

export async function POST(request) {
  try {
    const { userId, farmId } = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const safeBody = body && typeof body === "object" && !Array.isArray(body) ? body : {};
    const subscription = safeBody.subscription || safeBody;
    const endpoint = String(subscription?.endpoint || "").trim();
    const keys = subscription?.keys || {};
    const p256dh = cleanPushKey(keys.p256dh);
    const auth = cleanPushKey(keys.auth);

    if (!isValidPushEndpoint(endpoint) || !p256dh || !auth) {
      return NextResponse.json({ error: "Push subscription अपूर्ण आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_push_subscriptions")
      .upsert({
        user_id: userId,
        farm_id: farmId,
        endpoint,
        p256dh,
        auth,
        user_agent: request.headers.get("user-agent") || "",
        is_active: true,
        last_seen_at: new Date().toISOString()
      }, { onConflict: "endpoint" })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
