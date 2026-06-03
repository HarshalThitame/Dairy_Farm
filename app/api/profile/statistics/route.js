import { NextResponse } from "next/server";
import { farmErrorResponse, normalizeFarm, verifyFarmAccess } from "@/lib/farmGuard";
import { buildProfileStatistics, buildStatisticsPdf } from "@/lib/profileStatistics";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getFarm(supabase, farmId) {
  const { data, error } = await supabase
    .from("farms")
    .select("*")
    .eq("id", farmId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const [stats, farm] = await Promise.all([
      buildProfileStatistics(supabase, auth.farmId, auth.userId),
      getFarm(supabase, auth.farmId)
    ]);

    return NextResponse.json({
      user: auth.user,
      farm: normalizeFarm(farm),
      stats
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const action = body.action || "pdf";

    if (action !== "pdf") {
      return NextResponse.json({ error: "Action चुकीची आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const [stats, farm] = await Promise.all([
      buildProfileStatistics(supabase, auth.farmId, auth.userId),
      getFarm(supabase, auth.farmId)
    ]);
    const pdf = await buildStatisticsPdf(stats, auth.user, normalizeFarm(farm));

    await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "statistics_pdf_downloaded", {
      totalMilk: stats.overview.totalMilk,
      healthScore: stats.farmHealthScore.score
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="majhi-dairy-statistics-${stats.today}.pdf"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
