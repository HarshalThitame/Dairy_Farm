"use client";

import { useState } from "react";
import Link from "next/link";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function formatNumber(value, digits = 0) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(Number.isFinite(number) ? number : 0);
}

function formatCurrency(value) {
  return `₹${formatNumber(value, 0)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function relativeTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function statusMeta(farm = {}, subscription = {}) {
  if (!farm.is_active || subscription.status === "suspended") {
    return { label: "Suspended", className: "bg-red-100 text-red-800 ring-red-200" };
  }
  if (subscription.status === "trial") {
    return { label: "Trial", className: "bg-yellow-100 text-yellow-900 ring-yellow-200" };
  }
  if (subscription.status === "active") {
    return { label: "Active", className: "bg-green-100 text-green-800 ring-green-200" };
  }
  return { label: subscription.status || "Inactive", className: "bg-orange-100 text-orange-800 ring-orange-200" };
}

function healthColor(tone) {
  if (tone === "green") return "#16a34a";
  if (tone === "blue") return "#2563eb";
  if (tone === "yellow") return "#ca8a04";
  return "#dc2626";
}

function alertTone(priority) {
  if (priority === "critical") return "border-red-200 bg-red-50 text-red-900";
  if (priority === "warning") return "border-orange-200 bg-orange-50 text-orange-900";
  if (priority === "success") return "border-green-200 bg-green-50 text-green-900";
  return "border-slate-200 bg-slate-50 text-slate-800";
}

export default function FarmMonitoringDashboard({
  data,
  onFarmAction,
  onResetOwnerPin,
  saving = false,
  actionLoading = ""
}) {
  const [exportLoading, setExportLoading] = useState("");
  const farm = data?.farm || {};
  const stats = data?.stats || {};
  const analytics = data?.analytics || {};
  const subscription = analytics.subscription || {};
  const health = analytics.healthScore || {};
  const milk = analytics.milk || {};
  const financial = analytics.financial || {};
  const ocr = analytics.ocr || {};
  const ai = analytics.aiUsage || {};
  const devices = analytics.devices || {};
  const support = analytics.support || {};
  const dataQuality = analytics.dataQuality || {};
  const overview = analytics.overview || {};
  const status = statusMeta(farm, subscription);
  const farmId = String(farm.id || "");
  const warnings = analytics.warnings || [];

  async function downloadExport(type, filename) {
    if (!farmId) {
      window.alert("Farm id is not available.");
      return;
    }

    setExportLoading(type);
    try {
      const response = await fetch(`/api/admin/export?type=${type}&farm_id=${encodeURIComponent(farmId)}`, {
        headers: getSuperAdminAuthHeader()
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      link.href = url;
      link.download = match?.[1] || `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert(error.message || "Export failed");
    } finally {
      setExportLoading("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white shadow-xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <Link href="/admin/farms" className="text-[15px] font-black text-emerald-200 hover:underline">
              ← Back to farms
            </Link>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <h1 className="text-[38px] font-black leading-tight">{farm.farm_name || "Farm"}</h1>
              <span className={`rounded-full px-3 py-1 text-[14px] font-black ring-1 ${status.className}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-[18px] font-bold text-emerald-100">
              {farm.owner_name || "-"} · {farm.owner_mobile || "-"} · {farm.village_name || "-"} · {farm.district_name || "-"}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <HeroMetric label="Farm ID" value={overview.farmCode || farm.id || "-"} compact />
              <HeroMetric label="Last Active" value={relativeTime(overview.lastActiveAt)} />
              <HeroMetric label="Last Login" value={data?.stats?.lastLogin?.date ? relativeTime(data.stats.lastLogin.date) : "-"} />
              <HeroMetric label="Account Age" value={`${formatNumber(overview.accountAgeDays || 0)} days`} />
              <HeroMetric label="Registered" value={formatDate(farm.created_at)} />
              <HeroMetric label="Created By" value={overview.createdBy || "-"} compact />
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-black uppercase text-emerald-200">Farm Health Score</p>
                <p className="mt-2 text-[48px] font-black leading-none">{health.score || 0}<span className="text-[22px] text-emerald-200">/100</span></p>
                <p className="mt-2 text-[18px] font-black text-white">{health.label || "Not available"}</p>
              </div>
              <ScoreRing score={health.score || 0} tone={health.tone} />
            </div>
            <p className="mt-4 rounded-2xl bg-black/20 p-3 text-[15px] font-semibold leading-relaxed text-emerald-50">
              {analytics.summary || "Farm summary is not available yet."}
            </p>
          </div>
        </div>
      </section>

      {warnings.length ? (
        <section className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-950">
          <h2 className="text-[18px] font-black">Some dashboard sections could not load fully</h2>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {warnings.slice(0, 6).map((warning, index) => (
              <p key={`${warning.section}-${index}`} className="rounded-xl bg-white/70 p-3 text-[14px] font-bold">
                {warning.section}: {warning.message}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Cows" value={stats.cowCount || 0} icon="🐄" tone="green" sub={`${stats.pregnantCowCount || 0} pregnant`} />
        <MetricCard title="Milk Records" value={stats.milkCount || 0} icon="🥛" tone="blue" sub={milk.lastMilkEntry?.date || "No last entry"} />
        <MetricCard title="Slip Uploads" value={stats.totalSlipUploads || 0} icon="📄" tone="purple" sub={`${stats.ocrSuccessRate || 0}% OCR success`} />
        <MetricCard title="Users" value={stats.userCount || 0} icon="👥" tone="slate" sub={`${stats.activeUserCount || 0} active`} />
      </section>

      <CollapsibleSection title="Subscription Center" subtitle="Plan, expiry, payment and renewal risk">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <InfoGrid rows={[
              ["Plan", subscription.planName || "-"],
              ["Plan Type", subscription.planType || "-"],
              ["Start Date", formatDate(subscription.startDate)],
              ["Expiry Date", formatDate(subscription.expiryDate)],
              ["Days Remaining", subscription.daysRemaining === null ? "-" : `${subscription.daysRemaining} days`],
              ["Payment Status", subscription.paymentStatus || "-"],
              ["Last Payment", formatDate(subscription.lastPaymentDate)],
              ["Next Renewal", formatDate(subscription.nextRenewalDate)],
              ["Trial Status", subscription.trialStatus || "-"]
            ]} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-black text-slate-700">Expiry Progress</p>
              <p className="text-[17px] font-black text-slate-950">{subscription.daysRemaining === null ? "-" : `${subscription.daysRemaining} days left`}</p>
            </div>
            <ProgressBar value={subscription.daysRemaining === null ? 0 : Math.max(0, Math.min(100, (subscription.daysRemaining / 365) * 100))} tone={subscription.daysRemaining !== null && subscription.daysRemaining <= 7 ? "red" : "green"} />
            {subscription.daysRemaining !== null && subscription.daysRemaining <= 7 ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-[16px] font-bold text-red-800">
                Subscription/trial expires soon. Admin action recommended.
              </div>
            ) : null}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Milk Analytics" subtitle="Production trend, quality and last record">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric label="Today" value={`${formatNumber(milk.todayMilk, 2)} L`} />
          <MiniMetric label="Yesterday" value={`${formatNumber(milk.yesterdayMilk, 2)} L`} />
          <MiniMetric label="This Month" value={`${formatNumber(milk.monthlyMilk, 2)} L`} />
          <MiniMetric label="Average / Day" value={`${formatNumber(milk.averageDailyMilk, 2)} L`} />
          <MiniMetric label="Highest Day" value={milk.highestProductionDay ? `${formatNumber(milk.highestProductionDay.totalMilk, 2)} L` : "-"} sub={milk.highestProductionDay?.date} />
          <MiniMetric label="Lowest Day" value={milk.lowestProductionDay ? `${formatNumber(milk.lowestProductionDay.totalMilk, 2)} L` : "-"} sub={milk.lowestProductionDay?.date} />
          <MiniMetric label="Average Fat" value={`${formatNumber(milk.averageFat, 2)}%`} />
          <MiniMetric label="Average SNF" value={`${formatNumber(milk.averageSnf, 2)}%`} />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ChartCard title="30 Day Milk Trend">
            <AreaTrendChart data={milk.trend || []} dataKey="milk" stroke="#2563eb" unit="L" />
          </ChartCard>
          <ChartCard title="Monthly Milk / Income Trend">
            <ComboBarChart data={milk.monthlyTrend || []} />
          </ChartCard>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Financial Snapshot" subtitle="Income, expenses and profit health">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="This Month Income" value={formatCurrency(financial.thisMonthIncome)} icon="💰" tone="green" />
          <MetricCard title="This Month Expenses" value={formatCurrency(financial.thisMonthExpenses)} icon="💸" tone="red" />
          <MetricCard title="Net Profit" value={formatCurrency(financial.netProfit)} icon="📈" tone={financial.netProfit >= 0 ? "blue" : "red"} />
          <MetricCard title="Profit Margin" value={`${formatNumber(financial.profitMargin, 1)}%`} icon="%" tone="slate" />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <ChartCard title="Income / Expense / Profit">
            <FinancialTrendChart data={financial.trend || []} />
          </ChartCard>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-[20px] font-black text-slate-950">Expense Categories</h3>
            <div className="mt-4 space-y-3">
              {Object.entries(financial.expenseCategories || {}).length ? Object.entries(financial.expenseCategories).map(([category, amount]) => (
                <div key={category}>
                  <div className="flex justify-between text-[15px] font-bold text-slate-700">
                    <span>{category}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                  <ProgressBar value={financial.thisMonthExpenses ? (amount / financial.thisMonthExpenses) * 100 : 0} tone="orange" />
                </div>
              )) : <EmptyText text="No expense data for this month." />}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <CollapsibleSection title="OCR & Slip Analytics" subtitle="Slip uploads and OCR success quality" defaultOpen>
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniMetric label="Total Slips" value={ocr.totalUploads || 0} />
            <MiniMetric label="Successful OCR" value={ocr.successfulReads || 0} />
            <MiniMetric label="Failed OCR" value={ocr.failedReads || 0} />
            <MiniMetric label="Avg Accuracy" value={`${formatNumber(ocr.averageAccuracy, 0)}%`} />
          </div>
          <ChartCard title="OCR Status" compact>
            <OcrPieChart ocr={ocr} />
          </ChartCard>
          <InfoGrid rows={[
            ["Last Uploaded", formatDateTime(ocr.lastUploadedSlip?.created_at)],
            ["Most Active Month", ocr.mostActiveMonth ? `${ocr.mostActiveMonth[0]} (${ocr.mostActiveMonth[1]})` : "-"],
            ["Failure Rate", `${formatNumber(ocr.failureRate, 0)}%`]
          ]} />
        </CollapsibleSection>

        <CollapsibleSection title="AI Usage Analytics" subtitle="AI assistant adoption and support usage" defaultOpen>
          <div className="grid gap-4 sm:grid-cols-2">
            <MiniMetric label="Total Queries" value={ai.totalQueries || 0} />
            <MiniMetric label="This Month" value={ai.queriesThisMonth || 0} />
            <MiniMetric label="Avg Response" value={`${formatNumber(ai.averageResponseTimeMs || 0, 0)} ms`} />
            <MiniMetric label="Last Usage" value={relativeTime(ai.lastUsage)} />
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-[20px] font-black text-slate-950">Most Recent Questions</h3>
            <div className="mt-3 space-y-2">
              {(ai.mostAskedQuestions || []).length ? ai.mostAskedQuestions.map((question, index) => (
                <p key={`${question}-${index}`} className="rounded-xl bg-slate-50 p-3 text-[15px] font-bold text-slate-700">{question}</p>
              )) : <EmptyText text="No AI questions yet." />}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <CollapsibleSection title="Alerts & Risk Monitoring" subtitle="Priority based operational warnings" defaultOpen>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(analytics.alerts || []).map((alert, index) => (
            <div key={`${alert.title}-${index}`} className={`rounded-2xl border p-4 ${alertTone(alert.priority)}`}>
              <p className="text-[18px] font-black">{alert.title}</p>
              <p className="mt-1 text-[15px] font-bold opacity-80">{alert.message}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Users, Devices & Support" subtitle="User activity, sessions, device info and tickets">
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-[20px] font-black text-slate-950">User Summary</h3>
            <InfoGrid rows={[
              ["Total Users", data?.users?.length || 0],
              ["Active Users", data?.stats?.activeUserCount || 0],
              ["Inactive Users", data?.stats?.inactiveUserCount || 0],
              ["Owner", data?.users?.find((user) => user.is_farm_owner)?.name || "-"]
            ]} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-[20px] font-black text-slate-950">Last Device</h3>
            <InfoGrid rows={[
              ["Device", devices.lastLoginDevice?.device_name || devices.latestSession?.device_name || "-"],
              ["OS", devices.lastLoginDevice?.os || devices.latestSession?.os || "-"],
              ["Browser", devices.lastLoginDevice?.browser || devices.latestSession?.browser || "-"],
              ["IP", devices.lastLoginDevice?.ip_address || devices.latestSession?.ip_address || "-"],
              ["Last Sync", formatDateTime(devices.lastSyncTime)]
            ]} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-[20px] font-black text-slate-950">Support History</h3>
            <InfoGrid rows={[
              ["Open Tickets", support.openTickets || 0],
              ["Critical Tickets", support.criticalTickets || 0],
              ["Recent Ticket", support.tickets?.[0]?.subject || "-"],
              ["Updated", formatDateTime(support.tickets?.[0]?.updated_at)]
            ]} />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Data Quality Center" subtitle="Profile completeness and record consistency">
        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-[15px] font-black uppercase text-slate-500">Data Quality Score</p>
            <p className="mt-3 text-[52px] font-black text-slate-950">{dataQuality.score || 0}%</p>
            <ProgressBar value={dataQuality.score || 0} tone={(dataQuality.score || 0) >= 80 ? "green" : "orange"} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-[20px] font-black text-slate-950">Recommendations</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(dataQuality.recommendations || []).length ? dataQuality.recommendations.map((item) => (
                <div key={item} className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-[15px] font-bold text-orange-900">
                  {item}
                </div>
              )) : <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-[15px] font-bold text-green-900">No major data gaps detected.</div>}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Quick Actions" subtitle="Support actions for this farm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionButton label="Extend Trial" loading={actionLoading === "extend_trial"} disabled={saving} onClick={() => onFarmAction?.("extend_trial")} />
          <ActionButton label="Activate Farm" loading={actionLoading === "activate"} disabled={saving} onClick={() => onFarmAction?.("activate")} tone="green" />
          <ActionButton label={farm.is_active ? "Suspend Farm" : "Unsuspend Farm"} loading={["suspend", "unsuspend"].includes(actionLoading)} disabled={saving} onClick={() => onFarmAction?.(farm.is_active ? "suspend" : "unsuspend")} tone={farm.is_active ? "red" : "slate"} />
          <ActionButton label="Reset Owner PIN" onClick={onResetOwnerPin} tone="slate" />
          <Link href="/admin/notification-center/create" className="flex min-h-[54px] items-center justify-center rounded-xl bg-blue-600 px-4 text-[16px] font-black text-white">
            Send Notification
          </Link>
          <Link href="/admin/activity" className="flex min-h-[54px] items-center justify-center rounded-xl bg-slate-900 px-4 text-[16px] font-black text-white">
            Activity Logs
          </Link>
          <Link href="/admin/support/tickets" className="flex min-h-[54px] items-center justify-center rounded-xl bg-purple-600 px-4 text-[16px] font-black text-white">
            Support Tickets
          </Link>
          <Link href="/admin/settings" className="flex min-h-[54px] items-center justify-center rounded-xl bg-emerald-600 px-4 text-[16px] font-black text-white">
            Admin Settings
          </Link>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Export Center" subtitle="Download farm-specific data for support and audits" defaultOpen={false}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ExportButton
            label="Farm Details CSV"
            loading={exportLoading === "farms"}
            onClick={() => downloadExport("farms", "farm-details")}
          />
          <ExportButton
            label="Users CSV"
            loading={exportLoading === "users"}
            onClick={() => downloadExport("users", "farm-users")}
          />
          <ExportButton
            label="Cows CSV"
            loading={exportLoading === "cows"}
            onClick={() => downloadExport("cows", "farm-cows")}
          />
          <ExportButton
            label="Milk Records CSV"
            loading={exportLoading === "milk"}
            onClick={() => downloadExport("milk", "farm-milk-records")}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}

function HeroMetric({ label, value, compact = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <p className="text-[13px] font-black uppercase text-emerald-200">{label}</p>
      <p className={`mt-2 font-black text-white ${compact ? "break-all text-[14px]" : "text-[22px]"}`}>{value}</p>
    </div>
  );
}

function CollapsibleSection({ title, subtitle, children, defaultOpen = true }) {
  return (
    <details open={defaultOpen} className="group rounded-3xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-[24px] font-black text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-[15px] font-bold text-slate-500">{subtitle}</p> : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[16px] font-black text-slate-700 group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-slate-100 p-5">{children}</div>
    </details>
  );
}

function MetricCard({ title, value, sub, icon, tone = "slate" }) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    red: "border-red-200 bg-red-50 text-red-900",
    purple: "border-purple-200 bg-purple-50 text-purple-900",
    slate: "border-slate-200 bg-white text-slate-950"
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-black uppercase opacity-70">{title}</p>
          <p className="mt-3 text-[32px] font-black leading-none">{value}</p>
          {sub ? <p className="mt-3 text-[14px] font-bold opacity-70">{sub}</p> : null}
        </div>
        <span className="text-[34px]">{icon}</span>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[13px] font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-[24px] font-black text-slate-950">{value}</p>
      {sub ? <p className="mt-1 text-[13px] font-bold text-slate-500">{sub}</p> : null}
    </div>
  );
}

function InfoGrid({ rows }) {
  return (
    <div className="mt-4 divide-y divide-slate-100">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-2 text-[15px] sm:grid-cols-[150px_1fr] sm:gap-3">
          <span className="font-black text-slate-500">{label}</span>
          <span className="min-w-0 break-words font-bold text-slate-950">{value || "-"}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, tone = "green" }) {
  const colors = {
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    blue: "bg-blue-500"
  };
  return (
    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${colors[tone] || colors.green}`} style={{ width: `${Math.max(0, Math.min(100, Number(value || 0)))}%` }} />
    </div>
  );
}

function ScoreRing({ score, tone }) {
  const value = Math.max(0, Math.min(100, Number(score || 0)));
  const color = healthColor(tone);
  return (
    <div
      className="grid h-28 w-28 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${value * 3.6}deg, rgba(255,255,255,0.18) 0deg)` }}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-950 text-[24px] font-black text-white">
        {value}
      </div>
    </div>
  );
}

function ChartCard({ title, children, compact = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-[20px] font-black text-slate-950">{title}</h3>
      <div className={compact ? "mt-4 h-[220px]" : "mt-4 h-[300px]"}>{children}</div>
    </div>
  );
}

function AreaTrendChart({ data, dataKey, stroke, unit }) {
  if (!data?.length) return <EmptyText text="No chart data available." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [`${formatNumber(value, 2)} ${unit}`, dataKey]} />
        <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={stroke} fillOpacity={0.14} strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ComboBarChart({ data }) {
  if (!data?.length) return <EmptyText text="No monthly data available." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="milk" fill="#2563eb" name="Milk L" radius={[6, 6, 0, 0]} />
        <Bar dataKey="income" fill="#16a34a" name="Income" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function FinancialTrendChart({ data }) {
  if (!data?.length) return <EmptyText text="No financial data available." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Area type="monotone" dataKey="income" stroke="#16a34a" fill="#16a34a" fillOpacity={0.12} strokeWidth={3} />
        <Area type="monotone" dataKey="expenses" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1} strokeWidth={3} />
        <Area type="monotone" dataKey="profit" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function OcrPieChart({ ocr }) {
  const data = [
    { name: "Success", value: Number(ocr.successfulReads || 0), color: "#16a34a" },
    { name: "Failed", value: Number(ocr.failedReads || 0), color: "#dc2626" },
    { name: "Pending", value: Number(ocr.pendingReads || 0), color: "#ca8a04" }
  ].filter((item) => item.value > 0);
  if (!data.length) return <EmptyText text="No OCR upload data yet." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
          {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ActionButton({ label, onClick, loading, disabled, tone = "yellow" }) {
  const colors = {
    yellow: "bg-yellow-600",
    green: "bg-green-600",
    red: "bg-red-600",
    slate: "bg-slate-900"
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`min-h-[54px] rounded-xl px-4 text-[16px] font-black text-white disabled:bg-slate-300 ${colors[tone] || colors.yellow}`}
    >
      {loading ? "Working..." : label}
    </button>
  );
}

function ExportButton({ label, onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="min-h-[54px] rounded-xl border border-slate-200 bg-white px-4 text-[16px] font-black text-slate-950 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait disabled:bg-slate-100 disabled:text-slate-400"
    >
      {loading ? "Exporting..." : label}
    </button>
  );
}

function EmptyText({ text }) {
  return <div className="grid h-full min-h-[120px] place-items-center rounded-2xl bg-slate-50 p-5 text-center text-[16px] font-bold text-slate-500">{text}</div>;
}
