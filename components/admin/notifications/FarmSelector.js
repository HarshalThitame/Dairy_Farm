"use client";

import { useEffect, useMemo, useState } from "react";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function FarmSelector({ value = [], onChange }) {
  const [farms, setFarms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/farms?limit=100&status=all&sortBy=newest", {
          cache: "no-store",
          headers: getSuperAdminAuthHeader()
        });
        const result = await response.json();
        if (response.ok) {
          setFarms(result.farms || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return farms;
    return farms.filter((farm) => `${farm.farm_name} ${farm.owner_name} ${farm.owner_mobile} ${farm.district_name}`.toLowerCase().includes(text));
  }, [farms, search]);

  function toggle(farmId) {
    onChange(value.includes(farmId) ? value.filter((id) => id !== farmId) : [...value, farmId]);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[17px] font-extrabold text-slate-800">Selected Farms ({value.length})</p>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search farms"
          className="min-h-[42px] rounded-lg border border-slate-300 px-3 text-[16px]"
        />
      </div>
      {loading ? <p className="text-[15px] font-bold text-slate-500">Loading farms...</p> : null}
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {visible.map((farm) => (
          <label key={farm.id} className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 text-[15px] ring-1 ring-slate-100">
            <input type="checkbox" checked={value.includes(farm.id)} onChange={() => toggle(farm.id)} className="mt-1" />
            <span>
              <span className="block font-extrabold text-slate-900">{farm.farm_name}</span>
              <span className="block font-semibold text-slate-500">{farm.owner_name} · {farm.district_name || "-"}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
