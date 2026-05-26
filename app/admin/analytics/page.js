"use client";

import { useEffect, useState } from "react";
import DistrictBarChart from "@/components/admin/Charts/DistrictBarChart";
import PlatformLineChart from "@/components/admin/Charts/PlatformLineChart";
import StatusPieChart from "@/components/admin/Charts/StatusPieChart";
import StatsCard from "@/components/admin/StatsCard";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/analytics", {
          cache: "no-store",
          headers: getSuperAdminAuthHeader()
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to load analytics");
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-[22px] font-extrabold text-slate-700">Loading analytics...</div>;
  if (error) return <div className="rounded-xl bg-red-50 p-6 text-[18px] font-bold text-red-800">{error}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[34px] font-extrabold text-slate-950">📈 Analytics</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">Platform-wide growth, engagement, and data quality</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Cows" value={Math.round(data.livestock.totalCows || 0)} subtext="Across platform" tone="green" icon="🐄" />
        <StatsCard title="Average Herd" value={(data.livestock.averageCowsPerFarm || 0).toFixed(1)} subtext="Cows per farm" tone="blue" icon="📊" />
        <StatsCard title="Milk This Week" value={data.engagement.farmsWithMilkThisWeek || 0} subtext="Farms active with milk" tone="yellow" icon="🥛" />
        <StatsCard title="Inactive Farms" value={data.engagement.inactiveFarms || 0} subtext="14+ days inactive" tone="red" icon="⚠️" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Signups over time">
          <PlatformLineChart data={data.growth || []} />
        </ChartCard>
        <ChartCard title="Trial vs Active Farms">
          <StatusPieChart data={data.statusDistribution || []} />
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Farms by District">
          <DistrictBarChart data={data.districtDistribution || []} />
        </ChartCard>
        <ChartCard title="Data Quality">
          <div className="grid gap-3">
            <QualityRow label="Incomplete profiles" value={data.dataQuality.incompleteProfiles} />
            <QualityRow label="No cows added" value={data.dataQuality.noCowsAdded} />
            <QualityRow label="No milk in 7 days" value={data.dataQuality.noMilkInSevenDays} />
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ListCard title="Most Active Farms" items={data.mostActiveFarms || []} />
        <ListCard title="Least Active Farms" items={data.leastActiveFarms || []} />
      </section>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[24px] font-extrabold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function QualityRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4 text-[18px] font-bold">
      <span>{label}</span>
      <span>{value || 0}</span>
    </div>
  );
}

function ListCard({ title, items }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[24px] font-extrabold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.map((farm) => (
          <div key={farm.id} className="rounded-lg bg-slate-50 p-3 text-[17px] font-bold">
            {farm.farm_name} <span className="text-slate-500">· {farm.last_activity_at ? new Date(farm.last_activity_at).toLocaleDateString() : "No activity"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
