"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NotificationAnalytics from "@/components/admin/notifications/NotificationAnalytics";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function NotificationCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/notifications/analytics", {
          cache: "no-store",
          headers: getSuperAdminAuthHeader()
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to load notification analytics");
        setData(result);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold text-slate-950">🔔 Notification Center</h1>
          <p className="mt-1 text-[18px] font-semibold text-slate-500">Send announcements, alerts, updates and marketing messages.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/notification-center/create" className="min-h-[52px] rounded-lg bg-green-600 px-5 py-3 text-[18px] font-extrabold text-white">
            + Create Notification
          </Link>
          <Link href="/admin/notification-center/history" className="min-h-[52px] rounded-lg bg-slate-900 px-5 py-3 text-[18px] font-extrabold text-white">
            History
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Link href="/admin/notification-center/create" className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-900 shadow-sm">
          <p className="text-[32px]">📨</p>
          <p className="mt-2 text-[22px] font-extrabold">Create</p>
          <p className="text-[16px] font-semibold">Send now or schedule later</p>
        </Link>
        <Link href="/admin/notification-center/history" className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900 shadow-sm">
          <p className="text-[32px]">📋</p>
          <p className="mt-2 text-[22px] font-extrabold">History</p>
          <p className="text-[16px] font-semibold">Recent and scheduled notifications</p>
        </Link>
        <Link href="/admin/notification-center/analytics" className="rounded-xl border border-purple-200 bg-purple-50 p-5 text-purple-900 shadow-sm">
          <p className="text-[32px]">📈</p>
          <p className="mt-2 text-[22px] font-extrabold">Analytics</p>
          <p className="text-[16px] font-semibold">Open rate, CTR, failures</p>
        </Link>
        <Link href="/admin/notification-center/templates" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <p className="text-[32px]">🧾</p>
          <p className="mt-2 text-[22px] font-extrabold">Templates</p>
          <p className="text-[16px] font-semibold">Reusable Marathi messages</p>
        </Link>
      </section>

      {loading ? <div className="text-[20px] font-extrabold text-slate-600">Loading notification data...</div> : null}
      {error ? <div className="rounded-xl bg-red-50 p-5 text-[18px] font-bold text-red-800">{error}</div> : null}
      {data ? <NotificationAnalytics data={data} /> : null}
    </div>
  );
}
