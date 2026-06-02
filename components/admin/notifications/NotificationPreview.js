"use client";

/* eslint-disable @next/next/no-img-element */

const typeLabel = {
  information: "Information",
  success: "Success",
  warning: "Warning",
  critical: "Critical",
  promotion: "Promotion",
  system_update: "System Update",
  subscription_reminder: "Subscription Reminder",
  trial_expiry_reminder: "Trial Expiry Reminder",
  maintenance_notice: "Maintenance Notice",
  ai_feature_announcement: "AI Feature"
};

const tone = {
  information: "border-blue-200 bg-blue-50 text-blue-950",
  success: "border-green-200 bg-green-50 text-green-950",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-950",
  critical: "border-red-200 bg-red-50 text-red-950",
  promotion: "border-purple-200 bg-purple-50 text-purple-950",
  system_update: "border-sky-200 bg-sky-50 text-sky-950",
  subscription_reminder: "border-orange-200 bg-orange-50 text-orange-950",
  trial_expiry_reminder: "border-amber-200 bg-amber-50 text-amber-950",
  maintenance_notice: "border-slate-200 bg-slate-50 text-slate-950",
  ai_feature_announcement: "border-emerald-200 bg-emerald-50 text-emerald-950"
};

export default function NotificationPreview({ form }) {
  const type = form.type || "information";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[24px] font-extrabold text-slate-950">Live Preview</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[14px] font-extrabold text-slate-700">
          {typeLabel[type] || type}
        </span>
      </div>
      <article className={`mt-4 rounded-xl border p-4 shadow-sm ${tone[type] || tone.information}`}>
        {form.imageUrl ? (
          <img src={form.imageUrl} alt="" className="mb-3 max-h-44 w-full rounded-lg object-cover" />
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[22px] font-extrabold leading-tight">{form.title || "Notification title"}</p>
            <p className="mt-2 text-[17px] font-semibold leading-relaxed opacity-80">
              {form.message || "Notification message will appear here."}
            </p>
          </div>
          <span className="text-[28px]" aria-hidden="true">🔔</span>
        </div>
        {form.actionText ? (
          <div className="mt-4 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-[16px] font-extrabold text-white">
            {form.actionText}
          </div>
        ) : null}
      </article>
    </section>
  );
}
