import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getTodayISODate } from "@/lib/reminderUtils";
import { getMissingSettlementSlipPeriods } from "@/lib/settlementReminderUtils";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function groupByMonth(periods) {
  const groups = new Map();

  (periods || []).forEach((period) => {
    const key = period.month_key;
    const existing = groups.get(key) || {
      month_key: key,
      month_label: period.month_label,
      count: 0,
      periods: []
    };

    existing.count += 1;
    existing.periods.push(period);
    groups.set(key, existing);
  });

  return Array.from(groups.values()).sort((first, second) =>
    String(first.month_key || "").localeCompare(String(second.month_key || ""))
  );
}

export async function GET(request) {
  try {
    const { farmId } = await verifyFarmAccess(request);
    const today = getTodayISODate();
    const supabase = getSupabaseServerClient();
    const periods = await getMissingSettlementSlipPeriods(supabase, farmId, { today });

    return NextResponse.json({
      data: {
        pendingCount: periods.length,
        dueTodayCount: periods.filter((period) => period.due_date === today).length,
        overdueCount: periods.filter((period) => period.due_date < today).length,
        periods,
        months: groupByMonth(periods),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
