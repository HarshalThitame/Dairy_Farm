import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function scoreSecurity(user, sessions = []) {
  let score = 50;
  const suggestions = [];

  if (user?.pin_hash) score += 15;
  else suggestions.push("PIN lock सुरू करा.");

  if (user?.password_hash) score += 20;
  else suggestions.push("मजबूत password जोडा.");

  if ((sessions || []).length <= 2) score += 10;
  else suggestions.push("जुनी sessions तपासा.");

  if (user?.email) score += 5;
  else suggestions.push("Email address जोडा.");

  return {
    score: Math.max(0, Math.min(100, score)),
    suggestions
  };
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const loginQuery = supabase
      .from("user_login_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    const scopedLoginQuery = auth.user.mobile
      ? loginQuery.or(`user_id.eq.${auth.userId},mobile.eq.${auth.user.mobile}`)
      : loginQuery.eq("user_id", auth.userId);
    const [userResult, sessionResult, loginResult] = await Promise.all([
      supabase.from("users").select("id, email, pin_hash, password_hash, last_login").eq("id", auth.userId).single(),
      supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", auth.userId)
        .order("last_active_at", { ascending: false })
        .limit(20),
      scopedLoginQuery
    ]);

    if (userResult.error) throw userResult.error;
    const sessions = sessionResult.error ? [] : sessionResult.data || [];
    const loginHistory = loginResult.error ? [] : loginResult.data || [];
    const security = scoreSecurity(userResult.data, sessions.filter((session) => session.is_active));

    return NextResponse.json({
      security,
      sessions,
      loginHistory,
      hasPassword: Boolean(userResult.data?.password_hash),
      hasPin: Boolean(userResult.data?.pin_hash)
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
