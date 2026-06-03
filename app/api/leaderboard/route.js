import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/achievementEngine";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedTypes = ["farm", "milk", "ai_usage", "ocr_usage", "activity", "district"];
const allowedScopes = ["all", "taluka", "district"];

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const type = allowedTypes.includes(searchParams.get("type")) ? searchParams.get("type") : "farm";
    const scope = allowedScopes.includes(searchParams.get("scope")) ? searchParams.get("scope") : "all";
    const supabase = getSupabaseServerClient();
    const result = await getLeaderboard(supabase, auth, type, scope);
    return NextResponse.json(result);
  } catch (error) {
    return farmErrorResponse(error);
  }
}
