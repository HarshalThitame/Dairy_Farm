import { NextResponse } from "next/server";
import {
  getOrCreateAiAssistantPreferences,
  normalizeAiAssistantPreferences,
  sanitizeAiAssistantPreferences
} from "@/lib/aiAssistantSettings";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function monthStartISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function topicFromQuestion(question = "") {
  const text = String(question || "").toLowerCase();
  if (/फॅट|fat|snf|एसएनएफ|quality/.test(text)) return "दूध गुणवत्ता";
  if (/उत्पन्न|income|revenue|नफा|profit|खर्च|expense/.test(text)) return "हिशोब";
  if (/सकाळ|संध्याकाळ|दूध|लिटर|milk/.test(text)) return "दूध";
  if (/अहवाल|सारांश|trend|ट्रेंड/.test(text)) return "अहवाल";
  return "सामान्य";
}

async function getUsageStats(supabase, farmId, userId) {
  const monthStart = monthStartISO();
  const { data, error } = await supabase
    .from("ai_assistant_logs")
    .select("question, execution_ms, created_at")
    .eq("farm_id", farmId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return {
      totalQuestions: 0,
      questionsThisMonth: 0,
      mostAskedTopic: "माहिती नाही",
      averageResponseTime: 0
    };
  }

  const rows = data || [];
  const topicCounts = rows.reduce((map, row) => {
    const topic = topicFromQuestion(row.question);
    map.set(topic, (map.get(topic) || 0) + 1);
    return map;
  }, new Map());
  const mostAskedTopic = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "माहिती नाही";
  const executionValues = rows.map((row) => Number(row.execution_ms || 0)).filter((value) => value > 0);

  return {
    totalQuestions: rows.length,
    questionsThisMonth: rows.filter((row) => String(row.created_at || "") >= monthStart).length,
    mostAskedTopic,
    averageResponseTime: executionValues.length
      ? Math.round(executionValues.reduce((sum, value) => sum + value, 0) / executionValues.length)
      : 0
  };
}

async function getRecentHistory(supabase, farmId, userId) {
  const { data, error } = await supabase
    .from("ai_assistant_logs")
    .select("id, question, response, execution_ms, feedback, feedback_at, created_at")
    .eq("farm_id", farmId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return data || [];
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const [preferences, stats, history] = await Promise.all([
      getOrCreateAiAssistantPreferences(supabase, auth.userId, auth.farmId),
      getUsageStats(supabase, auth.farmId, auth.userId),
      getRecentHistory(supabase, auth.farmId, auth.userId)
    ]);

    return NextResponse.json({
      preferences: normalizeAiAssistantPreferences(preferences),
      stats,
      history
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json();
    const supabase = getSupabaseServerClient();
    const current = await getOrCreateAiAssistantPreferences(supabase, auth.userId, auth.farmId);
    const next = sanitizeAiAssistantPreferences(body, current);

    const { data, error } = await supabase
      .from("ai_assistant_preferences")
      .upsert({
        user_id: auth.userId,
        farm_id: auth.farmId,
        ...next,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) throw error;

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "ai_settings_updated", next);

    return NextResponse.json({
      preferences: normalizeAiAssistantPreferences(data),
      message: "AI सेटिंग्ज जतन झाल्या."
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
