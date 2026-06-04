"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActivityTimeline from "@/components/admin/ActivityTimeline";
import FarmMonitoringDashboard from "@/components/admin/FarmMonitoringDashboard";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

const tabs = ["overview", "data", "users", "activity", "notes"];

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildSubscriptionForm(farm = {}) {
  return {
    subscription_status: farm.subscription_status || "trial",
    trial_ends_at: dateInputValue(farm.trial_ends_at),
    subscription_started_at: dateInputValue(farm.subscription_started_at),
    subscription_ends_at: dateInputValue(farm.subscription_ends_at),
    is_active: farm.is_active !== false,
    suspended_reason: farm.suspended_reason || ""
  };
}

function getFarmIdFromParams(params = {}) {
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  return rawId ? decodeURIComponent(String(rawId)) : "";
}

export default function AdminFarmDetailPage({ params }) {
  const [data, setData] = useState(null);
  const [farmData, setFarmData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [farmDataLoading, setFarmDataLoading] = useState(false);
  const [farmDataAttempted, setFarmDataAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [notes, setNotes] = useState("");
  const [subscriptionForm, setSubscriptionForm] = useState(buildSubscriptionForm());
  const [error, setError] = useState("");
  const farmId = useMemo(() => getFarmIdFromParams(params), [params]);
  const farmApiId = useMemo(() => encodeURIComponent(farmId), [farmId]);

  const loadFarm = useCallback(async () => {
    if (!farmId) {
      setError("Farm ID चुकीचा आहे.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/farms/${farmApiId}`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load farm");
      setData(result);
      setNotes(result.farm?.admin_notes || "");
      setSubscriptionForm(buildSubscriptionForm(result.farm || {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [farmApiId, farmId]);

  const loadFarmData = useCallback(async () => {
    if (!farmId) return;
    setFarmDataLoading(true);
    setFarmDataAttempted(true);
    try {
      const response = await fetch(`/api/admin/farms/${farmApiId}/data?type=all`, {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (response.ok) setFarmData(result);
    } finally {
      setFarmDataLoading(false);
    }
  }, [farmApiId, farmId]);

  useEffect(() => {
    loadFarm();
  }, [loadFarm]);

  useEffect(() => {
    if (tab === "data" && !farmData && !farmDataLoading && !farmDataAttempted) {
      loadFarmData();
    }
  }, [farmData, farmDataAttempted, farmDataLoading, loadFarmData, tab]);

  async function patchFarm(action, body = {}) {
    setSaving(true);
    setActionLoading(action);
    try {
      const response = await fetch(`/api/admin/farms/${farmApiId}`, {
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
      const response = await fetch(`/api/admin/farms/${farmApiId}`, {
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

  async function saveSubscriptionControl() {
    const statusText = subscriptionForm.is_active ? subscriptionForm.subscription_status : "suspended";
    if (!window.confirm(`${farm.farm_name} साठी subscription status "${statusText}" set करायचा आहे का? User ला notification जाईल.`)) {
      return;
    }
    await patchFarm("update_subscription", subscriptionForm);
  }

  function updateSubscriptionForm(key, value) {
    setSubscriptionForm((current) => ({ ...current, [key]: value }));
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
    window.alert("PIN reset successful.");
  }

  async function updateUserStatus(user, action) {
    const labels = {
      activate: "activate",
      deactivate: "deactivate",
      force_logout: "force logout"
    };
    if (!window.confirm(`${user.name || user.mobile} user ${labels[action]} करायचा आहे का?`)) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
        body: JSON.stringify({ action })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "User action failed");
      await loadFarm();
      if (farmData) await loadFarmData();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 p-6 text-[18px] font-bold text-red-800">{error}</div>;
  }

  const farm = data?.farm || {};
  const ownerUser = data?.users?.find((user) => user.is_farm_owner) || data?.users?.[0] || null;

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
          <FarmMonitoringDashboard
            data={data}
            farmData={farmData}
            saving={saving}
            actionLoading={actionLoading}
            onFarmAction={confirmAndPatchFarm}
            onResetOwnerPin={() => ownerUser ? resetPin(ownerUser) : window.alert("Owner user not found")}
          />

          <section className="rounded-xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[24px] font-extrabold text-slate-950">Subscription Control</h2>
                <p className="mt-1 text-[16px] font-semibold text-slate-500">
                  Trial कमी/जास्त करा, subscription dates बदला, किंवा account active/suspended करा.
                </p>
              </div>
              <span className="rounded-full bg-green-50 px-3 py-1 text-[14px] font-extrabold text-green-800">
                Full admin control
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Subscription Status
                <select
                  value={subscriptionForm.subscription_status}
                  onChange={(event) => updateSubscriptionForm("subscription_status", event.target.value)}
                  className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]"
                >
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Trial Ends
                <input
                  type="date"
                  value={subscriptionForm.trial_ends_at}
                  onChange={(event) => updateSubscriptionForm("trial_ends_at", event.target.value)}
                  className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]"
                />
              </label>

              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Subscription Starts
                <input
                  type="date"
                  value={subscriptionForm.subscription_started_at}
                  onChange={(event) => updateSubscriptionForm("subscription_started_at", event.target.value)}
                  className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]"
                />
              </label>

              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Subscription Ends
                <input
                  type="date"
                  value={subscriptionForm.subscription_ends_at}
                  onChange={(event) => updateSubscriptionForm("subscription_ends_at", event.target.value)}
                  className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr_auto]">
              <label className="flex min-h-[52px] items-center gap-3 rounded-lg border border-slate-300 px-4 text-[17px] font-extrabold text-slate-800">
                <input
                  type="checkbox"
                  checked={subscriptionForm.is_active}
                  onChange={(event) => updateSubscriptionForm("is_active", event.target.checked)}
                  className="h-5 w-5"
                />
                Account Active
              </label>

              <input
                value={subscriptionForm.suspended_reason}
                onChange={(event) => updateSubscriptionForm("suspended_reason", event.target.value)}
                placeholder="Suspension reason, जर account inactive केला असेल"
                className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]"
              />

              <button
                type="button"
                onClick={saveSubscriptionControl}
                disabled={saving}
                className="min-h-[52px] rounded-lg bg-green-600 px-5 text-[17px] font-extrabold text-white disabled:bg-slate-300"
              >
                {actionLoading === "update_subscription" ? "Saving..." : "Save Subscription"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "data" ? (
        <div className="space-y-6">
          {farmDataLoading ? <div className="rounded-xl border border-slate-200 bg-white p-6 text-[18px] font-extrabold text-slate-600">Loading farm data...</div> : null}
          <DataTable title="Cows List" rows={farmData?.cows || []} columns={["name", "breed", "status", "date_of_birth"]} />
          <DataTable title="Recent Milk Records" rows={farmData?.milk || []} columns={["date", "morning_litres", "evening_litres", "total_litres"]} />
          <DataTable title="Recent AI Records" rows={farmData?.ai || []} columns={["ai_date", "bull_code", "bull_breed", "pregnancy_result"]} />
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1100px] w-full text-left">
            <thead className="bg-slate-50 text-[14px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-4">{user.is_active !== false ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-4">{user.is_farm_owner ? "Yes" : "No"}</td>
                  <td className="px-4 py-4">{user.last_login ? new Date(user.last_login).toLocaleString() : "-"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/users?search=${encodeURIComponent(user.mobile || user.name || "")}`} className="rounded-lg bg-blue-600 px-3 py-2 text-[15px] font-bold text-white">View</Link>
                      <button onClick={() => resetPin(user)} className="rounded-lg bg-slate-900 px-3 py-2 text-[15px] font-bold text-white">Reset PIN</button>
                      <button onClick={() => updateUserStatus(user, user.is_active === false ? "activate" : "deactivate")} className={`rounded-lg px-3 py-2 text-[15px] font-bold text-white ${user.is_active === false ? "bg-green-600" : "bg-red-600"}`}>
                        {user.is_active === false ? "Activate" : "Deactivate"}
                      </button>
                      <button onClick={() => updateUserStatus(user, "force_logout")} className="rounded-lg bg-yellow-600 px-3 py-2 text-[15px] font-bold text-white">Force Logout</button>
                    </div>
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
