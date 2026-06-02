"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSuperAdminAuthHeader } from "@/context/SuperAdminContext";
import AudienceSelector from "@/components/admin/notifications/AudienceSelector";
import NotificationPreview from "@/components/admin/notifications/NotificationPreview";
import NotificationScheduler from "@/components/admin/notifications/NotificationScheduler";

const typeOptions = [
  ["information", "Information"],
  ["success", "Success"],
  ["warning", "Warning"],
  ["critical", "Critical"],
  ["promotion", "Promotion"],
  ["system_update", "System Update"],
  ["subscription_reminder", "Subscription Reminder"],
  ["trial_expiry_reminder", "Trial Expiry Reminder"],
  ["maintenance_notice", "Maintenance Notice"],
  ["ai_feature_announcement", "AI Feature Announcement"]
];

const defaultForm = {
  title: "",
  message: "",
  type: "information",
  priority: "normal",
  targetAudience: "all_farms",
  farmIds: [],
  userIds: [],
  districts: [],
  filters: {},
  scheduleType: "now",
  scheduleDate: "",
  scheduleTime: "09:00",
  recurrence: "daily",
  cronExpression: "",
  expiryDate: "",
  actionText: "",
  actionUrl: "",
  imageUrl: "",
  channels: ["in_app", "push"]
};

function joinDateTime(date, time) {
  if (!date) return null;
  return `${date}T${time || "09:00"}:00`;
}

export default function NotificationForm({ initialForm }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...defaultForm, ...(initialForm || {}) });
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadTemplates() {
      const response = await fetch("/api/admin/notifications/templates", {
        cache: "no-store",
        headers: getSuperAdminAuthHeader()
      });
      const result = await response.json();
      if (response.ok) {
        setTemplates(result.templates || []);
      }
    }
    loadTemplates();
  }, []);

  const payload = useMemo(() => ({
    title: form.title,
    message: form.message,
    type: form.type,
    priority: form.priority,
    targetAudience: form.targetAudience,
    farmIds: form.farmIds,
    userIds: form.userIds,
    districts: form.districts,
    filters: form.filters,
    scheduleType: form.scheduleType,
    scheduledAt: form.scheduleType === "now" ? null : joinDateTime(form.scheduleDate, form.scheduleTime),
    recurrence: form.recurrence,
    cronExpression: form.cronExpression,
    expiresAt: form.expiryDate ? `${form.expiryDate}T23:59:59` : null,
    actionText: form.actionText,
    actionUrl: form.actionUrl,
    imageUrl: form.imageUrl,
    channels: form.channels,
    sendNow: form.scheduleType === "now"
  }), [form]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyTemplate(templateId) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setForm((current) => ({
      ...current,
      title: template.title || "",
      message: template.message || "",
      type: template.type || "information",
      priority: template.priority || "normal",
      actionText: template.action_text || "",
      actionUrl: template.action_url || "",
      imageUrl: template.image_url || ""
    }));
  }

  async function submit(saveAsDraft = false) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSuperAdminAuthHeader() },
        body: JSON.stringify({ ...payload, saveAsDraft })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Notification save failed.");
      }

      setSuccess(saveAsDraft ? "Notification draft saved." : `Notification processed for ${result.recipientCount || 0} recipients.`);
      window.setTimeout(() => router.push("/admin/notification-center/history"), 900);
    } catch (submitError) {
      setError(submitError.message || "Notification save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-extrabold text-slate-950">Message</h2>
              <p className="text-[16px] font-semibold text-slate-500">Use clear Marathi text for farmers.</p>
            </div>
            <select onChange={(event) => applyTemplate(event.target.value)} defaultValue="" className="min-h-[46px] rounded-lg border border-slate-300 px-3 text-[16px] font-bold">
              <option value="">Use template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-[16px] font-bold text-slate-700">
              Title
              <input value={form.title} onChange={(event) => update("title", event.target.value)} className="min-h-[54px] rounded-lg border border-slate-300 px-4 text-[18px]" />
            </label>
            <label className="grid gap-2 text-[16px] font-bold text-slate-700">
              Message
              <textarea value={form.message} onChange={(event) => update("message", event.target.value)} rows={5} className="rounded-lg border border-slate-300 px-4 py-3 text-[18px]" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Type
                <select value={form.type} onChange={(event) => update("type", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
                  {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Priority
                <select value={form.priority} onChange={(event) => update("priority", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Action Button Text
                <input value={form.actionText} onChange={(event) => update("actionText", event.target.value)} placeholder="आता वापरा" className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]" />
              </label>
              <label className="grid gap-2 text-[16px] font-bold text-slate-700">
                Action URL
                <input value={form.actionUrl} onChange={(event) => update("actionUrl", event.target.value)} placeholder="/accounting" className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]" />
              </label>
              <label className="grid gap-2 text-[16px] font-bold text-slate-700 md:col-span-2">
                Image URL
                <input value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="https://..." className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]" />
              </label>
            </div>
          </div>
        </section>

        <AudienceSelector form={form} update={update} />
        <NotificationScheduler form={form} update={update} />

        {error ? <div className="rounded-lg bg-red-50 p-4 text-[18px] font-bold text-red-800">{error}</div> : null}
        {success ? <div className="rounded-lg bg-green-50 p-4 text-[18px] font-bold text-green-800">{success}</div> : null}

        <div className="sticky bottom-4 grid gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur md:grid-cols-2">
          <button type="button" disabled={saving} onClick={() => submit(false)} className="min-h-[56px] rounded-lg bg-green-600 px-5 text-[18px] font-extrabold text-white disabled:bg-slate-300">
            {saving ? "Processing..." : form.scheduleType === "now" ? "Send Notification" : "Schedule Notification"}
          </button>
          <button type="button" disabled={saving} onClick={() => submit(true)} className="min-h-[56px] rounded-lg border-2 border-slate-300 bg-white px-5 text-[18px] font-extrabold text-slate-800 disabled:bg-slate-100">
            Save Draft
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <NotificationPreview form={form} />
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-[16px] font-semibold text-slate-600 shadow-sm">
          <h2 className="text-[22px] font-extrabold text-slate-950">Safety Checks</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>All notifications are logged for audit.</li>
            <li>In-app delivery is stored per user.</li>
            <li>Push works only when VAPID keys are configured.</li>
            <li>WhatsApp, SMS and Email channels are reserved for Phase 2.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
