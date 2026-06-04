"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ErrorState from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import { getClientAuthToken } from "@/lib/clientStorage";
import { formatCurrency, formatLitres, formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

const overviewCards = [
  ["totalMilk", "🥛", "एकूण दूध", "milk", "from-blue-50 via-white to-cyan-50 border-blue-100 text-blue-950"],
  ["totalIncome", "💰", "एकूण उत्पन्न", "currency", "from-green-50 via-white to-emerald-50 border-green-100 text-green-950"],
  ["averageFat", "🧈", "सरासरी फॅट", "percent", "from-yellow-50 via-white to-amber-50 border-yellow-100 text-yellow-950"],
  ["averageSNF", "🧪", "सरासरी SNF", "number", "from-purple-50 via-white to-violet-50 border-purple-100 text-purple-950"],
  ["totalSlips", "📷", "एकूण स्लिप", "number", "from-sky-50 via-white to-blue-50 border-sky-100 text-sky-950"],
  ["aiQuestions", "🤖", "AI प्रश्न", "number", "from-emerald-50 via-white to-teal-50 border-emerald-100 text-emerald-950"],
  ["animalsCount", "🐄", "जनावरे", "number", "from-slate-50 via-white to-green-50 border-slate-200 text-slate-950"]
];

function getToken() {
  return getClientAuthToken();
}

function formatNumber(value, decimals = 2) {
  const numberValue = Number(value || 0);
  const rounded = Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(decimals).replace(/\.00$/, "");
  return toMarathiNumerals(rounded);
}

function formatValue(value, type) {
  if (type === "currency") return formatCurrency(value);
  if (type === "milk") return `${formatLitres(value)} लि.`;
  if (type === "percent") return `${formatNumber(value, 2)}%`;
  return formatNumber(value, 2);
}

function trendText(metric) {
  const percent = Math.abs(Number(metric.changePercent || 0));
  if (metric.direction === "increase") return `+${formatNumber(percent, 1)}% वाढ`;
  if (metric.direction === "decrease") return `-${formatNumber(percent, 1)}% घट`;
  return "बदल नाही";
}

function chartDate(value) {
  if (!value) return "";
  return toMarathiNumerals(value.slice(-2));
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 text-[14px] font-bold shadow-soft backdrop-blur">
      <p className="text-slate-700">{toMarathiNumerals(label)}</p>
      <p className="text-slate-950">{formatNumber(item.value, 2)}</p>
    </div>
  );
}

function OverviewCard({ icon, label, value, type, tone }) {
  return (
    <article className={`dashboard-card min-w-0 overflow-hidden rounded-3xl border bg-gradient-to-br p-4 shadow-soft ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/85 text-[30px] shadow-sm">{icon}</span>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-black text-slate-500 shadow-sm ring-1 ring-white/70">LIVE</span>
      </div>
      <p className="mt-4 text-[13px] font-black uppercase leading-tight opacity-65">{label}</p>
      <p className="mt-1 break-words text-[26px] font-black leading-tight">{formatValue(value, type)}</p>
    </article>
  );
}

function GrowthCard({ metric }) {
  const positive = metric.direction === "increase";
  const negative = metric.direction === "decrease";
  return (
    <article className="dashboard-card rounded-3xl border border-white/80 bg-white/95 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[17px] font-black text-slate-700">{metric.label}</p>
        <span className={`rounded-full px-3 py-1 text-[13px] font-black ${
          positive ? "bg-green-100 text-green-800" : negative ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"
        }`}>
          {positive ? "▲" : negative ? "▼" : "•"} {trendText(metric)}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[22px] font-black text-slate-950">
            {metric.unit === "₹" ? formatCurrency(metric.currentValue) : `${formatNumber(metric.currentValue, 2)} ${metric.unit || ""}`}
          </p>
          <p className="mt-1 text-[13px] font-bold text-slate-500">
            मागील: {metric.unit === "₹" ? formatCurrency(metric.previousValue) : `${formatNumber(metric.previousValue, 2)} ${metric.unit || ""}`}
          </p>
        </div>
      </div>
    </article>
  );
}

function ChartCard({ title, subtitle, icon = "📊", children }) {
  return (
    <section className="rounded-3xl border border-white/80 bg-white/95 p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-[28px] shadow-inner">{icon}</span>
        <span className="min-w-0">
          <h2 className="text-[22px] font-black leading-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-[14px] font-bold leading-snug text-slate-500">{subtitle}</p> : null}
        </span>
      </div>
      <div className="mt-4 h-[260px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-white p-2 ring-1 ring-slate-100">{children}</div>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-center text-[16px] font-bold text-slate-500">
      <span>
        <span className="block text-[34px]">📭</span>
        या कालावधीसाठी chart data उपलब्ध नाही.
      </span>
    </div>
  );
}

function BestCard({ title, item, tone = "green" }) {
  const toneClass = {
    green: "from-green-50 to-white border-green-100 text-green-800",
    blue: "from-sky-50 to-white border-sky-100 text-sky-800",
    yellow: "from-yellow-50 to-white border-yellow-100 text-yellow-800",
    purple: "from-purple-50 to-white border-purple-100 text-purple-800"
  }[tone];
  return (
    <article className={`dashboard-card rounded-3xl border bg-gradient-to-br p-4 shadow-soft ${toneClass}`}>
      <p className="text-[17px] font-black">{title}</p>
      {item ? (
        <>
          <p className="mt-2 break-words text-[25px] font-black text-slate-950">
            {item.unit === "₹" ? formatCurrency(item.value) : `${formatNumber(item.value, 2)} ${item.unit || ""}`}
          </p>
          <p className="mt-1 text-[14px] font-bold text-slate-600">{formatMarathiDate(item.date)}</p>
        </>
      ) : (
        <p className="mt-3 text-[17px] font-bold text-slate-500">माहिती नाही</p>
      )}
    </article>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-center backdrop-blur">
      <p className="text-[12px] font-black uppercase leading-tight text-white/65">{label}</p>
      <p className="mt-1 break-words text-[18px] font-black leading-tight text-white">
        {typeof value === "number" ? toMarathiNumerals(value) : value}
      </p>
    </div>
  );
}

export default function PersonalStatisticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const stats = data?.stats;
  const overview = stats?.overview || {};

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile/statistics", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "आकडेवारी मिळाली नाही.");
      setData(result);
    } catch (loadError) {
      setError(loadError.message || "आकडेवारी मिळाली नाही.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shareText = useMemo(() => {
    if (!stats) return "";
    return `माझी डेअरी आकडेवारी\nएकूण दूध: ${formatLitres(stats.overview.totalMilk)} लिटर\nएकूण उत्पन्न: ${formatCurrency(stats.overview.totalIncome)}\nFarm Health Score: ${toMarathiNumerals(stats.farmHealthScore.score)}/१००\n${stats.aiSummary}`;
  }, [stats]);

  async function downloadPdf() {
    setBusyAction("pdf");
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/profile/statistics", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action: "pdf" })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "PDF तयार झाला नाही.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `majhi-dairy-statistics-${stats.today}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("✅ PDF download सुरू झाला.");
    } catch (pdfError) {
      setError(pdfError.message || "PDF तयार झाला नाही.");
    } finally {
      setBusyAction("");
    }
  }

  async function downloadShareImage() {
    if (!stats) return;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#dcfce7"/>
            <stop offset="1" stop-color="#e0f2fe"/>
          </linearGradient>
        </defs>
        <rect width="1080" height="1080" fill="url(#bg)"/>
        <rect x="70" y="70" width="940" height="940" rx="42" fill="white" opacity="0.92"/>
        <text x="100" y="155" font-size="54" font-family="Noto Sans Devanagari, Arial" font-weight="800">🐄 माझी डेअरी आकडेवारी</text>
        <text x="100" y="225" font-size="32" font-family="Noto Sans Devanagari, Arial" fill="#475569">${escapeXml(data?.farm?.farmName || "")}</text>
        <text x="100" y="330" font-size="44" font-family="Noto Sans Devanagari, Arial">🥛 एकूण दूध: ${formatLitres(stats.overview.totalMilk)} लिटर</text>
        <text x="100" y="420" font-size="44" font-family="Noto Sans Devanagari, Arial">💰 उत्पन्न: ${formatCurrency(stats.overview.totalIncome)}</text>
        <text x="100" y="510" font-size="44" font-family="Noto Sans Devanagari, Arial">🧈 फॅट: ${formatNumber(stats.overview.averageFat)}%</text>
        <text x="100" y="600" font-size="44" font-family="Noto Sans Devanagari, Arial">🧪 SNF: ${formatNumber(stats.overview.averageSNF)}</text>
        <text x="100" y="705" font-size="48" font-family="Noto Sans Devanagari, Arial" font-weight="800">Farm Health Score</text>
        <text x="100" y="790" font-size="78" font-family="Noto Sans Devanagari, Arial" fill="#16a34a" font-weight="900">${toMarathiNumerals(stats.farmHealthScore.score)}/१००</text>
        <text x="100" y="895" font-size="32" font-family="Noto Sans Devanagari, Arial" fill="#166534">${escapeXml(stats.aiSummary)}</text>
      </svg>`;
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      const loaded = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      image.src = svgUrl;
      await loaded;
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      const url = URL.createObjectURL(pngBlob || svgBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `majhi-dairy-statistics-${stats.today}.${pngBlob ? "png" : "svg"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("✅ Share image download झाला.");
    } catch {
      const anchor = document.createElement("a");
      anchor.href = svgUrl;
      anchor.download = `majhi-dairy-statistics-${stats.today}.svg`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setMessage("✅ Share image download झाला.");
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  async function shareToWhatsApp() {
    if (!shareText) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "माझी डेअरी आकडेवारी", text: shareText });
        return;
      } catch {
        // Fall back to WhatsApp URL.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  }

  if (loading) return <LoadingState text="वैयक्तिक आकडेवारी लोड होत आहे..." />;
  if (error && !data) return <ErrorState message={error} onRetry={load} />;

  const healthScore = Math.min(100, Math.max(0, Number(stats.farmHealthScore.score || 0)));
  const healthCircumference = 2 * Math.PI * 48;
  const healthDashOffset = healthCircumference - (healthScore / 100) * healthCircumference;
  const farmName = data?.farm?.farmName || "माझी डेअरी";
  const rangeLabel = stats.currentRange?.startDate && stats.currentRange?.endDate
    ? `${formatMarathiDate(stats.currentRange.startDate)} ते ${formatMarathiDate(stats.currentRange.endDate)}`
    : "सध्याची आकडेवारी";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-24">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-slate-950 via-emerald-950 to-green-700 p-5 text-white shadow-soft sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/25 to-transparent" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[13px] font-black text-green-50 backdrop-blur">
                📊 वैयक्तिक आकडेवारी
              </span>
              <span className="rounded-full border border-yellow-200/40 bg-yellow-300/15 px-3 py-1 text-[13px] font-black text-yellow-50">
                {rangeLabel}
              </span>
            </div>
            <h1 className="mt-4 break-words text-[34px] font-black leading-tight sm:text-[44px]">
              {farmName}
            </h1>
            <p className="mt-2 max-w-3xl text-[18px] font-bold leading-relaxed text-white/85">
              {stats.aiSummary}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-2xl">
              <HeroStat label="दूध" value={`${formatLitres(overview.totalMilk)} लि.`} />
              <HeroStat label="उत्पन्न" value={formatCurrency(overview.totalIncome)} />
              <HeroStat label="जनावरे" value={overview.animalsCount || 0} />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-4 backdrop-blur sm:min-w-[330px]">
            <div className="flex items-center justify-center">
              <div className="relative h-48 w-48">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="13" />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="url(#healthGradient)"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray={healthCircumference}
                    strokeDashoffset={healthDashOffset}
                  />
                  <defs>
                    <linearGradient id="healthGradient" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="55%" stopColor="#86efac" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[42px] font-black leading-none">{toMarathiNumerals(healthScore)}/१००</span>
                  <span className="mt-1 text-[14px] font-black text-white/70">Farm Health</span>
                </div>
              </div>
            </div>
            <p className="mt-2 rounded-2xl bg-white/10 px-4 py-3 text-center text-[18px] font-black text-white">
              {stats.farmHealthScore.label}
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-[18px] font-black text-green-900 shadow-sm">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[18px] font-black text-red-900 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {overviewCards.map(([key, icon, label, type, tone]) => (
          <OverviewCard key={key} icon={icon} label={label} value={overview[key]} type={type} tone={tone} />
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">Growth Metrics</p>
          <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">या महिन्याची वाढ/घट तुलना</h2>
        </div>
        {stats.growth.metrics.map((metric) => (
          <GrowthCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">Charts</p>
          <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">दूध, उत्पन्न आणि गुणवत्ता trend</h2>
        </div>

        <ChartCard title="रोजचे दूध ट्रेंड" subtitle="या महिन्यातील रोजचे दूध" icon="🥛">
          {stats.trends.dailyMilk.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trends.dailyMilk} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={chartDate} tick={{ fontSize: 12, fontWeight: 800 }} />
                <YAxis tickFormatter={(value) => toMarathiNumerals(value)} width={44} tick={{ fontSize: 12, fontWeight: 800 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="totalMilk" stroke="#2563eb" fill="#bfdbfe" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="मासिक दूध ट्रेंड" subtitle="मागील ६ महिन्यांचे दूध" icon="📆">
          {stats.trends.monthlyMilk.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trends.monthlyMilk} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 800 }} />
                <YAxis tickFormatter={(value) => toMarathiNumerals(value)} width={52} tick={{ fontSize: 12, fontWeight: 800 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="उत्पन्न ट्रेंड" subtitle="मागील ६ महिन्यांचे उत्पन्न" icon="💰">
          {stats.trends.income.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trends.income} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 800 }} />
                <YAxis tickFormatter={(value) => toMarathiNumerals(value)} width={62} tick={{ fontSize: 12, fontWeight: 800 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChartCard title="फॅट ट्रेंड" subtitle="या महिन्यातील फॅट" icon="🧈">
            {stats.trends.fat.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trends.fat} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
                  <XAxis dataKey="day" tickFormatter={(value) => toMarathiNumerals(value)} tick={{ fontSize: 11, fontWeight: 800 }} />
                  <YAxis tickFormatter={(value) => toMarathiNumerals(value)} width={42} tick={{ fontSize: 12, fontWeight: 800 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="SNF ट्रेंड" subtitle="या महिन्यातील SNF" icon="🧪">
            {stats.trends.snf.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trends.snf} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
                  <XAxis dataKey="day" tickFormatter={(value) => toMarathiNumerals(value)} tick={{ fontSize: 11, fontWeight: 800 }} />
                  <YAxis tickFormatter={(value) => toMarathiNumerals(value)} width={42} tick={{ fontSize: 12, fontWeight: 800 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">Best Performance</p>
          <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">सर्वोत्तम कामगिरी</h2>
        </div>
        <BestCard title="🏆 सर्वाधिक दूध दिवस" item={stats.bestPerformance.highestMilkDay} tone="green" />
        <BestCard title="💰 सर्वाधिक उत्पन्न दिवस" item={stats.bestPerformance.highestIncomeDay} tone="blue" />
        <BestCard title="🧈 सर्वोत्तम फॅट दिवस" item={stats.bestPerformance.bestFatDay} tone="yellow" />
        <BestCard title="🧪 सर्वोत्तम SNF दिवस" item={stats.bestPerformance.bestSNFDay} tone="purple" />
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[14px] font-black uppercase tracking-wide text-emerald-700">Farm Health</p>
            <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">फार्म हेल्थ स्कोअर</h2>
          </div>
          <p className="rounded-full bg-green-50 px-4 py-2 text-[18px] font-black text-green-800 ring-1 ring-green-100">
            {toMarathiNumerals(healthScore)}/१००
          </p>
        </div>
        <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100 p-1">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-lime-400 to-green-600" style={{ width: `${healthScore}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="दूध सातत्य" value={`${formatNumber(stats.farmHealthScore.milkConsistency, 1)}%`} />
          <Metric label="फॅट सातत्य" value={`${formatNumber(stats.farmHealthScore.fatConsistency, 1)}%`} />
          <Metric label="नोंदी पूर्णता" value={`${formatNumber(stats.farmHealthScore.recordCompletion, 1)}%`} />
          <Metric label="डेटा गुणवत्ता" value={`${formatNumber(stats.farmHealthScore.dataQuality, 1)}%`} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-50 text-[28px] shadow-inner">🏁</span>
          <span>
            <p className="text-[14px] font-black uppercase tracking-wide text-yellow-700">Milestones</p>
            <h2 className="mt-1 text-[28px] font-black leading-tight text-slate-950">दूध टप्पे</h2>
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {stats.milestones.map((milestone) => (
            <div key={milestone.target} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[18px] font-black text-slate-950">{formatLitres(milestone.target)} लिटर</p>
                <p className={`rounded-full px-3 py-1 text-[13px] font-black ${milestone.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {milestone.completed ? "पूर्ण" : `${formatLitres(milestone.remaining)} बाकी`}
                </p>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-green-600" style={{ width: `${milestone.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[28px] shadow-sm">📤</span>
          <span>
            <h2 className="text-[26px] font-black leading-tight text-slate-950">आकडेवारी शेअर करा</h2>
            <p className="mt-1 text-[15px] font-bold text-slate-600">Image, PDF किंवा WhatsApp वर farm performance पाठवा.</p>
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button onClick={downloadShareImage} className="min-h-[56px] rounded-2xl bg-slate-900 px-4 text-[17px] font-black text-white shadow-sm active:scale-[0.98]">
            🖼️ Image Download
          </button>
          <button onClick={downloadPdf} disabled={busyAction === "pdf"} className="min-h-[56px] rounded-2xl bg-red-600 px-4 text-[17px] font-black text-white shadow-sm active:scale-[0.98] disabled:opacity-60">
            {busyAction === "pdf" ? "PDF तयार..." : "📄 PDF Report"}
          </button>
          <button onClick={shareToWhatsApp} className="min-h-[56px] rounded-2xl bg-green-600 px-4 text-[17px] font-black text-white shadow-sm active:scale-[0.98]">
            🟢 WhatsApp Share
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-[12px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-[18px] font-black text-slate-950">{value}</p>
    </div>
  );
}
