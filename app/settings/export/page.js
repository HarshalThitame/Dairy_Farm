"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import PageHeader from "@/components/PageHeader";
import { toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const fallbackSections = [
  { id: "milk_records", label: "दूध नोंदी" },
  { id: "slip_history", label: "स्लिप इतिहास" },
  { id: "ai_history", label: "AI इतिहास" },
  { id: "animal_records", label: "जनावरांची माहिती" },
  { id: "expenses", label: "खर्च" },
  { id: "income", label: "उत्पन्न" },
  { id: "reports", label: "अहवाल" }
];

const fallbackFormats = [
  { id: "pdf", label: "PDF" },
  { id: "xlsx", label: "Excel" },
  { id: "csv", label: "CSV" },
  { id: "json", label: "JSON" }
];

const fallbackRanges = [
  { id: "today", label: "आज" },
  { id: "this_week", label: "हा आठवडा" },
  { id: "this_month", label: "हा महिना" },
  { id: "custom", label: "स्वतःचा कालावधी" }
];

const autoOptions = [
  { id: "off", label: "बंद" },
  { id: "daily", label: "दररोज" },
  { id: "weekly", label: "दर आठवड्याला" },
  { id: "monthly", label: "दर महिन्याला" }
];

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return toMarathiNumerals(date.toLocaleDateString("mr-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }));
}

function formatSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return "० B";
  if (size >= 1024 * 1024) return `${toMarathiNumerals((size / 1024 / 1024).toFixed(2))} MB`;
  if (size >= 1024) return `${toMarathiNumerals((size / 1024).toFixed(1))} KB`;
  return `${toMarathiNumerals(size)} B`;
}

function statusLabel(status) {
  return {
    creating: "तयार होत आहे",
    ready: "तयार",
    failed: "अयशस्वी",
    restored: "Restore झाले",
    deleted: "काढले"
  }[status] || status || "-";
}

function backupTypeLabel(type) {
  return type === "backup" ? "Backup" : "Export";
}

function fileNameFromDisposition(disposition) {
  const header = String(disposition || "");
  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  let rawName = plainMatch?.[1];

  if (encodedMatch?.[1]) {
    try {
      rawName = decodeURIComponent(encodedMatch[1]);
    } catch {
      rawName = plainMatch?.[1];
    }
  }

  return String(rawName || `majhi-dairy-export-${Date.now()}`)
    .replace(/[\\/:\0]/g, "-")
    .trim();
}

function downloadExternalUrl(url, fileName = "") {
  if (!url) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  if (fileName) anchor.download = fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function ToggleChip({ active, children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[52px] w-full rounded-xl border px-3 text-center text-[15px] font-black leading-tight transition sm:text-[16px] ${
        active
          ? "border-green-300 bg-green-100 text-green-800 shadow-sm"
          : "border-slate-200 bg-white text-slate-700"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, busy, disabled = false, tone = "green", ...props }) {
  const toneClass = {
    green: "bg-green-600 text-white",
    blue: "bg-sky-600 text-white",
    slate: "bg-slate-900 text-white",
    red: "bg-red-600 text-white"
  }[tone];

  return (
    <button
      {...props}
      type="button"
      disabled={busy || disabled}
      className={`flex min-h-[56px] w-full items-center justify-center rounded-xl px-5 text-center text-[17px] font-black leading-tight shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:text-[18px] ${toneClass}`}
    >
      {busy ? "कृपया थांबा..." : children}
    </button>
  );
}

export default function ExportBackupPage() {
  const [sections, setSections] = useState(fallbackSections);
  const [formats, setFormats] = useState(fallbackFormats);
  const [ranges, setRanges] = useState(fallbackRanges);
  const [selectedSections, setSelectedSections] = useState(fallbackSections.map((section) => section.id));
  const [format, setFormat] = useState("xlsx");
  const [rangeType, setRangeType] = useState("this_month");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [backups, setBackups] = useState([]);
  const [autoBackup, setAutoBackup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sectionIds = useMemo(() => new Set(sections.map((section) => section.id)), [sections]);
  const validSelectedSections = useMemo(
    () => selectedSections.filter((sectionId) => sectionIds.has(sectionId)),
    [sectionIds, selectedSections]
  );
  const selectedCount = validSelectedSections.length;
  const isBusy = Boolean(busyAction);
  const allSectionsSelected = sections.length > 0 && selectedCount === sections.length;

  const payload = useMemo(() => ({
    sections: validSelectedSections,
    format,
    rangeType,
    startDate,
    endDate
  }), [validSelectedSections, format, rangeType, startDate, endDate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/settings/export", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Export माहिती मिळाली नाही.");
      setSections(result.sections?.length ? result.sections : fallbackSections);
      setFormats(result.formats?.length ? result.formats : fallbackFormats);
      setRanges(result.ranges?.length ? result.ranges : fallbackRanges);
      setBackups(result.backups || []);
      setAutoBackup(result.autoBackup || null);
    } catch (loadError) {
      setError(loadError.message || "Export माहिती मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedSections((current) => {
      const allowedIds = new Set(sections.map((section) => section.id));
      const filtered = current.filter((sectionId) => allowedIds.has(sectionId));
      return filtered.length ? filtered : sections.map((section) => section.id);
    });
  }, [sections]);

  useEffect(() => {
    if (!formats.some((item) => item.id === format)) {
      setFormat(formats[0]?.id || "json");
    }
  }, [format, formats]);

  useEffect(() => {
    if (!ranges.some((item) => item.id === rangeType)) {
      setRangeType(ranges[0]?.id || "this_month");
    }
  }, [rangeType, ranges]);

  function toggleSection(id) {
    setMessage("");
    setError("");
    setSelectedSections((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function setRange(nextRange) {
    setMessage("");
    setError("");
    setRangeType(nextRange);
  }

  function setCustomStartDate(value) {
    setMessage("");
    setError("");
    setStartDate(value);
  }

  function setCustomEndDate(value) {
    setMessage("");
    setError("");
    setEndDate(value);
  }

  function validateBeforeAction(actionLabel) {
    if (!validSelectedSections.length) {
      setError(`${actionLabel} साठी किमान एक विभाग निवडा.`);
      return false;
    }

    if (rangeType === "custom") {
      if (!startDate || !endDate) {
        setError("Custom कालावधीसाठी सुरू आणि शेवट तारीख निवडा.");
        return false;
      }

      if (endDate < startDate) {
        setError("शेवट तारीख सुरू तारखेपेक्षा आधी नसावी.");
        return false;
      }
    }

    return true;
  }

  async function postJson(body) {
    const response = await fetch("/api/settings/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "क्रिया पूर्ण झाली नाही.");
    return result;
  }

  async function exportData() {
    if (isBusy || !validateBeforeAction("Export")) return;
    setBusyAction("export");
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/settings/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ action: "export", ...payload })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Export तयार झाला नाही.");
      }

      const blob = await response.blob();
      const fileName = fileNameFromDisposition(response.headers.get("Content-Disposition"));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("✅ Export download सुरू झाला.");
    } catch (exportError) {
      setError(exportError.message || "Export तयार झाला नाही.");
    } finally {
      setBusyAction("");
    }
  }

  async function createBackup() {
    if (isBusy || !validateBeforeAction("Backup")) return;
    setBusyAction("backup");
    setMessage("");
    setError("");
    try {
      const result = await postJson({ action: "create_backup", ...payload });
      setMessage("✅ Backup तयार झाला.");
      await load();
      if (result.signedUrl) {
        downloadExternalUrl(result.signedUrl, result.backup?.fileName);
      }
    } catch (backupError) {
      setError(backupError.message || "Backup तयार झाला नाही.");
    } finally {
      setBusyAction("");
    }
  }

  async function downloadBackup(backupId) {
    if (isBusy) return;
    setBusyAction(`download-${backupId}`);
    setMessage("");
    setError("");
    try {
      const result = await postJson({ action: "download_backup", backupId });
      if (result.signedUrl) {
        downloadExternalUrl(result.signedUrl, result.backup?.fileName);
      }
    } catch (downloadError) {
      setError(downloadError.message || "Backup download झाला नाही.");
    } finally {
      setBusyAction("");
    }
  }

  async function restoreSelectedBackup(backup) {
    if (isBusy) return;
    if (backup.type !== "backup" || backup.format !== "json") {
      setError("फक्त JSON backup restore करता येतो.");
      return;
    }

    const confirmed = window.confirm(
      `हा backup restore करायचा आहे का?\n\n${backup.fileName}\n\nSame ID असलेल्या नोंदी update होतील. Extra existing data delete होणार नाही. अहवाल/नफा पुन्हा calculate होईल.`
    );
    if (!confirmed) return;

    setBusyAction(`restore-${backup.id}`);
    setMessage("");
    setError("");
    try {
      const result = await postJson({ action: "restore_backup", backupId: backup.id });
      setMessage(`✅ Backup restore झाला. ${toMarathiNumerals(result.restoredCount || 0)} नोंदी restore झाल्या.`);
      await load();
    } catch (restoreError) {
      setError(restoreError.message || "Backup restore झाला नाही.");
    } finally {
      setBusyAction("");
    }
  }

  async function saveAutoBackup(frequency) {
    if (isBusy) return;
    setBusyAction("auto");
    setMessage("");
    setError("");
    try {
      const result = await postJson({ action: "update_auto_backup", frequency });
      setAutoBackup(result.autoBackup);
      setMessage("✅ Auto backup सेटिंग्ज जतन झाल्या.");
    } catch (autoError) {
      setError(autoError.message || "Auto backup सेटिंग्ज जतन झाल्या नाहीत.");
    } finally {
      setBusyAction("");
    }
  }

  if (loading) return <LoadingState text="Export Center लोड होत आहे..." />;
  if (error && !sections.length) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5 pb-28">
      <PageHeader title="📦 Export आणि Backup" subtitle="तुमच्या डेअरीचा data download आणि सुरक्षित backup करा." />

      <section className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 via-white to-sky-50 p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/85 p-4">
            <p className="text-[13px] font-black uppercase text-slate-500">निवडलेले विभाग</p>
            <p className="mt-1 text-[30px] font-black text-slate-950">{toMarathiNumerals(selectedCount)}</p>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <p className="text-[13px] font-black uppercase text-slate-500">Format</p>
            <p className="mt-1 text-[30px] font-black text-slate-950">{String(format || "").toUpperCase()}</p>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <p className="text-[13px] font-black uppercase text-slate-500">Auto Backup</p>
            <p className="mt-1 text-[30px] font-black text-slate-950">
              {(autoBackup?.frequency || "off") === "off" ? "बंद" : autoOptions.find((item) => item.id === autoBackup?.frequency)?.label}
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-[17px] font-black text-green-900 shadow-sm">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[17px] font-black text-red-900 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[24px] font-black text-slate-950">काय download करायचे?</h2>
            <p className="mt-1 text-[15px] font-bold text-slate-500">
              {toMarathiNumerals(selectedCount)} विभाग निवडले आहेत.
            </p>
          </div>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              setMessage("");
              setError("");
              setSelectedSections(
                allSectionsSelected ? [] : sections.map((section) => section.id)
              );
            }}
            className="min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-black text-slate-700 disabled:opacity-60 sm:self-start"
          >
            {allSectionsSelected ? "सगळे काढा" : "सगळे निवडा"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              disabled={isBusy}
              className={`min-h-[68px] rounded-2xl border p-4 text-left shadow-sm transition active:scale-[0.99] ${
                validSelectedSections.includes(section.id)
                  ? "border-green-300 bg-green-50 text-green-900"
                  : "border-slate-200 bg-white text-slate-700"
              } disabled:opacity-60`}
            >
              <span className="flex items-center gap-3 text-[18px] font-black">
                <span>{validSelectedSections.includes(section.id) ? "✅" : "⬜"}</span>
                <span className="min-w-0">{section.label}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Format आणि कालावधी</h2>

        <div className="mt-4">
          <p className="text-[16px] font-black text-slate-700">File format</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {formats.map((item) => (
              <ToggleChip key={item.id} active={format === item.id} disabled={isBusy} onClick={() => {
                setMessage("");
                setError("");
                setFormat(item.id);
              }}>
                {item.label}
              </ToggleChip>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[16px] font-black text-slate-700">कालावधी</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ranges.map((item) => (
              <ToggleChip key={item.id} active={rangeType === item.id} disabled={isBusy} onClick={() => setRange(item.id)}>
                {item.label}
              </ToggleChip>
            ))}
          </div>
        </div>

        {rangeType === "custom" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[15px] font-black text-slate-700">सुरू तारीख</span>
              <input
                type="date"
                value={startDate}
                disabled={isBusy}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
              />
            </label>
            <label className="block">
              <span className="text-[15px] font-black text-slate-700">शेवट तारीख</span>
              <input
                type="date"
                value={endDate}
                disabled={isBusy}
                min={startDate || undefined}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ActionButton busy={busyAction === "export"} disabled={isBusy && busyAction !== "export"} onClick={exportData} tone="green">
            ⬇️ Export download करा
          </ActionButton>
          <ActionButton busy={busyAction === "backup"} disabled={isBusy && busyAction !== "backup"} onClick={createBackup} tone="blue">
            ☁️ Backup तयार करा
          </ActionButton>
        </div>
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Auto backup</h2>
        <p className="mt-1 text-[15px] font-bold text-slate-500">
          निवडलेल्या वेळापत्रकानुसार backup तयार करण्याची व्यवस्था.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {autoOptions.map((item) => (
            <ToggleChip
              key={item.id}
              active={(autoBackup?.frequency || "off") === item.id}
              disabled={isBusy}
              onClick={() => saveAutoBackup(item.id)}
            >
              {item.label}
            </ToggleChip>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-[15px] font-black text-slate-500">पुढील backup</p>
          <p className="mt-1 text-[19px] font-black text-slate-950">
            {autoBackup?.next_backup_at ? formatDate(autoBackup.next_backup_at) : "बंद"}
          </p>
          <p className="mt-2 text-[14px] font-bold text-slate-500">
            Cloud backup: {autoBackup?.cloud_backup_enabled ? "चालू" : "नंतर जोडण्यासाठी तयार"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Backup इतिहास</h2>
        <div className="mt-4 grid gap-3">
          {backups.length ? backups.map((backup) => (
            <article key={backup.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-[18px] font-black leading-snug text-slate-950">{backup.fileName}</p>
                  <p className="mt-1 text-[14px] font-bold text-slate-500">{formatDate(backup.createdAt)}</p>
                </div>
                <span className="w-fit rounded-full bg-white px-3 py-1 text-[13px] font-black text-slate-700">
                  {backupTypeLabel(backup.type)} · {String(backup.format || "").toUpperCase()}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Meta label="आकार" value={formatSize(backup.sizeBytes)} />
                <Meta label="नोंदी" value={toMarathiNumerals(backup.recordsCount || 0)} />
                <Meta label="स्थिती" value={statusLabel(backup.status)} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ActionButton
                  busy={busyAction === `download-${backup.id}`}
                  disabled={isBusy && busyAction !== `download-${backup.id}`}
                  onClick={() => downloadBackup(backup.id)}
                  tone="slate"
                >
                  ⬇️ Download करा
                </ActionButton>
                <ActionButton
                  busy={busyAction === `restore-${backup.id}`}
                  disabled={(isBusy && busyAction !== `restore-${backup.id}`) || backup.type !== "backup" || backup.format !== "json"}
                  onClick={() => restoreSelectedBackup(backup)}
                  tone="red"
                >
                  ♻️ Restore करा
                </ActionButton>
              </div>
            </article>
          )) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-[17px] font-bold text-slate-600">
              अजून backup तयार केलेला नाही.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[12px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-[15px] font-black text-slate-950">{value}</p>
    </div>
  );
}
