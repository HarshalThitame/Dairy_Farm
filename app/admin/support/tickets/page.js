"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ status: "all", q: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/support/tickets?${query}`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to load support tickets");
      setTickets(result.tickets || []);
      setStats(result.stats || null);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-extrabold text-slate-950">🎫 Support Tickets</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">User issues, replies and support workflow.</p>
      </div>

      {stats ? (
        <section className="grid gap-3 md:grid-cols-4">
          <Stat label="Total" value={stats.total} />
          <Stat label="Open" value={stats.open} />
          <Stat label="Resolved" value={stats.resolved} />
          <Stat label="Critical" value={stats.critical} />
        </section>
      ) : null}

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <input
          value={filters.q}
          onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          placeholder="Search ticket, subject, description"
          className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]"
        />
        <select
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_for_user">Waiting For User</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </section>

      {error ? <div className="rounded-lg bg-red-50 p-4 text-[18px] font-bold text-red-800">{error}</div> : null}
      {loading ? (
        <div className="text-[20px] font-extrabold text-slate-600">Loading tickets...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1000px] w-full text-left">
            <thead className="bg-slate-50 text-[14px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Farm</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[16px]">
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-4 py-4">
                    <div className="font-extrabold">{ticket.ticketNumber}</div>
                    <div className="max-w-[280px] truncate text-[14px] font-semibold text-slate-500">{ticket.subject}</div>
                  </td>
                  <td className="px-4 py-4">{ticket.farm?.farm_name || "-"}</td>
                  <td className="px-4 py-4">{ticket.user?.name || "-"}</td>
                  <td className="px-4 py-4">{ticket.categoryLabel}</td>
                  <td className="px-4 py-4">{ticket.priorityLabel}</td>
                  <td className="px-4 py-4">{ticket.statusLabel}</td>
                  <td className="px-4 py-4">{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"}</td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/support/tickets/${ticket.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-[15px] font-bold text-white">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[14px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-[30px] font-extrabold text-slate-950">{value || 0}</p>
    </div>
  );
}

