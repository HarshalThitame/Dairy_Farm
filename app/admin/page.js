"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PlatformLineChart from "@/components/admin/Charts/PlatformLineChart";
import StatsCard from "@/components/admin/StatsCard";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats(refresh = false) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/stats", {
        method: refresh ? "POST" : "GET",
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load dashboard");
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !data) {
    return <div className="text-[22px] font-extrabold text-slate-700">Loading dashboard...</div>;
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-[18px] font-bold text-red-800">
        {error}
      </div>
    );
  }

  const stats = data?.stats || {};
  const alerts = data?.alerts || {};

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold text-slate-950">📊 Dashboard</h1>
          <p className="mt-1 text-[18px] font-semibold text-slate-500">Platform overview and alerts</p>
        </div>
        <button
          type="button"
          onClick={() => loadStats(true)}
          className="min-h-[52px] rounded-lg bg-slate-900 px-5 text-[18px] font-extrabold text-white"
        >
          🔄 Refresh Stats
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Farms" value={stats.totalFarms || 0} subtext={`+${stats.newSignupsToday || 0} today`} tone="green" icon="🏠" />
        <StatsCard title="Active Subscriptions" value={stats.activeSubscriptions || 0} subtext={`${stats.trialFarms || 0} on trial`} tone="blue" icon="✅" />
        <StatsCard title="Total Cows" value={stats.totalCows || 0} subtext="Across all farms" tone="yellow" icon="🐄" />
        <StatsCard title="Total Users" value={stats.totalUsers || 0} subtext="Owners + workers" tone="slate" icon="👥" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Platform Activity</h2>
          <p className="text-[16px] font-semibold text-slate-500">Last 30 days</p>
          <PlatformLineChart data={data?.activity || []} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Alerts</h2>
          <div className="mt-4 space-y-3">
            <AlertList title="Trials expiring in 3 days" items={alerts.expiringTrials} tone="yellow" />
            <AlertList title="No activity in 14 days" items={alerts.inactiveFarms} tone="red" />
            <AlertList title="Suspended farms" items={alerts.suspendedFarms} tone="slate" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[24px] font-extrabold text-slate-950">Recent Farm Signups</h2>
            <p className="text-[16px] font-semibold text-slate-500">Newest farms on the platform</p>
          </div>
          <Link href="/admin/farms" className="rounded-lg bg-green-600 px-4 py-3 text-[17px] font-bold text-white">
            View All Farms
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead className="bg-slate-50 text-[14px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Farm Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Cows</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[17px]">
              {(data?.recentSignups || []).map((farm) => (
                <tr key={farm.id}>
                  <td className="px-4 py-4 font-extrabold">{farm.farm_name}</td>
                  <td className="px-4 py-4">{farm.owner_name}</td>
                  <td className="px-4 py-4">{farm.owner_mobile_masked || farm.owner_mobile}</td>
                  <td className="px-4 py-4">{farm.district_name || "-"}</td>
                  <td className="px-4 py-4">{farm.total_cows || 0}</td>
                  <td className="px-4 py-4">{farm.is_active ? farm.subscription_status : "suspended"}</td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/farms/${encodeURIComponent(String(farm.id || ""))}`} className="font-bold text-green-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AlertList({ title, items = [], tone }) {
  const colors = {
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-900",
    red: "border-red-200 bg-red-50 text-red-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700"
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[tone] || colors.slate}`}>
      <div className="text-[17px] font-extrabold">{title}</div>
      {items.length ? (
        <div className="mt-2 space-y-2">
          {items.slice(0, 4).map((farm) => (
            <Link key={farm.id} href={`/admin/farms/${encodeURIComponent(String(farm.id || ""))}`} className="block text-[15px] font-bold hover:underline">
              {farm.farm_name} - {farm.owner_name}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-[15px] font-semibold opacity-75">No alerts</div>
      )}
    </div>
  );
}
