import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import {
  getAverageFat,
  getAverageSNF,
  getExpenses,
  getProfit,
  getRevenue,
  getTotalMilk
} from "@/lib/aiAssistantTools";

export const EXPORT_SECTIONS = [
  { id: "milk_records", label: "दूध नोंदी" },
  { id: "slip_history", label: "स्लिप इतिहास" },
  { id: "ai_history", label: "AI इतिहास" },
  { id: "animal_records", label: "जनावरांची माहिती" },
  { id: "expenses", label: "खर्च" },
  { id: "income", label: "उत्पन्न" },
  { id: "reports", label: "अहवाल" }
];

export const EXPORT_FORMATS = [
  { id: "pdf", label: "PDF" },
  { id: "xlsx", label: "Excel" },
  { id: "csv", label: "CSV" },
  { id: "json", label: "JSON" }
];

export const EXPORT_RANGE_OPTIONS = [
  { id: "today", label: "आज" },
  { id: "this_week", label: "हा आठवडा" },
  { id: "this_month", label: "हा महिना" },
  { id: "custom", label: "स्वतःचा कालावधी" }
];

const BACKUP_BUCKET = "farm-backups";
const DEFAULT_SECTIONS = EXPORT_SECTIONS.map((section) => section.id);
const RESTORE_TABLES = new Set([
  "cows",
  "calves",
  "milk_records",
  "dairy_slips",
  "dairy_settlements",
  "slip_uploads",
  "ai_assistant_logs",
  "ai_records",
  "calving_records",
  "health_records",
  "finance_records",
  "monthly_expenses",
  "feed_expenses"
]);

const GENERATED_COLUMNS = {
  milk_records: ["total_litres", "total_amount"],
  dairy_slips: ["total_amount"],
  dairy_settlements: ["total_deductions", "net_payable"],
  monthly_summary: ["total_all_expenses", "net_profit"]
};

const SECTION_TABLES = {
  milk_records: [
    { table: "milk_records", label: "दूध नोंदी", dateColumn: "date" }
  ],
  slip_history: [
    { table: "dairy_slips", label: "दूध स्लिप", dateColumn: "slip_date" },
    { table: "dairy_settlements", label: "15 दिवसांचे देयक", dateColumn: "period_end" },
    { table: "slip_uploads", label: "स्लिप अपलोड", dateColumn: "created_at", timestamp: true }
  ],
  ai_history: [
    { table: "ai_assistant_logs", label: "दुग्धमित्र AI प्रश्न", dateColumn: "created_at", timestamp: true }
  ],
  animal_records: [
    { table: "cows", label: "गायी", dateColumn: "created_at", timestamp: true },
    { table: "calves", label: "वासरे", dateColumn: "birth_date" },
    { table: "ai_records", label: "रेतन नोंदी", dateColumn: "ai_date" },
    { table: "calving_records", label: "व्यायण नोंदी", dateColumn: "created_at", timestamp: true },
    { table: "health_records", label: "आरोग्य नोंदी", dateColumn: "date" }
  ],
  expenses: [
    { table: "monthly_expenses", label: "मासिक खर्च", dateColumn: "expense_date" },
    { table: "finance_records", label: "खर्च नोंदी", dateColumn: "date", eq: { type: "खर्च" } },
    { table: "feed_expenses", label: "चारा खर्च", dateColumn: "date" },
    { table: "health_records", label: "औषध/आरोग्य खर्च", dateColumn: "date", gt: { cost: 0 } },
    { table: "ai_records", label: "रेतन खर्च", dateColumn: "ai_date", gt: { cost: 0 } }
  ],
  income: [
    { table: "finance_records", label: "उत्पन्न नोंदी", dateColumn: "date", eq: { type: "उत्पन्न" } },
    { table: "dairy_settlements", label: "दूध उत्पन्न", dateColumn: "period_end" }
  ]
};

function numberOrZero(value) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function indiaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day)
  };
}

function isoFromParts(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function monthEnd(year, month) {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

function userInputError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isValidISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function resolveExportDateRange(input = {}) {
  const type = input.rangeType || input.range || "this_month";
  const todayParts = indiaDateParts();
  const today = isoFromParts(todayParts.year, todayParts.month, todayParts.day);

  if (type === "today") {
    return { type, startDate: today, endDate: today };
  }

  if (type === "this_week") {
    const todayDate = new Date(`${today}T00:00:00Z`);
    const day = todayDate.getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    const startDate = addDays(today, offset);
    return { type, startDate, endDate: today };
  }

  if (type === "custom") {
    const startDate = String(input.startDate || "").slice(0, 10);
    const endDate = String(input.endDate || "").slice(0, 10);

    if (!isValidISODate(startDate) || !isValidISODate(endDate)) {
      throw userInputError("Custom कालावधीसाठी सुरू आणि शेवट तारीख योग्य निवडा.");
    }

    if (endDate < startDate) {
      throw userInputError("शेवट तारीख सुरू तारखेपेक्षा आधी नसावी.");
    }

    return { type, startDate, endDate };
  }

  return {
    type: "this_month",
    startDate: isoFromParts(todayParts.year, todayParts.month, 1),
    endDate: monthEnd(todayParts.year, todayParts.month)
  };
}

export function normalizeExportSections(sections = []) {
  const requested = Array.isArray(sections) && sections.length ? sections : DEFAULT_SECTIONS;
  const allowed = new Set(DEFAULT_SECTIONS);
  return requested.map((section) => String(section)).filter((section) => allowed.has(section));
}

function normalizeFormat(format = "json") {
  const next = String(format || "json").toLowerCase();
  return EXPORT_FORMATS.some((item) => item.id === next) ? next : "json";
}

export function validateExportFormat(format = "json") {
  const next = String(format || "json").toLowerCase();
  if (!EXPORT_FORMATS.some((item) => item.id === next)) {
    throw userInputError("Export format चुकीचा आहे.");
  }
  return next;
}

function contentTypeForFormat(format) {
  if (format === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (format === "pdf") return "application/pdf";
  if (format === "csv") return "text/csv";
  return "application/json";
}

function extensionForFormat(format) {
  return format === "xlsx" ? "xlsx" : format;
}

function endForQuery(range, timestamp = false) {
  return timestamp ? `${range.endDate}T23:59:59.999+05:30` : range.endDate;
}

function startForQuery(range, timestamp = false) {
  return timestamp ? `${range.startDate}T00:00:00.000+05:30` : range.startDate;
}

async function fetchConfiguredTable(supabase, farmId, config, range) {
  let query = supabase.from(config.table).select("*").eq("farm_id", farmId);

  if (config.dateColumn) {
    query = query
      .gte(config.dateColumn, startForQuery(range, config.timestamp))
      .lte(config.dateColumn, endForQuery(range, config.timestamp));
  }

  Object.entries(config.eq || {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  Object.entries(config.gt || {}).forEach(([key, value]) => {
    query = query.gt(key, value);
  });

  const { data, error } = await query.limit(10000);

  if (error) {
    if (["42P01", "42703"].includes(error.code)) {
      return {
        table: config.table,
        label: config.label,
        rows: [],
        warning: `${config.label} उपलब्ध नाही: ${error.message}`
      };
    }
    throw error;
  }

  return {
    table: config.table,
    label: config.label,
    rows: data || []
  };
}

async function buildReportDataset(supabase, farmId, range) {
  const args = { startDate: range.startDate, endDate: range.endDate };
  const [milk, revenue, expenses, profit, fat, snf] = await Promise.all([
    getTotalMilk({ supabase, farmId, args }),
    getRevenue({ supabase, farmId, args }),
    getExpenses({ supabase, farmId, args }),
    getProfit({ supabase, farmId, args }),
    getAverageFat({ supabase, farmId, args }),
    getAverageSNF({ supabase, farmId, args })
  ]);

  return {
    table: "reports",
    label: "अहवाल सारांश",
    rows: [
      {
        start_date: range.startDate,
        end_date: range.endDate,
        total_milk_liters: milk.totalMilk || 0,
        revenue: revenue.revenue || 0,
        total_expense: expenses.totalExpense || 0,
        net_profit: profit.netProfit || 0,
        average_fat: fat.averageFat || null,
        average_snf: snf.averageSNF || null,
        source: [milk.source, profit.source].filter(Boolean).join(", ")
      }
    ]
  };
}

export async function collectFarmExportData(supabase, farmId, user, options = {}) {
  const sections = normalizeExportSections(options.sections);
  const range = resolveExportDateRange(options);
  const datasets = [];
  const warnings = [];

  if (!sections.length) {
    throw userInputError("किमान एक विभाग निवडा.");
  }

  for (const section of sections) {
    if (section === "reports") {
      datasets.push({
        section,
        ...(await buildReportDataset(supabase, farmId, range))
      });
      continue;
    }

    const configs = SECTION_TABLES[section] || [];
    for (const config of configs) {
      const dataset = await fetchConfiguredTable(supabase, farmId, config, range);
      if (dataset.warning) warnings.push(dataset.warning);
      datasets.push({ section, ...dataset });
    }
  }

  const recordsCount = datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
  return {
    app: "माझी डेअरी",
    version: 1,
    generatedAt: new Date().toISOString(),
    farmId,
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    sections,
    range,
    recordsCount,
    warnings,
    datasets
  };
}

function flattenValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeCsv(value) {
  const text = flattenValue(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function datasetToCsvRows(dataset) {
  const keys = Array.from(new Set(dataset.rows.flatMap((row) => Object.keys(row || {}))));
  const header = ["section", "table", ...keys];
  const rows = dataset.rows.length
    ? dataset.rows.map((row) => [dataset.section, dataset.table, ...keys.map((key) => row?.[key])])
    : [[dataset.section, dataset.table, ...keys.map(() => "")]];
  return [header, ...rows];
}

export function exportDataToCsv(data) {
  const lines = [
    ["app", data.app],
    ["generated_at", data.generatedAt],
    ["date_range", `${data.range.startDate} ते ${data.range.endDate}`],
    ["records_count", data.recordsCount],
    []
  ];

  data.datasets.forEach((dataset) => {
    lines.push([dataset.label || dataset.table]);
    lines.push(...datasetToCsvRows(dataset));
    lines.push([]);
  });

  return Buffer.from(`\ufeff${lines.map((row) => row.map(escapeCsv).join(",")).join("\n")}`, "utf8");
}

function safeSheetName(name, index) {
  return String(name || `Sheet ${index + 1}`)
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 28)
    .trim() || `Sheet ${index + 1}`;
}

export function exportDataToXlsx(data) {
  const workbook = XLSX.utils.book_new();
  const summary = [
    { field: "App", value: data.app },
    { field: "Generated At", value: data.generatedAt },
    { field: "Start Date", value: data.range.startDate },
    { field: "End Date", value: data.range.endDate },
    { field: "Records Count", value: data.recordsCount },
    { field: "Warnings", value: data.warnings.join(" | ") }
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Summary");

  data.datasets.forEach((dataset, index) => {
    const sheetRows = dataset.rows.length ? dataset.rows : [{ message: "या विभागात नोंदी नाहीत." }];
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(sheetRows),
      safeSheetName(`${dataset.label || dataset.table}`, index)
    );
  });

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function fontPath() {
  const candidates = [
    path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Regular.ttf"),
    "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"
  ];
  const selected = candidates.find((candidate) => fs.existsSync(candidate));

  if (!selected) {
    throw userInputError("PDF साठी Marathi font सापडला नाही.");
  }

  return selected;
}

export function exportDataToPdf(data) {
  return new Promise((resolve, reject) => {
    const devanagariFont = fontPath();
    const document = new PDFDocument({
      size: "A4",
      margin: 42,
      bufferPages: true,
      autoFirstPage: false,
      font: devanagariFont
    });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.registerFont("NotoSansDevanagari", devanagariFont);
    document.addPage();
    document.font("NotoSansDevanagari");

    document.fontSize(20).text("माझी डेअरी - Export Report", { align: "center" });
    document.moveDown(0.8);
    document.fontSize(11).text(`तारीख: ${data.generatedAt}`);
    document.text(`कालावधी: ${data.range.startDate} ते ${data.range.endDate}`);
    document.text(`एकूण नोंदी: ${data.recordsCount}`);
    document.moveDown();

    if (data.warnings.length) {
      document.fontSize(12).text("सूचना:", { underline: true });
      data.warnings.forEach((warning) => document.fontSize(10).text(`- ${warning}`));
      document.moveDown();
    }

    data.datasets.forEach((dataset) => {
      if (document.y > 700) document.addPage();
      document.fontSize(14).text(`${dataset.label || dataset.table} (${dataset.rows.length})`, { underline: true });
      document.moveDown(0.3);
      const rows = dataset.rows.slice(0, 25);
      if (!rows.length) {
        document.fontSize(10).text("या विभागात नोंदी नाहीत.");
      } else {
        rows.forEach((row, index) => {
          const preview = Object.entries(row || {})
            .slice(0, 8)
            .map(([key, value]) => `${key}: ${flattenValue(value)}`)
            .join(" | ");
          document.fontSize(8).text(`${index + 1}. ${preview}`, { lineGap: 1 });
          if (document.y > 740) document.addPage();
        });
        if (dataset.rows.length > rows.length) {
          document.fontSize(9).text(`... अजून ${dataset.rows.length - rows.length} नोंदी Excel/JSON मध्ये उपलब्ध आहेत.`);
        }
      }
      document.moveDown();
    });

    document.end();
  });
}

export async function renderExportFile(data, format) {
  const normalizedFormat = normalizeFormat(format);
  if (normalizedFormat === "xlsx") return exportDataToXlsx(data);
  if (normalizedFormat === "pdf") return await exportDataToPdf(data);
  if (normalizedFormat === "csv") return exportDataToCsv(data);
  return Buffer.from(JSON.stringify(data, null, 2), "utf8");
}

export function buildExportFileName(prefix, format, range) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${range.startDate}-${range.endDate}-${stamp}.${extensionForFormat(format)}`;
}

export function buildDownloadHeaders(fileName, format, size) {
  const encodedName = encodeURIComponent(fileName);
  return {
    "Content-Type": contentTypeForFormat(format),
    "Content-Length": String(size || 0),
    "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodedName}`,
    "Cache-Control": "no-store"
  };
}

export async function createBackupFile({ supabase, farmId, userId, user, options, updateSchedule = false }) {
  const format = "json";
  const data = await collectFarmExportData(supabase, farmId, user, {
    ...options,
    sections: options.sections?.length ? options.sections : DEFAULT_SECTIONS
  });
  const buffer = await renderExportFile(data, format);
  const fileName = buildExportFileName("majhi-dairy-backup", format, data.range);
  const storagePath = `${farmId}/backups/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BACKUP_BUCKET)
    .upload(storagePath, buffer, {
      contentType: contentTypeForFormat(format),
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: backup, error } = await supabase
    .from("farm_export_backups")
    .insert({
      farm_id: farmId,
      user_id: userId,
      type: "backup",
      format,
      file_name: fileName,
      storage_bucket: BACKUP_BUCKET,
      storage_path: storagePath,
      size_bytes: buffer.length,
      records_count: data.recordsCount,
      sections: data.sections,
      date_range: data.range,
      metadata: {
        warnings: data.warnings,
        generatedAt: data.generatedAt,
        cloud_backup_ready: true
      },
      status: "ready"
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(BACKUP_BUCKET).remove([storagePath]);
    throw error;
  }

  if (updateSchedule) {
    await updateAutoBackupAfterRun(supabase, farmId);
  }

  return { backup, data };
}

export async function getBackupSignedUrl(supabase, backup) {
  if (!backup?.storage_path) {
    throw userInputError("Backup file path सापडला नाही.", 404);
  }

  const { data, error } = await supabase.storage
    .from(backup.storage_bucket || BACKUP_BUCKET)
    .createSignedUrl(backup.storage_path, 60 * 10, {
      download: backup.file_name
    });

  if (error) throw error;
  return data?.signedUrl || "";
}

function cleanRestoreRow(table, row, farmId) {
  const next = { ...(row || {}), farm_id: farmId };
  for (const column of GENERATED_COLUMNS[table] || []) {
    delete next[column];
  }
  return next;
}

export async function restoreBackup({ supabase, farmId, backup }) {
  if (backup.type !== "backup" || backup.format !== "json") {
    throw userInputError("फक्त JSON backup restore करता येतो.");
  }

  if (!["ready", "restored"].includes(backup.status)) {
    throw userInputError("हा backup restore करण्यासाठी तयार नाही.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(backup.storage_bucket || BACKUP_BUCKET)
    .download(backup.storage_path);

  if (downloadError) throw downloadError;

  let parsed;
  try {
    parsed = JSON.parse(await fileData.text());
  } catch {
    throw userInputError("Backup file वाचता आली नाही. File खराब असू शकते.");
  }

  if (!parsed || parsed.app !== "माझी डेअरी" || !Array.isArray(parsed.datasets)) {
    throw userInputError("हा माझी डेअरीचा वैध backup नाही.");
  }
  if (parsed.farmId && parsed.farmId !== farmId) {
    throw userInputError("हा backup या डेअरीचा नाही.");
  }

  const restored = [];

  for (const dataset of parsed.datasets || []) {
    if (!RESTORE_TABLES.has(dataset.table) || !Array.isArray(dataset.rows) || !dataset.rows.length) {
      continue;
    }

    const rows = dataset.rows
      .filter((row) => row?.id)
      .map((row) => cleanRestoreRow(dataset.table, row, farmId));

    if (!rows.length) continue;

    const { error } = await supabase
      .from(dataset.table)
      .upsert(rows, { onConflict: "id" });

    if (error) throw error;
    restored.push({ table: dataset.table, count: rows.length });
  }

  await supabase
    .from("farm_export_backups")
    .update({ status: "restored", restored_at: new Date().toISOString() })
    .eq("id", backup.id)
    .eq("farm_id", farmId);

  return {
    restored,
    restoredCount: restored.reduce((sum, item) => sum + item.count, 0)
  };
}

function nextBackupAt(frequency) {
  const now = new Date();
  if (frequency === "daily") now.setDate(now.getDate() + 1);
  else if (frequency === "weekly") now.setDate(now.getDate() + 7);
  else if (frequency === "monthly") now.setMonth(now.getMonth() + 1);
  else return null;
  return now.toISOString();
}

export async function getOrCreateAutoBackupSettings(supabase, farmId, userId) {
  const { data, error } = await supabase
    .from("farm_auto_backup_settings")
    .select("*")
    .eq("farm_id", farmId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const { data: created, error: createError } = await supabase
    .from("farm_auto_backup_settings")
    .insert({
      farm_id: farmId,
      user_id: userId,
      frequency: "off",
      enabled: false,
      next_backup_at: null
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return created;
}

export async function updateAutoBackupSettings(supabase, farmId, userId, frequency) {
  const cleanFrequency = ["off", "daily", "weekly", "monthly"].includes(frequency) ? frequency : "off";
  const enabled = cleanFrequency !== "off";
  const { data, error } = await supabase
    .from("farm_auto_backup_settings")
    .upsert({
      farm_id: farmId,
      user_id: userId,
      frequency: cleanFrequency,
      enabled,
      next_backup_at: enabled ? nextBackupAt(cleanFrequency) : null,
      updated_at: new Date().toISOString()
    }, { onConflict: "farm_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateAutoBackupAfterRun(supabase, farmId) {
  const settings = await getOrCreateAutoBackupSettings(supabase, farmId, null);
  if (!settings.enabled || settings.frequency === "off") return;

  await supabase
    .from("farm_auto_backup_settings")
    .update({
      last_backup_at: new Date().toISOString(),
      next_backup_at: nextBackupAt(settings.frequency),
      updated_at: new Date().toISOString()
    })
    .eq("farm_id", farmId);
}

export function formatBackupSize(bytes) {
  const size = numberOrZero(bytes);
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}
