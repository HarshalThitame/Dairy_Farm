"use client";

import { useEffect, useMemo, useState } from "react";
import ActivityTimeline from "@/components/admin/ActivityTimeline";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function AdminActivityPage() {
  const [activity, setActivity] = useState([]);
  const [filters, setFilters] = useState({ action: "", farm_id: "", from_date: "", to_date: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const query = useMemo(() => new URLSearchParams(filters).toString(), [filters]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/activity?${query}`, {
          cache: "no-store",
          headers: getSuperAdminAuthHeader()
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to load activity");
        setActivity(result.activity || []);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-extrabold text-slate-950">📋 Activity Log</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">Audit trail for super-admin actions</p>
      </div>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input value={filters.action} onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} placeholder="Action" className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]" />
        <input value={filters.farm_id} onChange={(event) => setFilters((current) => ({ ...current, farm_id: event.target.value }))} placeholder="Farm ID" className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]" />
        <input type="date" value={filters.from_date} onChange={(event) => setFilters((current) => ({ ...current, from_date: event.target.value }))} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]" />
        <input type="date" value={filters.to_date} onChange={(event) => setFilters((current) => ({ ...current, to_date: event.target.value }))} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]" />
      </section>

      {error ? <div className="rounded-lg bg-red-50 p-4 text-[18px] font-bold text-red-800">{error}</div> : null}
      {loading ? <div className="text-[20px] font-extrabold text-slate-600">Loading activity...</div> : <ActivityTimeline items={activity} />}
    </div>
  );
}
