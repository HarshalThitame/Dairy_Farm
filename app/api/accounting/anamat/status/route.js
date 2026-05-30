import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function availableAmount(record) {
  return Math.max(0, Number(record.amount_cut || 0) - Number(record.claimed_amount || 0));
}

function yearsSince(dateString) {
  if (!dateString) {
    return 0;
  }

  const diffMs = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.floor(diffMs / (365 * 24 * 60 * 60 * 1000)));
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data: records, error } = await supabase
      .from("anamat_tracking")
      .select("*, dairy_settlements(id, period_start, period_end, total_milk_income)")
      .eq("farm_id", farmId)
      .order("cut_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const allRecords = records || [];
    const totalAccumulated = allRecords.reduce((sum, record) => sum + Number(record.amount_cut || 0), 0);
    const totalClaimed = allRecords.reduce((sum, record) => sum + Number(record.claimed_amount || 0), 0);
    const totalAvailableToClaim = allRecords.reduce((sum, record) => sum + availableAmount(record), 0);
    const availableRecords = allRecords.filter((record) => availableAmount(record) > 0);
    const oldestCutDate = availableRecords
      .map((record) => record.cut_date)
      .filter(Boolean)
      .sort()[0] || null;
    const accumulatedYears = yearsSince(oldestCutDate);

    return NextResponse.json({
      data: {
        totalAccumulated,
        totalClaimed,
        totalAvailableToClaim,
        recordCount: allRecords.length,
        oldestCutDate,
        yearsAccumulated: accumulatedYears,
        eligibleForFullClaim: accumulatedYears >= 1,
        records: allRecords
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
