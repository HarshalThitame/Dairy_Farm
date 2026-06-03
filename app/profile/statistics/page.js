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
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatLitres, formatMarathiDate, toMarathiNumerals } from "@/lib/marathiUtils";

const TOKEN_KEY = "goshala_token";

const overviewCards = [
  ["totalMilk", "🥛", "एकूण दूध", "milk"],
  ["totalIncome", "💰", "एकूण उत्पन्न", "currency"],
  ["averageFat", "🧈", "सरासरी फॅट", "percent"],
  ["averageSNF", "🧪", "सरासरी SNF", "number"],
  ["totalSlips", "📷", "एकूण स्लिप", "number"],
  ["aiQuestions", "🤖", "AI प्रश्न", "number"],
  ["animalsCount", "🐄", "जनावरे", "number"]
];

function getToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
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
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-[14px] font-bold shadow-soft">
      <p className="text-slate-700">{toMarathiNumerals(label)}</p>
      <p className="text-slate-950">{formatNumber(item.value, 2)}</p>
    </div>
  );
}

function OverviewCard({ icon, label, value, type }) {
  return (
    <article className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[34px]">{icon}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-black text-slate-500">LIVE</span>
      </div>
      <p className="mt-3 text-[14px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-[24px] font-black leading-tight text-slate-950">{formatValue(value, type)}</p>
    </article>
  );
}

function GrowthCard({ metric }) {
  const positive = metric.direction === "increase";
  const negative = metric.direction === "decrease";
  return (
    <article className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft">
      <p className="text-[16px] font-black text-slate-600">{metric.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[22px] font-black text-slate-950">
            {metric.unit === "₹" ? formatCurrency(metric.currentValue) : `${formatNumber(metric.currentValue, 2)} ${metric.unit || ""}`}
          </p>
          <p className="mt-1 text-[13px] font-bold text-slate-500">
            मागील: {metric.unit === "₹" ? formatCurrency(metric.previousValue) : `${formatNumber(metric.previousValue, 2)} ${metric.unit || ""}`}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[13px] font-black ${
          positive ? "bg-green-100 text-green-800" : negative ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"
        }`}>
          {positive ? "▲" : negative ? "▼" : "•"} {trendText(metric)}
        </span>
      </div>
    </article>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft">
      <h2 className="text-[22px] font-black text-slate-950">{title}</h2>
      {subtitle ? <p className="mt-1 text-[14px] font-bold text-slate-500">{subtitle}</p> : null}
      <div className="mt-4 h-[250px]">{children}</div>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-center text-[16px] font-bold text-slate-500">
      या कालावधीसाठी chart data उपलब्ध नाही.
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
    <article className={`rounded-2xl border bg-gradient-to-br p-4 shadow-soft ${toneClass}`}>
      <p className="text-[16px] font-black">{title}</p>
      {item ? (
        <>
          <p className="mt-2 text-[24px] font-black text-slate-950">
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

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="📊 वैयक्तिक आकडेवारी" subtitle="शेतकरी performance, dairy growth आणि quality analytics." />

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

      <section className="rounded-3xl border border-white/80 bg-gradient-to-br from-emerald-700 via-green-600 to-sky-700 p-5 text-white shadow-soft">
        <p className="text-[17px] font-black text-white/80">AI Summary</p>
        <h1 className="mt-2 text-[25px] font-black leading-tight">{stats.aiSummary}</h1>
        <div className="mt-4 rounded-2xl bg-white/15 p-4">
          <p className="text-[15px] font-black text-white/80">Farm Health Score</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-[54px] font-black leading-none">{toMarathiNumerals(stats.farmHealthScore.score)}/१००</p>
            <p className="rounded-full bg-white/20 px-3 py-1 text-[15px] font-black">{stats.farmHealthScore.label}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {overviewCards.map(([key, icon, label, type]) => (
          <OverviewCard key={key} icon={icon} label={label} value={overview[key]} type={type} />
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-[24px] font-black text-slate-950">वाढ/घट तुलना</h2>
        {stats.growth.metrics.map((metric) => (
          <GrowthCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4">
        <ChartCard title="रोजचे दूध ट्रेंड" subtitle="या महिन्यातील रोजचे दूध">
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

        <ChartCard title="मासिक दूध ट्रेंड" subtitle="मागील ६ महिन्यांचे दूध">
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

        <ChartCard title="उत्पन्न ट्रेंड" subtitle="मागील ६ महिन्यांचे उत्पन्न">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trends.income} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 800 }} />
              <YAxis tickFormatter={(value) => toMarathiNumerals(value)} width={62} tick={{ fontSize: 12, fontWeight: 800 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChartCard title="फॅट ट्रेंड" subtitle="या महिन्यातील फॅट">
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

          <ChartCard title="SNF ट्रेंड" subtitle="या महिन्यातील SNF">
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
        <h2 className="sm:col-span-2 text-[24px] font-black text-slate-950">सर्वोत्तम कामगिरी</h2>
        <BestCard title="🏆 सर्वाधिक दूध दिवस" item={stats.bestPerformance.highestMilkDay} tone="green" />
        <BestCard title="💰 सर्वाधिक उत्पन्न दिवस" item={stats.bestPerformance.highestIncomeDay} tone="blue" />
        <BestCard title="🧈 सर्वोत्तम फॅट दिवस" item={stats.bestPerformance.bestFatDay} tone="yellow" />
        <BestCard title="🧪 सर्वोत्तम SNF दिवस" item={stats.bestPerformance.bestSNFDay} tone="purple" />
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">फार्म हेल्थ स्कोअर</h2>
        <div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-600" style={{ width: `${Math.min(100, stats.farmHealthScore.score)}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="दूध सातत्य" value={`${formatNumber(stats.farmHealthScore.milkConsistency, 1)}%`} />
          <Metric label="फॅट सातत्य" value={`${formatNumber(stats.farmHealthScore.fatConsistency, 1)}%`} />
          <Metric label="नोंदी पूर्णता" value={`${formatNumber(stats.farmHealthScore.recordCompletion, 1)}%`} />
          <Metric label="डेटा गुणवत्ता" value={`${formatNumber(stats.farmHealthScore.dataQuality, 1)}%`} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">दूध टप्पे</h2>
        <div className="mt-4 grid gap-3">
          {stats.milestones.map((milestone) => (
            <div key={milestone.target} className="rounded-xl bg-slate-50 p-4">
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

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <h2 className="text-[24px] font-black text-slate-950">आकडेवारी शेअर करा</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button onClick={downloadShareImage} className="min-h-[54px] rounded-xl bg-slate-900 px-4 text-[17px] font-black text-white">
            🖼️ Image Download
          </button>
          <button onClick={downloadPdf} disabled={busyAction === "pdf"} className="min-h-[54px] rounded-xl bg-red-600 px-4 text-[17px] font-black text-white disabled:opacity-60">
            {busyAction === "pdf" ? "PDF तयार..." : "📄 PDF Report"}
          </button>
          <button onClick={shareToWhatsApp} className="min-h-[54px] rounded-xl bg-green-600 px-4 text-[17px] font-black text-white">
            🟢 WhatsApp Share
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[12px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-[18px] font-black text-slate-950">{value}</p>
    </div>
  );
}
