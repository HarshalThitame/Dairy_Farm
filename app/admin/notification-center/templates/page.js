"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";

const initialForm = {
  name: "",
  title: "",
  message: "",
  type: "information",
  priority: "normal",
  actionText: "",
  actionUrl: "",
  imageUrl: ""
};

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/notifications/templates", {
      cache: "no-store",
      headers: getSuperAdminAuthHeader()
    });
    const result = await response.json();
    if (response.ok) {
      setTemplates(result.templates || []);
    } else {
      setError(result.error || "Failed to load templates");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/notifications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
        body: JSON.stringify(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Template save failed");
      setForm(initialForm);
      load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/notification-center" className="text-[17px] font-bold text-green-700 hover:underline">← Notification Center</Link>
        <h1 className="mt-2 text-[34px] font-extrabold text-slate-950">🧾 Notification Templates</h1>
        <p className="mt-1 text-[18px] font-semibold text-slate-500">Reusable messages for trial, subscription, maintenance and feature launches.</p>
      </div>

      {error ? <div className="rounded-xl bg-red-50 p-5 text-[18px] font-bold text-red-800">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Create Template</h2>
          <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Template name" className="min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[17px]" />
          <input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Title" className="min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[17px]" />
          <textarea value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Message" rows={5} className="w-full rounded-lg border border-slate-300 px-4 py-3 text-[17px]" />
          <div className="grid gap-3 md:grid-cols-2">
            <select value={form.type} onChange={(event) => update("type", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
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
            <select value={form.priority} onChange={(event) => update("priority", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <input value={form.actionText} onChange={(event) => update("actionText", event.target.value)} placeholder="Action text" className="min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[17px]" />
          <input value={form.actionUrl} onChange={(event) => update("actionUrl", event.target.value)} placeholder="Action URL" className="min-h-[52px] w-full rounded-lg border border-slate-300 px-4 text-[17px]" />
          <button disabled={saving} className="min-h-[54px] w-full rounded-lg bg-green-600 px-5 text-[18px] font-extrabold text-white disabled:bg-slate-300">
            {saving ? "Saving..." : "Save Template"}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Saved Templates</h2>
          {loading ? <p className="mt-4 text-[17px] font-bold text-slate-500">Loading templates...</p> : null}
          <div className="mt-4 space-y-3">
            {templates.map((template) => (
              <article key={template.id} className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[19px] font-extrabold text-slate-950">{template.name}</p>
                    <p className="text-[16px] font-bold text-slate-700">{template.title}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[13px] font-extrabold text-slate-600">{template.type}</span>
                </div>
                <p className="mt-2 text-[15px] font-semibold text-slate-500">{template.message}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
