import { NextResponse } from "next/server";
import {
  EXPORT_FORMATS,
  EXPORT_RANGE_OPTIONS,
  EXPORT_SECTIONS,
  buildDownloadHeaders,
  buildExportFileName,
  collectFarmExportData,
  createBackupFile,
  getBackupSignedUrl,
  getOrCreateAutoBackupSettings,
  renderExportFile,
  resolveExportDateRange,
  restoreBackup,
  updateAutoBackupSettings,
  validateExportFormat
} from "@/lib/exportBackup";
import { refreshMonthlySummary } from "@/lib/accountingUtils";
import { farmErrorResponse, verifyFarmAccess } from "@/lib/farmGuard";
import { getSupabaseServerClient } from "@/lib/supabase";
import { logUserSettingsAction } from "@/lib/userSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeBackupRow(row = {}) {
  return {
    id: row.id,
    type: row.type,
    format: row.format,
    fileName: row.file_name,
    sizeBytes: Number(row.size_bytes || 0),
    recordsCount: Number(row.records_count || 0),
    sections: row.sections || [],
    dateRange: row.date_range || {},
    metadata: row.metadata || {},
    status: row.status,
    createdAt: row.created_at,
    restoredAt: row.restored_at
  };
}

async function getBackupById(supabase, farmId, backupId) {
  if (!backupId) {
    const missing = new Error("Backup निवडा.");
    missing.status = 400;
    throw missing;
  }
  if (!uuidPattern.test(String(backupId))) {
    const invalid = new Error("Backup record चुकीचा आहे.");
    invalid.status = 400;
    throw invalid;
  }

  const { data, error } = await supabase
    .from("farm_export_backups")
    .select("*")
    .eq("id", backupId)
    .eq("farm_id", farmId)
    .single();

  if (error || !data) {
    const notFound = new Error("Backup सापडला नाही.");
    notFound.status = 404;
    throw notFound;
  }

  return data;
}

function assertBackupFileReady(backup) {
  if (!["ready", "restored"].includes(backup.status)) {
    const error = new Error("हा backup वापरण्यासाठी तयार नाही.");
    error.status = 400;
    throw error;
  }
}

function monthPairsBetween(startDate, endDate) {
  const months = [];
  const start = new Date(`${String(startDate).slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${String(endDate).slice(0, 10)}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return months;
  }

  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const final = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor <= final && months.length < 36) {
    months.push({ month: cursor.getUTCMonth() + 1, year: cursor.getUTCFullYear() });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}

async function refreshSummariesForBackupRange(supabase, farmId, range = {}) {
  const months = monthPairsBetween(range.startDate, range.endDate);
  const refreshed = [];

  for (const item of months) {
    await refreshMonthlySummary(supabase, farmId, item.month, item.year);
    refreshed.push(`${item.year}-${String(item.month).padStart(2, "0")}`);
  }

  return refreshed;
}

export async function GET(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const supabase = getSupabaseServerClient();
    const [backupsResult, autoBackup] = await Promise.all([
      supabase
        .from("farm_export_backups")
        .select("*")
        .eq("farm_id", auth.farmId)
        .order("created_at", { ascending: false })
        .limit(50),
      getOrCreateAutoBackupSettings(supabase, auth.farmId, auth.userId)
    ]);

    if (backupsResult.error) throw backupsResult.error;

    return NextResponse.json({
      sections: EXPORT_SECTIONS,
      formats: EXPORT_FORMATS,
      ranges: EXPORT_RANGE_OPTIONS,
      backups: (backupsResult.data || []).map(normalizeBackupRow),
      autoBackup
    });
  } catch (error) {
    return farmErrorResponse(error);
  }
}

export async function POST(request) {
  try {
    const auth = await verifyFarmAccess(request);
    const body = await request.json().catch(() => ({}));
    const action = body.action || "export";
    const supabase = getSupabaseServerClient();

    if (action === "export") {
      const format = validateExportFormat(body.format || "json");
      const exportData = await collectFarmExportData(supabase, auth.farmId, auth.user, body);
      const buffer = await renderExportFile(exportData, format);
      const fileName = buildExportFileName("majhi-dairy-export", format, exportData.range);

      await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "data_export_downloaded", {
        format,
        sections: exportData.sections,
        range: exportData.range,
        recordsCount: exportData.recordsCount
      });

      return new NextResponse(buffer, {
        status: 200,
        headers: buildDownloadHeaders(fileName, format, buffer.length)
      });
    }

    if (action === "create_backup") {
      const { backup } = await createBackupFile({
        supabase,
        farmId: auth.farmId,
        userId: auth.userId,
        user: auth.user,
        options: body
      });
      const signedUrl = await getBackupSignedUrl(supabase, backup);

      await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "backup_created", {
        backupId: backup.id,
        recordsCount: backup.records_count,
        dateRange: backup.date_range
      });

      return NextResponse.json({
        success: true,
        backup: normalizeBackupRow(backup),
        signedUrl,
        message: "Backup तयार झाला."
      });
    }

    if (action === "download_backup") {
      const backup = await getBackupById(supabase, auth.farmId, body.backupId);
      assertBackupFileReady(backup);
      const signedUrl = await getBackupSignedUrl(supabase, backup);
      return NextResponse.json({
        success: true,
        signedUrl,
        backup: normalizeBackupRow(backup)
      });
    }

    if (action === "restore_backup") {
      const backup = await getBackupById(supabase, auth.farmId, body.backupId);
      const result = await restoreBackup({ supabase, farmId: auth.farmId, backup });
      const refreshedMonths = await refreshSummariesForBackupRange(supabase, auth.farmId, backup.date_range || {});

      await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "backup_restored", {
        backupId: backup.id,
        restoredCount: result.restoredCount,
        restored: result.restored,
        refreshedMonths
      });

      return NextResponse.json({
        success: true,
        ...result,
        refreshedMonths,
        message: "Backup restore झाला."
      });
    }

    if (action === "update_auto_backup") {
      const settings = await updateAutoBackupSettings(supabase, auth.farmId, auth.userId, body.frequency);

      await logUserSettingsAction(supabase, request, auth.userId, auth.farmId, "auto_backup_settings_updated", {
        frequency: settings.frequency,
        enabled: settings.enabled
      });

      return NextResponse.json({
        success: true,
        autoBackup: settings,
        message: "Auto backup सेटिंग्ज जतन झाल्या."
      });
    }

    if (action === "preview_range") {
      return NextResponse.json({
        range: resolveExportDateRange(body)
      });
    }

    return NextResponse.json({ error: "Action चुकीची आहे." }, { status: 400 });
  } catch (error) {
    return farmErrorResponse(error);
  }
}
