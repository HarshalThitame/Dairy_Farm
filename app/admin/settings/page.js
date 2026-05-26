"use client";

import { useEffect, useState } from "react";
import { getSuperAdminAuthHeader, useSuperAdmin } from "@/context/SuperAdminContext";

export default function AdminSettingsPage() {
  const { logout } = useSuperAdmin();
  const [admin, setAdmin] = useState(null);
  const [settings, setSettings] = useState([]);
  const [profile, setProfile] = useState({ name: "", mobile: "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "" });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/settings", {
      cache: "no-store",
      headers: getSuperAdminAuthHeader()
    });
    const result = await response.json();
    if (response.ok) {
      setAdmin(result.admin);
      setProfile({ name: result.admin?.name || "", mobile: result.admin?.mobile || "" });
      setSettings(result.settings || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(body, successMessage) {
    setStatus("Saving...");
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(result.error || "Save failed");
      return false;
    }
    setStatus(successMessage);
    await load();
    return true;
  }

  async function savePassword() {
    const ok = await save({ password }, "Password changed. Please login again.");
    if (ok) {
      window.setTimeout(logout, 1500);
    }
  }

  async function refreshStats() {
    setStatus("Recalculating stats...");
    const response = await fetch("/api/admin/stats", { method: "POST", headers: getSuperAdminAuthHeader() });
    setStatus(response.ok ? "Stats recalculated." : "Stats refresh failed.");
  }

  if (loading) return <div className="text-[22px] font-extrabold text-slate-700">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[34px] font-extrabold text-slate-950">⚙️ Settings</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">Super admin profile, security, and platform defaults</p>
      </div>

      {status ? <div className="rounded-lg bg-green-50 p-4 text-[18px] font-bold text-green-800">{status}</div> : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold">Profile</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-[18px] font-bold">Email
              <input value={admin?.email || ""} readOnly className="mt-2 min-h-[52px] w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-[18px]" />
            </label>
            <label className="block text-[18px] font-bold">Name
              <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="mt-2 min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[18px]" />
            </label>
            <label className="block text-[18px] font-bold">Mobile
              <input value={profile.mobile} onChange={(event) => setProfile((current) => ({ ...current, mobile: event.target.value }))} className="mt-2 min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[18px]" />
            </label>
            <button onClick={() => save({ profile }, "Profile saved.")} className="min-h-[52px] rounded-lg bg-green-600 px-5 text-[18px] font-extrabold text-white">Save Profile</button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold">Security</h2>
          <div className="mt-4 space-y-4">
            <input type="password" value={password.currentPassword} onChange={(event) => setPassword((current) => ({ ...current, currentPassword: event.target.value }))} placeholder="Current password" className="min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[18px]" />
            <input type="password" value={password.newPassword} onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))} placeholder="New password" className="min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[18px]" />
            <button onClick={savePassword} className="min-h-[52px] rounded-lg bg-slate-900 px-5 text-[18px] font-extrabold text-white">Change Password</button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-[24px] font-extrabold">Platform Settings</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {settings.map((setting) => (
            <label key={setting.key} className="block text-[18px] font-bold">
              {setting.label}
              <input
                value={setting.value}
                onChange={(event) => setSettings((current) => current.map((item) => item.key === setting.key ? { ...item, value: event.target.value } : item))}
                className="mt-2 min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[18px]"
              />
            </label>
          ))}
        </div>
        <button
          onClick={() => save({ settings: Object.fromEntries(settings.map((item) => [item.key, item.value])) }, "Platform settings saved.")}
          className="mt-4 min-h-[52px] rounded-lg bg-green-600 px-5 text-[18px] font-extrabold text-white"
        >
          Save Platform Settings
        </button>
      </section>

      <section className="rounded-xl border-2 border-red-200 bg-red-50 p-5 shadow-sm">
        <h2 className="text-[24px] font-extrabold text-red-800">Danger Zone</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={refreshStats} className="min-h-[52px] rounded-lg bg-red-700 px-5 text-[18px] font-extrabold text-white">Recalculate Stats</button>
          <a href="/api/admin/export?type=farms" className="min-h-[52px] rounded-lg bg-slate-900 px-5 py-3 text-[18px] font-extrabold text-white">Export Platform Data</a>
        </div>
      </section>
    </div>
  );
}
