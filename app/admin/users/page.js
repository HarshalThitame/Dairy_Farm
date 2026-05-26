"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: "", role: "all", farm_id: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => new URLSearchParams(filters).toString(), [filters]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users?${query}`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load users");
      setUsers(result.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function resetPin(user) {
    const newPin = window.prompt(`New 4 digit PIN for ${user.name}`);
    if (!newPin) return;
    const response = await fetch("/api/admin/emergency/reset-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
      body: JSON.stringify({ userId: user.id, newPin })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      window.alert(result.error || "PIN reset failed");
      return;
    }
    window.alert(`PIN reset successful. New PIN: ${result.newPin}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-extrabold text-slate-950">👥 All Users</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">{users.length} users loaded</p>
      </div>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search name or mobile"
          className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]"
        />
        <select
          value={filters.role}
          onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
          className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]"
        >
          <option value="all">All roles</option>
          <option value="owners">Farm Owners</option>
          <option value="admin">Admins</option>
          <option value="worker">Workers</option>
        </select>
        <input
          value={filters.farm_id}
          onChange={(event) => setFilters((current) => ({ ...current, farm_id: event.target.value }))}
          placeholder="Farm ID"
          className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[18px]"
        />
      </section>

      {error ? <div className="rounded-lg bg-red-50 p-4 text-[18px] font-bold text-red-800">{error}</div> : null}
      {loading ? (
        <div className="text-[20px] font-extrabold text-slate-600">Loading users...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[900px] w-full text-left">
            <thead className="bg-slate-50 text-[14px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Farm</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[17px]">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 font-extrabold">{user.name}</td>
                  <td className="px-4 py-4">{user.mobile_masked}</td>
                  <td className="px-4 py-4">
                    {user.farms?.id ? <Link href={`/admin/farms/${user.farms.id}`} className="font-bold text-green-700 hover:underline">{user.farms.farm_name}</Link> : "-"}
                  </td>
                  <td className="px-4 py-4">{user.is_farm_owner ? "Farm Owner" : user.role}</td>
                  <td className="px-4 py-4">{user.last_login ? new Date(user.last_login).toLocaleString() : "-"}</td>
                  <td className="px-4 py-4">{user.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => resetPin(user)} className="rounded-lg bg-slate-900 px-3 py-2 text-[15px] font-bold text-white">
                      Reset PIN
                    </button>
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
