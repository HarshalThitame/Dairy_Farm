import { NextResponse } from "next/server";
import { badRequest, isUuid } from "@/lib/apiSafety";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  logSupportAudit,
  normalizeFeature,
  sanitizeFeaturePayload,
  validateFeaturePayload
} from "@/lib/supportCenter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadFeatures(supabase, auth) {
  const [featuresResult, votesResult] = await Promise.all([
    supabase
      .from("feature_requests")
      .select("*")
      .eq("farm_id", auth.farmId)
      .order("votes_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("feature_votes")
      .select("feature_request_id")
      .eq("farm_id", auth.farmId)
      .eq("user_id", auth.userId)
  ]);

  if (featuresResult.error) throw featuresResult.error;
  if (votesResult.error) throw votesResult.error;

  const votedIds = new Set((votesResult.data || []).map((row) => row.feature_request_id));
  return (featuresResult.data || []).map((row) => normalizeFeature(row, votedIds));
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const features = await loadFeatures(supabase, auth);
    return NextResponse.json({ features });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const payload = sanitizeFeaturePayload(body);
    const validationError = validateFeaturePayload(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("feature_requests")
      .insert({
        farm_id: auth.farmId,
        user_id: auth.userId,
        ...payload
      })
      .select("*")
      .single();
    if (error) throw error;

    await logSupportAudit(supabase, request, auth, "feature_request_submitted", { title: data.title });
    return NextResponse.json({
      feature: normalizeFeature(data, new Set()),
      message: "Feature request जतन झाली."
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function PATCH(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const featureId = body.featureId;
    const action = body.action;
    if (!featureId || !["vote", "unvote"].includes(action)) {
      return NextResponse.json({ error: "Action चुकीची आहे." }, { status: 400 });
    }
    if (!isUuid(featureId)) {
      throw badRequest("Feature request क्रमांक चुकीचा आहे.");
    }

    const supabase = getSupabaseServerClient();
    const { data: feature, error: featureError } = await supabase
      .from("feature_requests")
      .select("id")
      .eq("id", featureId)
      .eq("farm_id", auth.farmId)
      .single();
    if (featureError || !feature) {
      return NextResponse.json({ error: "Feature request सापडली नाही." }, { status: 404 });
    }

    if (action === "vote") {
      const { error } = await supabase
        .from("feature_votes")
        .upsert({
          feature_request_id: featureId,
          farm_id: auth.farmId,
          user_id: auth.userId
        }, { onConflict: "feature_request_id,user_id" });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("feature_votes")
        .delete()
        .eq("feature_request_id", featureId)
        .eq("farm_id", auth.farmId)
        .eq("user_id", auth.userId);
      if (error) throw error;
    }

    await logSupportAudit(supabase, request, auth, `feature_${action}`, { featureId });
    const features = await loadFeatures(supabase, auth);
    return NextResponse.json({ features, message: action === "vote" ? "Vote जतन झाला." : "Vote काढला." });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
