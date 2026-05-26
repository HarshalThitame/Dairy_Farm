"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FarmsTable from "@/components/admin/FarmsTable";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

const districts = ["all", "पुणे", "मुंबई", "नाशिक", "औरंगाबाद", "नागपूर", "सोलापूर", "सातारा", "सांगली", "कोल्हापूर", "अहमदनगर"];

export default function AdminFarmsPage() {
  const [farms, setFarms] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ status: "all", district: "all", sortBy: "newest", search: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => new URLSearchParams({
    status: filters.status,
    district: filters.district,
    sortBy: filters.sortBy,
    search: filters.search,
    page: String(filters.page),
    limit: "50"
  }).toString(), [filters]);

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/farms?${query}`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load farms");
      setFarms(result.farms || []);
      setMeta({ total: result.total || 0, page: result.page || 1, pages: result.pages || 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  async function handleSuspend(farm) {
    const reason = farm.is_active ? window.prompt("Suspension reason", "Support review") : "";
    if (farm.is_active && reason === null) return;

    const response = await fetch(`/api/admin/farms/${farm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
      body: JSON.stringify({ action: farm.is_active ? "suspend" : "unsuspend", reason })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      window.alert(result.error || "Action failed");
      return;
    }
    loadFarms();
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold text-slate-950">🏠 All Farms</h1>
          <p className="mt-1 text-[18px] font-semibold text-slate-500">{meta.total} farms</p>
        </div>
        <a
          href={`/api/admin/farms?${query}&export=csv`}
          className="min-h-[52px] rounded-lg bg-green-600 px-5 py-3 text-[18px] font-extrabold text-white"
        >
          Export CSV
        </a>
      </div>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          placeholder="Search farm, owner, mobile"
          className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px] md:col-span-2"
        />
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]">
          <option value="all">All statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={filters.district} onChange={(event) => updateFilter("district", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]">
          {districts.map((district) => <option key={district} value={district}>{district === "all" ? "All districts" : district}</option>)}
        </select>
        <select value={filters.sortBy} onChange={(event) => updateFilter("sortBy", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_cows">Most Cows</option>
          <option value="least_active">Least Active</option>
        </select>
      </section>

      {error ? <div className="rounded-lg bg-red-50 p-4 text-[18px] font-bold text-red-800">{error}</div> : null}
      {loading ? <div className="text-[20px] font-extrabold text-slate-600">Loading farms...</div> : <FarmsTable farms={farms} onSuspend={handleSuspend} />}

      <div className="flex items-center justify-between">
        <button disabled={meta.page <= 1} onClick={() => updateFilter("page", meta.page - 1)} className="min-h-[52px] rounded-lg bg-slate-900 px-5 text-[18px] font-bold text-white disabled:bg-slate-300">
          Previous
        </button>
        <div className="text-[18px] font-extrabold">Page {meta.page} of {meta.pages}</div>
        <button disabled={meta.page >= meta.pages} onClick={() => updateFilter("page", meta.page + 1)} className="min-h-[52px] rounded-lg bg-slate-900 px-5 text-[18px] font-bold text-white disabled:bg-slate-300">
          Next
        </button>
      </div>
    </div>
  );
}
