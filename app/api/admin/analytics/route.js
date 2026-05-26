import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { superAdminErrorResponse, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - 1 - index));
    return monthKey(date);
  });
}

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const supabase = getSupabaseServerClient();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [farmsResult, usersResult, milkResult] = await Promise.all([
      supabase.from("farms").select("id, farm_name, district_name, total_cows, subscription_status, is_active, created_at, last_activity_at"),
      supabase.from("users").select("id, farm_id, last_login"),
      supabase.from("milk_records").select("farm_id, date").gte("date", sevenDaysAgo)
    ]);

    if (farmsResult.error) throw farmsResult.error;
    if (usersResult.error) throw usersResult.error;
    if (milkResult.error) throw milkResult.error;

    const farms = farmsResult.data || [];
    const users = usersResult.data || [];
    const milk = milkResult.data || [];
    const activeMilkFarmIds = new Set(milk.map((record) => record.farm_id));
    const months = lastMonths(12);
    const growth = months.map((key) => ({
      label: key,
      signups: farms.filter((farm) => monthKey(new Date(farm.created_at)) === key).length,
      active: farms.filter((farm) => farm.is_active).length
    }));

    const statusDistribution = [
      { name: "Active", value: farms.filter((farm) => farm.is_active && farm.subscription_status === "active").length },
      { name: "Trial", value: farms.filter((farm) => farm.subscription_status === "trial").length },
      { name: "Expired", value: farms.filter((farm) => farm.subscription_status === "expired").length },
      { name: "Suspended", value: farms.filter((farm) => !farm.is_active).length }
    ];

    const districtMap = new Map();
    farms.forEach((farm) => {
      const district = farm.district_name || "Unknown";
      districtMap.set(district, (districtMap.get(district) || 0) + 1);
    });

    const herdSizes = [
      { name: "0-10", value: farms.filter((farm) => Number(farm.total_cows || 0) <= 10).length },
      { name: "11-30", value: farms.filter((farm) => Number(farm.total_cows || 0) >= 11 && Number(farm.total_cows || 0) <= 30).length },
      { name: "31-50", value: farms.filter((farm) => Number(farm.total_cows || 0) >= 31 && Number(farm.total_cows || 0) <= 50).length },
      { name: "50+", value: farms.filter((farm) => Number(farm.total_cows || 0) > 50).length }
    ];

    return NextResponse.json({
      growth,
      statusDistribution,
      districtDistribution: Array.from(districtMap.entries())
        .map(([district, value]) => ({ district, farms: value }))
        .sort((a, b) => b.farms - a.farms),
      engagement: {
        averageUsersPerFarm: farms.length ? users.length / farms.length : 0,
        farmsWithMilkThisWeek: activeMilkFarmIds.size,
        inactiveFarms: farms.filter((farm) => !farm.last_activity_at || farm.last_activity_at < fourteenDaysAgo).length
      },
      livestock: {
        totalCows: farms.reduce((sum, farm) => sum + Number(farm.total_cows || 0), 0),
        averageCowsPerFarm: farms.length ? farms.reduce((sum, farm) => sum + Number(farm.total_cows || 0), 0) / farms.length : 0,
        herdSizes
      },
      dataQuality: {
        incompleteProfiles: farms.filter((farm) => !farm.district_name || !farm.total_cows).length,
        noCowsAdded: farms.filter((farm) => Number(farm.total_cows || 0) === 0).length,
        noMilkInSevenDays: farms.filter((farm) => !activeMilkFarmIds.has(farm.id)).length
      },
      mostActiveFarms: farms
        .filter((farm) => farm.last_activity_at)
        .sort((a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at))
        .slice(0, 10),
      leastActiveFarms: farms
        .slice()
        .sort((a, b) => new Date(a.last_activity_at || 0) - new Date(b.last_activity_at || 0))
        .slice(0, 10)
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
