"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ActivityTimeline from "@/components/admin/ActivityTimeline";
import StatsCard from "@/components/admin/StatsCard";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

const tabs = ["overview", "data", "users", "activity", "notes"];

export default function AdminFarmDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const loadFarm = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/farms/${params.id}`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load farm");
      setData(result);
      setNotes(result.farm?.admin_notes || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const loadFarmData = useCallback(async () => {
    const response = await fetch(`/api/admin/farms/${params.id}/data?type=all`, {
      cache: "no-store",
      headers: getSuperAdminAuthHeader()
    });
    const result = await response.json();
    if (response.ok) setFarmData(result);
  }, [params.id]);

  useEffect(() => {
    loadFarm();
    loadFarmData();
  }, [loadFarm, loadFarmData]);

  async function patchFarm(action, body = {}) {
    setSaving(true);
    setActionLoading(action);
    try {
      const response = await fetch(`/api/admin/farms/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
        body: JSON.stringify({ action, ...body })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Action failed");
      if (result.notificationWarning) {
        window.alert(`Action complete, पण notification issue: ${result.notificationWarning}`);
      }
      await loadFarm();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
      setActionLoading("");
    }
  }

  async function confirmAndPatchFarm(action) {
    let body = {};
    let message = "";

    if (action === "extend_trial") {
      body = { days: 30 };
      message = `${farm.farm_name} चा trial 30 दिवसांनी वाढवायचा आहे का? User ला notification जाईल.`;
    } else if (action === "activate") {
      message = `${farm.farm_name} चे subscription activate करायचे आहे का? User ला notification जाईल.`;
    } else if (action === "suspend") {
      const reason = window.prompt("Suspension reason", "Support review");
      if (reason === null) return;
      body = { reason: reason || "Support review" };
      message = `${farm.farm_name} farm suspend करायचा आहे का? User ला mobile notification जाईल.`;
    } else if (action === "unsuspend") {
      message = `${farm.farm_name} farm पुन्हा active करायचा आहे का? User ला notification जाईल.`;
    }

    if (!window.confirm(message)) return;
    await patchFarm(action, body);
  }

  async function saveNotes() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/farms/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
        body: JSON.stringify({ admin_notes: notes })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Notes save failed");
      await loadFarm();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

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

  if (loading && !data) {
    return <div className="text-[22px] font-extrabold text-slate-700">Loading farm...</div>;
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 p-6 text-[18px] font-bold text-red-800">{error}</div>;
  }

  const farm = data?.farm || {};
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/farms" className="text-[17px] font-bold text-green-700 hover:underline">← Back to farms</Link>
          <h1 className="mt-2 text-[34px] font-extrabold text-slate-950">{farm.farm_name}</h1>
          <p className="text-[18px] font-semibold text-slate-500">{farm.owner_name} · {farm.owner_mobile}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => confirmAndPatchFarm("extend_trial")} disabled={saving} className="min-h-[52px] rounded-lg bg-yellow-600 px-4 text-[17px] font-bold text-white disabled:bg-slate-300">
            {actionLoading === "extend_trial" ? "Extending..." : "Extend Trial"}
          </button>
          <button onClick={() => confirmAndPatchFarm("activate")} disabled={saving} className="min-h-[52px] rounded-lg bg-green-600 px-4 text-[17px] font-bold text-white disabled:bg-slate-300">
            {actionLoading === "activate" ? "Activating..." : "Activate"}
          </button>
          {farm.is_active ? (
            <button onClick={() => confirmAndPatchFarm("suspend")} disabled={saving} className="min-h-[52px] rounded-lg bg-red-600 px-4 text-[17px] font-bold text-white disabled:bg-slate-300">
              {actionLoading === "suspend" ? "Suspending..." : "Suspend"}
            </button>
          ) : (
            <button onClick={() => confirmAndPatchFarm("unsuspend")} disabled={saving} className="min-h-[52px] rounded-lg bg-slate-900 px-4 text-[17px] font-bold text-white disabled:bg-slate-300">
              {actionLoading === "unsuspend" ? "Activating..." : "Unsuspend"}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`min-h-[48px] rounded-lg px-4 text-[17px] font-extrabold ${tab === item ? "bg-green-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {item === "overview" ? "Overview" : item === "data" ? "Cows & Data" : item === "users" ? "Users" : item === "activity" ? "Activity" : "Notes"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard title="Cows" value={stats.cowCount || 0} subtext="Current records" tone="green" icon="🐄" />
            <StatsCard title="Milk Records" value={stats.milkCount || 0} subtext={stats.lastMilkEntry?.date || "No entries"} tone="blue" icon="🥛" />
            <StatsCard title="AI Records" value={stats.aiCount || 0} subtext="Total AI entries" tone="yellow" icon="💉" />
            <StatsCard title="Users" value={stats.userCount || 0} subtext={stats.lastLogin?.userName ? `Last: ${stats.lastLogin.userName}` : "No login"} tone="slate" icon="👥" />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <InfoCard title="Farm Information" rows={[
              ["Farm name", farm.farm_name],
              ["Owner", farm.owner_name],
              ["Mobile", farm.owner_mobile],
              ["Village", farm.village_name],
              ["Taluka", farm.taluka_name],
              ["District", farm.district_name],
              ["Address", farm.farm_address],
              ["Dairy", farm.dairy_name],
              ["Vet", farm.vet_name],
              ["Vet Mobile", farm.vet_mobile]
            ]} />
            <InfoCard title="Subscription" rows={[
              ["Status", farm.is_active ? farm.subscription_status : "suspended"],
              ["Trial ends", farm.trial_ends_at ? new Date(farm.trial_ends_at).toLocaleString() : "-"],
              ["Subscription started", farm.subscription_started_at ? new Date(farm.subscription_started_at).toLocaleString() : "-"],
              ["Subscription ends", farm.subscription_ends_at ? new Date(farm.subscription_ends_at).toLocaleString() : "-"],
              ["Suspended reason", farm.suspended_reason || "-"],
              ["Created", farm.created_at ? new Date(farm.created_at).toLocaleString() : "-"]
            ]} />
          </section>
        </div>
      ) : null}

      {tab === "data" ? (
        <div className="space-y-6">
          <DataTable title="Cows List" rows={farmData?.cows || []} columns={["name", "breed", "status", "date_of_birth"]} />
          <DataTable title="Recent Milk Records" rows={farmData?.milk || []} columns={["date", "morning_litres", "evening_litres", "total_litres"]} />
          <DataTable title="Recent AI Records" rows={farmData?.ai || []} columns={["ai_date", "bull_code", "bull_breed", "pregnancy_result"]} />
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[850px] w-full text-left">
            <thead className="bg-slate-50 text-[14px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[17px]">
              {(data?.users || []).map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 font-extrabold">{user.name}</td>
                  <td className="px-4 py-4">{user.mobile}</td>
                  <td className="px-4 py-4">{user.role}</td>
                  <td className="px-4 py-4">{user.is_farm_owner ? "Yes" : "No"}</td>
                  <td className="px-4 py-4">{user.last_login ? new Date(user.last_login).toLocaleString() : "-"}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => resetPin(user)} className="rounded-lg bg-slate-900 px-3 py-2 text-[15px] font-bold text-white">Reset PIN</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "activity" ? <ActivityTimeline items={data?.activity || []} /> : null}

      {tab === "notes" ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Admin Notes</h2>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={saveNotes}
            rows={8}
            className="mt-4 w-full rounded-lg border border-slate-300 p-4 text-[18px]"
            placeholder="Add private notes for this farm"
          />
          <button onClick={saveNotes} disabled={saving} className="mt-4 min-h-[52px] rounded-lg bg-green-600 px-5 text-[18px] font-extrabold text-white">
            Save Notes
          </button>
        </section>
      ) : null}
    </div>
  );
}

function InfoCard({ title, rows }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[24px] font-extrabold text-slate-950">{title}</h2>
      <div className="mt-4 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[180px_1fr] gap-4 py-3 text-[17px]">
            <div className="font-bold text-slate-500">{label}</div>
            <div className="font-semibold text-slate-950">{value || "-"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataTable({ title, rows, columns }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[24px] font-extrabold text-slate-950">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[700px] w-full text-left">
          <thead className="bg-slate-50 text-[14px] uppercase text-slate-500">
            <tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[17px]">
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id}>
                {columns.map((column) => <td key={column} className="px-4 py-4">{String(row[column] ?? "-")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
