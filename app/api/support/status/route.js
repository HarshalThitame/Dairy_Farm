import { NextResponse } from "next/server";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function latestByService(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.service_name)) {
      map.set(row.service_name, row);
    }
  });
  return Array.from(map.values());
}

export async function GET(request) {
  try {
    await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("system_status_logs")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    const rows = data || [];
    const latest = latestByService(rows);
    const incidents = rows.filter((row) => ["degraded", "down", "maintenance"].includes(row.status)).slice(0, 10);
    const allOperational = latest.every((row) => row.status === "operational");

    return NextResponse.json({
      overallStatus: allOperational ? "operational" : "attention_needed",
      services: latest,
      incidents
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

