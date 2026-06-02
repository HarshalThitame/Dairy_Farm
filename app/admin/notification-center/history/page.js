"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

const statusTone = {
  sent: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  draft: "bg-slate-100 text-slate-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
  sending: "bg-yellow-100 text-yellow-900"
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-IN") : "-";
}

export default function NotificationHistoryPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: "all", type: "all", search: "", page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => new URLSearchParams({
    status: filters.status,
    type: filters.type,
    search: filters.search,
    page: String(filters.page),
    limit: "25"
  }).toString(), [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/notifications?${query}`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load notifications");
      setRows(result.notifications || []);
      setMeta({ page: result.page || 1, pages: result.pages || 1, total: result.total || 0 });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? value : 1 }));
  }

  async function postAction(endpoint, body) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.alert(result.error || "Action failed");
      return;
    }
    load();
  }

  async function deleteNotification(id) {
    if (!window.confirm("Delete/cancel this notification?")) return;
    const response = await fetch(`/api/admin/notifications/${id}`, {
      method: "DELETE",
      headers: getSuperAdminAuthHeader()
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      window.alert(result.error || "Delete failed");
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/notification-center" className="text-[17px] font-bold text-green-700 hover:underline">← Notification Center</Link>
          <h1 className="mt-2 text-[34px] font-extrabold text-slate-950">📋 Notification History</h1>
          <p className="mt-1 text-[18px] font-semibold text-slate-500">{meta.total} notifications</p>
        </div>
        <Link href="/admin/notification-center/create" className="min-h-[52px] rounded-lg bg-green-600 px-5 py-3 text-[18px] font-extrabold text-white">
          + Create
        </Link>
      </div>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search title/message" className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px] md:col-span-2" />
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sent">Sent</option>
          <option value="cancelled">Cancelled</option>
          <option value="failed">Failed</option>
        </select>
        <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
          <option value="all">All types</option>
          <option value="information">Information</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="promotion">Promotion</option>
          <option value="system_update">System Update</option>
          <option value="subscription_reminder">Subscription Reminder</option>
          <option value="trial_expiry_reminder">Trial Expiry</option>
          <option value="maintenance_notice">Maintenance</option>
          <option value="ai_feature_announcement">AI Feature</option>
        </select>
      </section>

      {error ? <div className="rounded-xl bg-red-50 p-5 text-[18px] font-bold text-red-800">{error}</div> : null}
      {loading ? <div className="text-[20px] font-extrabold text-slate-600">Loading notifications...</div> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="bg-slate-50 text-[14px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Audience</th>
              <th className="px-4 py-3">Sent/Scheduled</th>
              <th className="px-4 py-3">Recipients</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Clicked</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[16px]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4">
                  <p className="font-extrabold text-slate-950">{row.title}</p>
                  <p className="line-clamp-1 max-w-[340px] text-[14px] font-semibold text-slate-500">{row.message}</p>
                </td>
                <td className="px-4 py-4">{row.type}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-[13px] font-extrabold ${statusTone[row.status] || statusTone.draft}`}>{row.status}</span>
                </td>
                <td className="px-4 py-4">{row.target_audience}</td>
                <td className="px-4 py-4">{formatDate(row.sent_at || row.scheduled_at)}</td>
                <td className="px-4 py-4 font-bold">{row.total_recipients || 0}</td>
                <td className="px-4 py-4 font-bold">{row.opened_count || 0}</td>
                <td className="px-4 py-4 font-bold">{row.clicked_count || 0}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {row.status === "draft" ? (
                      <button type="button" onClick={() => postAction("/api/admin/notifications/send", { notificationId: row.id })} className="rounded-lg bg-green-600 px-3 py-2 text-[14px] font-bold text-white">
                        Send
                      </button>
                    ) : null}
                    {row.status === "scheduled" ? (
                      <button type="button" onClick={() => postAction("/api/admin/notifications/cancel", { notificationId: row.id })} className="rounded-lg bg-orange-600 px-3 py-2 text-[14px] font-bold text-white">
                        Cancel
                      </button>
                    ) : null}
                    <button type="button" onClick={() => deleteNotification(row.id)} className="rounded-lg bg-red-600 px-3 py-2 text-[14px] font-bold text-white">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading ? <div className="p-8 text-center text-[18px] font-bold text-slate-500">No notifications found.</div> : null}
      </div>

      <div className="flex items-center justify-between">
        <button disabled={meta.page <= 1} onClick={() => updateFilter("page", meta.page - 1)} className="min-h-[52px] rounded-lg bg-slate-900 px-5 text-[18px] font-bold text-white disabled:bg-slate-300">Previous</button>
        <div className="text-[18px] font-extrabold">Page {meta.page} of {meta.pages}</div>
        <button disabled={meta.page >= meta.pages} onClick={() => updateFilter("page", meta.page + 1)} className="min-h-[52px] rounded-lg bg-slate-900 px-5 text-[18px] font-bold text-white disabled:bg-slate-300">Next</button>
      </div>
    </div>
  );
}
