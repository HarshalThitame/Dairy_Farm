"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NotificationAnalytics from "@/components/admin/notifications/NotificationAnalytics";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

export default function NotificationAnalyticsPage() {
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
        if (!response.ok) throw new Error(result.error || "Failed to load analytics");
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
    <div className="space-y-6">
      <div>
        <Link href="/admin/notification-center" className="text-[17px] font-bold text-green-700 hover:underline">← Notification Center</Link>
        <h1 className="mt-2 text-[34px] font-extrabold text-slate-950">📈 Notification Analytics</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">Delivery, read, open and click performance.</p>
      </div>
      {loading ? <div className="text-[20px] font-extrabold text-slate-600">Loading analytics...</div> : null}
      {error ? <div className="rounded-xl bg-red-50 p-5 text-[18px] font-bold text-red-800">{error}</div> : null}
      {data ? <NotificationAnalytics data={data} /> : null}
    </div>
  );
}
