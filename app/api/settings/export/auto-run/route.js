import { NextResponse } from "next/server";
import { createBackupFile } from "@/lib/exportBackup";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cronAuthorized(request) {
  const configured = process.env.CRON_SECRET || process.env.EXPORT_BACKUP_CRON_SECRET;
  if (!configured) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : request.headers.get("x-cron-secret");

  return token === configured;
}

function rangeForFrequency(frequency) {
  if (frequency === "daily") return "today";
  if (frequency === "weekly") return "this_week";
  return "this_month";
}

export async function POST(request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "अनुमती नाही." }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { data: dueSettings, error } = await supabase
    .from("farm_auto_backup_settings")
    .select("farm_id, user_id, frequency, next_backup_at")
    .eq("enabled", true)
    .neq("frequency", "off")
    .lte("next_backup_at", now)
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const setting of dueSettings || []) {
    try {
      const { data: user } = setting.user_id
        ? await supabase
            .from("users")
            .select("id, name, role")
            .eq("id", setting.user_id)
            .maybeSingle()
        : { data: null };

      const { backup } = await createBackupFile({
        supabase,
        farmId: setting.farm_id,
        userId: setting.user_id,
        user,
        options: {
          rangeType: rangeForFrequency(setting.frequency)
        }
      });

      results.push({
        farmId: setting.farm_id,
        backupId: backup.id,
        status: "created",
        recordsCount: backup.records_count
      });
    } catch (backupError) {
      results.push({
        farmId: setting.farm_id,
        status: "failed",
        error: backupError.message
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    results
  });
}
