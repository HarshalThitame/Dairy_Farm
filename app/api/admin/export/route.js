import { NextResponse } from "next/server";
import { isUuid } from "@/lib/apiSafety";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logAdminAction, superAdminErrorResponse, toCsv, verifySuperAdmin } from "@/lib/superAdminGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const configs = {
  farms: {
    table: "farms",
    file: "farms.csv",
    select: "id, farm_name, owner_name, owner_mobile, district_name, total_cows, subscription_status, is_active, trial_ends_at, created_at",
    columns: [
      { key: "id", label: "FarmID" },
      { key: "farm_name", label: "FarmName" },
      { key: "owner_name", label: "OwnerName" },
      { key: "owner_mobile", label: "Mobile" },
      { key: "district_name", label: "District" },
      { key: "total_cows", label: "TotalCows" },
      { key: "subscription_status", label: "Status" },
      { key: "is_active", label: "Active" },
      { key: "trial_ends_at", label: "TrialEnds" },
      { key: "created_at", label: "Created" }
    ]
  },
  users: {
    table: "users",
    file: "users.csv",
    select: "id, farm_id, mobile, name, role, is_active, is_farm_owner, last_login, created_at",
    columns: [
      { key: "id", label: "UserID" },
      { key: "farm_id", label: "FarmID" },
      { key: "mobile", label: "Mobile" },
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "is_active", label: "Active" },
      { key: "is_farm_owner", label: "FarmOwner" },
      { key: "last_login", label: "LastLogin" },
      { key: "created_at", label: "Created" }
    ]
  },
  cows: {
    table: "cows",
    file: "cows.csv",
    select: "id, farm_id, name, breed, status, date_of_birth, is_active, created_at",
    columns: [
      { key: "id", label: "CowID" },
      { key: "farm_id", label: "FarmID" },
      { key: "name", label: "CowName" },
      { key: "breed", label: "Breed" },
      { key: "status", label: "Status" },
      { key: "date_of_birth", label: "BirthDate" },
      { key: "is_active", label: "Active" },
      { key: "created_at", label: "Created" }
    ]
  },
  milk: {
    table: "milk_records",
    file: "milk_records.csv",
    select: "id, farm_id, cow_id, date, morning_litres, evening_litres, total_litres, created_at",
    columns: [
      { key: "id", label: "RecordID" },
      { key: "farm_id", label: "FarmID" },
      { key: "cow_id", label: "CowID" },
      { key: "date", label: "Date" },
      { key: "morning_litres", label: "MorningLitres" },
      { key: "evening_litres", label: "EveningLitres" },
      { key: "total_litres", label: "TotalLitres" },
      { key: "created_at", label: "Created" }
    ]
  }
};

export async function GET(request) {
  try {
    const { adminId } = await verifySuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "farms";
    const farmId = searchParams.get("farm_id")?.trim() || "";

    if (!configs[type]) {
      const error = new Error("Invalid export type");
      error.status = 400;
      throw error;
    }

    if (farmId && !isUuid(farmId)) {
      const error = new Error("Invalid farm id");
      error.status = 400;
      throw error;
    }

    const config = configs[type];
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from(config.table)
      .select(config.select)
      .limit(type === "milk" ? 5000 : 2000);

    if (farmId) {
      query = type === "farms" ? query.eq("id", farmId) : query.eq("farm_id", farmId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    await logAdminAction(request, adminId, "exported_data", farmId || null, { type, farmId: farmId || null });
    const csv = toCsv(data || [], config.columns);
    const file = farmId ? config.file.replace(".csv", `-${farmId}.csv`) : config.file;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${file}`
      }
    });
  } catch (error) {
    return superAdminErrorResponse(error);
  }
}
