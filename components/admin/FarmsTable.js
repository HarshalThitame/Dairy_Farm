"use client";

import Link from "next/link";

function statusTone(farm) {
  if (!farm.is_active) {
    return "bg-slate-200 text-slate-700";
  }
  if (farm.subscription_status === "active") {
    return "bg-green-100 text-green-800";
  }
  if (farm.subscription_status === "expired") {
    return "bg-red-100 text-red-800";
  }
  return "bg-yellow-100 text-yellow-900";
}

function statusLabel(farm) {
  if (!farm.is_active) {
    return "Suspended";
  }
  return farm.subscription_status || "trial";
}

function daysUntil(value) {
  if (!value) {
    return "-";
  }
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) {
    return `${Math.abs(days)} days ago`;
  }
  return `${days} days`;
}

export default function FarmsTable({ farms = [], onSuspend, loadingFarmId = null }) {
  if (!farms.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-[18px] font-bold text-slate-500">
        No farms found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[1100px] w-full border-collapse text-left">
        <thead className="bg-slate-50 text-[15px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Farm Name</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Mobile</th>
            <th className="px-4 py-3">District</th>
            <th className="px-4 py-3">Cows</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Trial Ends</th>
            <th className="px-4 py-3">Last Activity</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[17px]">
          {farms.map((farm) => (
            <tr key={farm.id} className={`hover:bg-slate-50 ${loadingFarmId === farm.id ? "opacity-70" : ""}`}>
              <td className="px-4 py-4 font-extrabold text-slate-950">
                <Link href={`/admin/farms/${encodeURIComponent(String(farm.id || ""))}`} className="text-green-700 hover:underline">
                  {farm.farm_name}
                </Link>
              </td>
              <td className="px-4 py-4">{farm.owner_name}</td>
              <td className="px-4 py-4">{farm.owner_mobile_masked || farm.owner_mobile}</td>
              <td className="px-4 py-4">{farm.district_name || "-"}</td>
              <td className="px-4 py-4 font-bold">{farm.total_cows || 0}</td>
              <td className="px-4 py-4">
                <span className={`rounded-full px-3 py-1 text-[14px] font-extrabold ${statusTone(farm)}`}>
                  {statusLabel(farm)}
                </span>
              </td>
              <td className="px-4 py-4">{daysUntil(farm.trial_ends_at)}</td>
              <td className="px-4 py-4">{farm.last_activity_at ? new Date(farm.last_activity_at).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-4">{farm.created_at ? new Date(farm.created_at).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/farms/${encodeURIComponent(String(farm.id || ""))}`}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-[15px] font-bold text-white"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => onSuspend?.(farm)}
                    disabled={loadingFarmId === farm.id}
                    className="rounded-lg bg-red-600 px-3 py-2 text-[15px] font-bold text-white disabled:bg-slate-300"
                  >
                    {loadingFarmId === farm.id ? "Loading..." : farm.is_active ? "Suspend" : "Unsuspend"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
