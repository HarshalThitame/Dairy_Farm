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
  { id: "custom", label: "Custom" }
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
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";
  return toMarathiNumerals(new Date(value).toLocaleDateString("mr-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }));
}

function formatSize(bytes) {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024) return `${toMarathiNumerals((size / 1024 / 1024).toFixed(2))} MB`;
  if (size >= 1024) return `${toMarathiNumerals((size / 1024).toFixed(1))} KB`;
  return `${toMarathiNumerals(size)} B`;
}

function fileNameFromDisposition(disposition) {
  const match = String(disposition || "").match(/filename="?([^"]+)"?/i);
  return match?.[1] || `majhi-dairy-export-${Date.now()}`;
}

function ToggleChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[48px] rounded-xl border px-4 text-[16px] font-black transition ${
        active
          ? "border-green-300 bg-green-100 text-green-800 shadow-sm"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({ children, busy, tone = "green", ...props }) {
  const toneClass = {
    green: "bg-green-600 text-white",
    blue: "bg-sky-600 text-white",
    slate: "bg-slate-900 text-white",
    red: "bg-red-600 text-white"
  }[tone];

  return (
    <button
      type="button"
      disabled={busy || props.disabled}
      className={`min-h-[56px] rounded-xl px-5 text-[18px] font-black shadow-sm disabled:opacity-60 ${toneClass}`}
      {...props}
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

  const selectedCount = useMemo(() => selectedSections.length, [selectedSections]);

  const payload = useMemo(() => ({
    sections: selectedSections,
    format,
    rangeType,
    startDate,
    endDate
  }), [selectedSections, format, rangeType, startDate, endDate]);

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

  function toggleSection(id) {
    setMessage("");
    setError("");
    setSelectedSections((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
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
    if (!selectedSections.length) {
      setError("किमान एक export option निवडा.");
      return;
    }
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
    if (!selectedSections.length) {
      setError("Backup साठी किमान एक विभाग निवडा.");
      return;
    }
    setBusyAction("backup");
    setMessage("");
    setError("");
    try {
      const result = await postJson({ action: "create_backup", ...payload });
      setMessage("✅ Backup तयार झाला.");
      await load();
      if (result.signedUrl) {
        window.open(result.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (backupError) {
      setError(backupError.message || "Backup तयार झाला नाही.");
    } finally {
      setBusyAction("");
    }
  }

  async function downloadBackup(backupId) {
    setBusyAction(`download-${backupId}`);
    setMessage("");
    setError("");
    try {
      const result = await postJson({ action: "download_backup", backupId });
      if (result.signedUrl) {
        window.open(result.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (downloadError) {
      setError(downloadError.message || "Backup download झाला नाही.");
    } finally {
      setBusyAction("");
    }
  }

  async function restoreSelectedBackup(backup) {
    const confirmed = window.confirm(
      `हा backup restore करायचा आहे का?\n\n${backup.fileName}\n\nSame ID असलेल्या नोंदी update होतील. Extra existing data delete होणार नाही.`
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
    <div className="space-y-5 pb-24">
      <PageHeader title="📦 Export & Backup" subtitle="तुमच्या डेअरीचा data download आणि backup करा." />

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-[18px] font-black text-green-900 shadow-sm">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[18px] font-black text-red-900 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-black text-slate-950">Export Options</h2>
            <p className="mt-1 text-[15px] font-bold text-slate-500">
              {toMarathiNumerals(selectedCount)} विभाग निवडले आहेत.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSelectedSections(
                selectedSections.length === sections.length ? [] : sections.map((section) => section.id)
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[14px] font-black text-slate-700"
          >
            {selectedSections.length === sections.length ? "सगळे काढा" : "सगळे निवडा"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              className={`min-h-[72px] rounded-xl border p-3 text-left shadow-sm ${
                selectedSections.includes(section.id)
                  ? "border-green-300 bg-green-50 text-green-900"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <span className="block text-[18px] font-black">{selectedSections.includes(section.id) ? "✅" : "⬜"} {section.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Format आणि कालावधी</h2>

        <div className="mt-4">
          <p className="text-[16px] font-black text-slate-700">Export Format</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {formats.map((item) => (
              <ToggleChip key={item.id} active={format === item.id} onClick={() => setFormat(item.id)}>
                {item.label}
              </ToggleChip>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[16px] font-black text-slate-700">Date Range</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ranges.map((item) => (
              <ToggleChip key={item.id} active={rangeType === item.id} onClick={() => setRangeType(item.id)}>
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
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
              />
            </label>
            <label className="block">
              <span className="text-[15px] font-black text-slate-700">शेवट तारीख</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-2 min-h-[54px] w-full rounded-xl border border-slate-200 px-4 text-[17px] font-bold outline-none focus:border-green-500"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ActionButton busy={busyAction === "export"} onClick={exportData} tone="green">
            ⬇️ Export Download करा
          </ActionButton>
          <ActionButton busy={busyAction === "backup"} onClick={createBackup} tone="blue">
            ☁️ Backup तयार करा
          </ActionButton>
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Auto Backup</h2>
        <p className="mt-1 text-[15px] font-bold text-slate-500">
          Backup schedule future cloud backup architecture साठी तयार आहे.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {autoOptions.map((item) => (
            <ToggleChip
              key={item.id}
              active={(autoBackup?.frequency || "off") === item.id}
              onClick={() => saveAutoBackup(item.id)}
            >
              {item.label}
            </ToggleChip>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4">
          <p className="text-[15px] font-black text-slate-500">पुढील backup</p>
          <p className="mt-1 text-[19px] font-black text-slate-950">
            {autoBackup?.next_backup_at ? formatDate(autoBackup.next_backup_at) : "बंद"}
          </p>
          <p className="mt-2 text-[14px] font-bold text-slate-500">
            Cloud Backup: {autoBackup?.cloud_backup_enabled ? "चालू" : "Future Ready"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">Backup History</h2>
        <div className="mt-4 grid gap-3">
          {backups.length ? backups.map((backup) => (
            <article key={backup.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-black text-slate-950">{backup.fileName}</p>
                  <p className="mt-1 text-[14px] font-bold text-slate-500">{formatDate(backup.createdAt)}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[13px] font-black text-slate-700">
                  {backup.type === "backup" ? "Backup" : "Export"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Meta label="Size" value={formatSize(backup.sizeBytes)} />
                <Meta label="Records" value={toMarathiNumerals(backup.recordsCount || 0)} />
                <Meta label="Status" value={backup.status || "-"} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ActionButton
                  busy={busyAction === `download-${backup.id}`}
                  onClick={() => downloadBackup(backup.id)}
                  tone="slate"
                >
                  ⬇️ Download
                </ActionButton>
                <ActionButton
                  busy={busyAction === `restore-${backup.id}`}
                  onClick={() => restoreSelectedBackup(backup)}
                  tone="red"
                >
                  ♻️ Restore
                </ActionButton>
              </div>
            </article>
          )) : (
            <p className="rounded-xl bg-slate-50 p-4 text-[17px] font-bold text-slate-600">
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
