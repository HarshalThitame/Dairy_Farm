"use client";

import Link from "next/link";
import NotificationForm from "@/components/admin/notifications/NotificationForm";

export default function CreateNotificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/notification-center" className="text-[17px] font-bold text-green-700 hover:underline">← Notification Center</Link>
        <h1 className="mt-2 text-[34px] font-extrabold text-slate-950">📨 Create Notification</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">Target farms, users, districts and subscription groups.</p>
      </div>
      <NotificationForm />
    </div>
  );
}
