import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { maskMobile, superAdminErrorResponse, toCsv, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sortMap = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  most_cows: { column: "total_cows", ascending: false },
  least_active: { column: "last_activity_at", ascending: true },
  last_activity: { column: "last_activity_at", ascending: false }
};

function applyFilters(query, params) {
  const status = params.get("status") || "all";
  const district = params.get("district") || "";
  const search = params.get("search") || "";

  if (status && status !== "all") {
    if (status === "suspended") {
      query = query.eq("is_active", false);
    } else {
      query = query.eq("is_active", true).eq("subscription_status", status);
    }
  }

  if (district && district !== "all") {
    query = query.eq("district_name", district);
  }

  if (search.trim()) {
    const value = search.trim().replace(/[%,()]/g, "");
    if (value) {
      query = query.or(`farm_name.ilike.%${value}%,owner_name.ilike.%${value}%,owner_mobile.ilike.%${value}%`);
    }
  }

  return query;
}

export async function GET(request) {
  try {
    await verifySuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const exportCsv = searchParams.get("export") === "csv";
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 50;
    const sort = sortMap[searchParams.get("sortBy") || "newest"] || sortMap.newest;
    const supabase = getSupabaseServerClient();

    let query = supabase.from("farms").select("*", { count: "exact" });
    query = applyFilters(query, searchParams);
    query = query.order(sort.column, { ascending: sort.ascending, nullsFirst: false });

    if (!exportCsv) {
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      throw error;
    }

    const farms = (data || []).map((farm) => ({
      ...farm,
      owner_mobile_masked: maskMobile(farm.owner_mobile)
    }));

    if (exportCsv) {
      const csv = toCsv(farms, [
        { key: "id", label: "FarmID" },
        { key: "farm_name", label: "FarmName" },
        { key: "owner_name", label: "OwnerName" },
        { key: "owner_mobile", label: "Mobile" },
        { key: "district_name", label: "District" },
        { key: "total_cows", label: "TotalCows" },
        { key: "subscription_status", label: "Status" },
        { key: "trial_ends_at", label: "TrialEnds" },
        { key: "created_at", label: "Created" }
      ]);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=farms.csv"
        }
      });
    }

    return NextResponse.json({
      farms,
      total: count || 0,
      page,
      pages: Math.max(1, Math.ceil((count || 0) / limit))
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
