"use client";

import { useEffect, useMemo, useState } from "react";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";
import DistrictSelector from "@/components/admin/notifications/DistrictSelector";
import FarmSelector from "@/components/admin/notifications/FarmSelector";

const audienceOptions = [
  ["all_farms", "All Active Farms"],
  ["selected_farms", "Selected Farms"],
  ["districts", "Farms by District"],
  ["trial_farms", "Trial Farms"],
  ["active_subscriptions", "Active Subscribers"],
  ["expired_subscriptions", "Expired Farms"],
  ["suspended_farms", "Suspended Farms"],
  ["specific_users", "Specific Users"],
  ["owners_only", "Owners Only"],
  ["workers_only", "Workers Only"]
];

function UserSelector({ value = [], onChange }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/users?role=all", {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (response.ok) {
        setUsers(result.users || []);
      }
    }
    load();
  }, []);

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return users;
    return users.filter((user) => `${user.name} ${user.mobile} ${user.farms?.farm_name}`.toLowerCase().includes(text));
  }, [search, users]);

  function toggle(userId) {
    onChange(value.includes(userId) ? value.filter((id) => id !== userId) : [...value, userId]);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[17px] font-extrabold text-slate-800">Selected Users ({value.length})</p>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" className="min-h-[42px] rounded-lg border border-slate-300 px-3 text-[16px]" />
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {visible.map((user) => (
          <label key={user.id} className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 text-[15px] ring-1 ring-slate-100">
            <input type="checkbox" checked={value.includes(user.id)} onChange={() => toggle(user.id)} className="mt-1" />
            <span>
              <span className="block font-extrabold text-slate-900">{user.name}</span>
              <span className="block font-semibold text-slate-500">{user.farms?.farm_name || "-"} · {user.is_farm_owner ? "Owner" : user.role}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[15px] font-bold ring-1 ring-slate-100">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export default function AudienceSelector({ form, update }) {
  const filters = form.filters || {};

  function updateFilters(key, value) {
    update("filters", { ...filters, [key]: value });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[24px] font-extrabold text-slate-950">Target Audience</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-[16px] font-bold text-slate-700">
          Audience
          <select value={form.targetAudience} onChange={(event) => update("targetAudience", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
            {audienceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-4">
        {form.targetAudience === "selected_farms" ? <FarmSelector value={form.farmIds} onChange={(next) => update("farmIds", next)} /> : null}
        {form.targetAudience === "districts" ? <DistrictSelector value={form.districts} onChange={(next) => update("districts", next)} /> : null}
        {form.targetAudience === "specific_users" ? <UserSelector value={form.userIds} onChange={(next) => update("userIds", next)} /> : null}
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-[18px] font-extrabold text-slate-900">Advanced Filters</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="grid gap-1 rounded-lg bg-white p-3 text-[15px] font-bold ring-1 ring-slate-100">
            Cow count greater than
            <input value={filters.cowCountGt || ""} onChange={(event) => updateFilters("cowCountGt", event.target.value)} type="number" className="min-h-[42px] rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="grid gap-1 rounded-lg bg-white p-3 text-[15px] font-bold ring-1 ring-slate-100">
            Cow count less than
            <input value={filters.cowCountLt || ""} onChange={(event) => updateFilters("cowCountLt", event.target.value)} type="number" className="min-h-[42px] rounded-lg border border-slate-300 px-3" />
          </label>
          <FilterCheckbox label="Milk entries in last 7 days" checked={filters.milkEntriesLast7Days} onChange={(value) => updateFilters("milkEntriesLast7Days", value)} />
          <FilterCheckbox label="Inactive for 14 days" checked={filters.inactive14Days} onChange={(value) => updateFilters("inactive14Days", value)} />
          <FilterCheckbox label="No milk entry in 30 days" checked={filters.noMilkEntry30Days} onChange={(value) => updateFilters("noMilkEntry30Days", value)} />
          <FilterCheckbox label="Subscription expiring soon" checked={filters.subscriptionExpiringSoon} onChange={(value) => updateFilters("subscriptionExpiringSoon", value)} />
          <FilterCheckbox label="AI users" checked={filters.aiUsers} onChange={(value) => updateFilters("aiUsers", value)} />
          <FilterCheckbox label="Non-AI users" checked={filters.nonAiUsers} onChange={(value) => updateFilters("nonAiUsers", value)} />
          <FilterCheckbox label="Recently registered farms" checked={filters.recentlyRegistered} onChange={(value) => updateFilters("recentlyRegistered", value)} />
        </div>
      </div>
    </section>
  );
}
