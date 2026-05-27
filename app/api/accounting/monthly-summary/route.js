import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import {
  buildProfitTrend,
  generateMonthlyReport,
  refreshMonthlySummary
} from "@/lib/accountingUtils";
import { getMonthInput } from "@/lib/reportUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function parseBodyMonth(body) {
  const month = Number(body.month);
  const year = Number(body.year);

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return null;
  }

  return { month, year };
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const { searchParams } = new URL(request.url);
    const monthInput = getMonthInput(searchParams);

    if (!monthInput) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const summary = await refreshMonthlySummary(supabase, farmId, monthInput.month, monthInput.year);
    const [report, trend] = await Promise.all([
      generateMonthlyReport(supabase, farmId, monthInput.month, monthInput.year),
      buildProfitTrend(supabase, farmId, monthInput.month, monthInput.year)
    ]);

    return NextResponse.json({
      data: {
        summary,
        report,
        trend
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const body = await request.json();
    const monthInput = parseBodyMonth(body);

    if (!monthInput) {
      return NextResponse.json({ error: "महिना किंवा वर्ष चुकीचे आहे." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const summary = await refreshMonthlySummary(supabase, farmId, monthInput.month, monthInput.year);

    return NextResponse.json({ data: { summary } });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
