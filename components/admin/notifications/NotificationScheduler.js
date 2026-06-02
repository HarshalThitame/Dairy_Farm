"use client";

export default function NotificationScheduler({ form, update }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-[24px] font-extrabold text-slate-950">Scheduling & Channels</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-[16px] font-bold text-slate-700">
          Delivery Time
          <select value={form.scheduleType} onChange={(event) => update("scheduleType", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
            <option value="now">Send Now</option>
            <option value="later">Schedule Later</option>
            <option value="recurring">Recurring</option>
          </select>
        </label>

        {form.scheduleType === "recurring" ? (
          <label className="grid gap-2 text-[16px] font-bold text-slate-700">
            Repeat
            <select value={form.recurrence} onChange={(event) => update("recurrence", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom_cron">Custom Cron</option>
            </select>
          </label>
        ) : null}

        {form.scheduleType !== "now" ? (
          <>
            <label className="grid gap-2 text-[16px] font-bold text-slate-700">
              Schedule Date
              <input type="date" value={form.scheduleDate} onChange={(event) => update("scheduleDate", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]" />
            </label>
            <label className="grid gap-2 text-[16px] font-bold text-slate-700">
              Schedule Time
              <input type="time" value={form.scheduleTime} onChange={(event) => update("scheduleTime", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]" />
            </label>
          </>
        ) : null}

        {form.recurrence === "custom_cron" && form.scheduleType === "recurring" ? (
          <label className="grid gap-2 text-[16px] font-bold text-slate-700">
            Cron Expression
            <input value={form.cronExpression} onChange={(event) => update("cronExpression", event.target.value)} placeholder="0 9 * * 1" className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]" />
          </label>
        ) : null}

        <label className="grid gap-2 text-[16px] font-bold text-slate-700">
          Expiry Date
          <input type="date" value={form.expiryDate} onChange={(event) => update("expiryDate", event.target.value)} className="min-h-[52px] rounded-lg border border-slate-300 px-4 text-[17px]" />
        </label>
      </div>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <p className="text-[18px] font-extrabold text-slate-900">Channels</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {[
            ["in_app", "In-App Notification"],
            ["push", "Push Notification"],
            ["whatsapp", "WhatsApp (future)"],
            ["sms", "SMS (future)"],
            ["email", "Email (future)"]
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[16px] font-bold ring-1 ring-slate-100">
              <input
                type="checkbox"
                checked={form.channels.includes(value)}
                disabled={["whatsapp", "sms", "email"].includes(value)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  update("channels", checked ? [...form.channels, value] : form.channels.filter((item) => item !== value));
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
