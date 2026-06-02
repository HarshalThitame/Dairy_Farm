"use client";

import StatsCard from "@/components/admin/StatsCard";

function Row({ item, metric = "opened_count" }) {
  const delivered = Number(item.delivered_count || item.total_recipients || 0);
  const opened = Number(item.opened_count || 0);
  const clicked = Number(item.clicked_count || 0);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-[16px]">
      <div className="min-w-0">
        <p className="truncate font-extrabold text-slate-950">{item.title}</p>
        <p className="font-semibold text-slate-500">{item.type} · {item.status}</p>
      </div>
      <div className="shrink-0 text-right font-extrabold text-slate-900">
        {metric === "clicked_count" ? clicked : opened}
        <span className="block text-[13px] font-semibold text-slate-500">of {delivered}</span>
      </div>
    </div>
  );
}

export default function NotificationAnalytics({ data }) {
  const totals = data?.totals || {};

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard title="Total Sent" value={totals.totalSent || 0} subtext={`${totals.sentToday || 0} today`} tone="green" icon="📨" />
        <StatsCard title="Unread" value={totals.unread || 0} subtext="In-app unread" tone="yellow" icon="🔔" />
        <StatsCard title="Read" value={totals.read || 0} subtext={`${totals.openRate || 0}% open rate`} tone="blue" icon="👁️" />
        <StatsCard title="Clicked" value={totals.clicked || 0} subtext={`${totals.clickRate || 0}% CTR`} tone="green" icon="👆" />
        <StatsCard title="Failed" value={totals.failed || 0} subtext="Delivery failures" tone="red" icon="⚠️" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Most Opened</h2>
          <div className="mt-4 space-y-2">
            {(data?.mostOpened || []).map((item) => <Row key={item.id} item={item} />)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Most Clicked</h2>
          <div className="mt-4 space-y-2">
            {(data?.mostClicked || []).map((item) => <Row key={item.id} item={item} metric="clicked_count" />)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">District Engagement</h2>
          <div className="mt-4 space-y-2">
            {(data?.districtEngagement || []).map((row) => (
              <div key={row.district} className="flex justify-between rounded-lg bg-slate-50 p-3 text-[16px] font-bold">
                <span>{row.district}</span>
                <span>{row.opened}/{row.delivered} opened · {row.clicked} clicked</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[24px] font-extrabold text-slate-950">Farm Engagement</h2>
          <div className="mt-4 space-y-2">
            {(data?.farmEngagement || []).map((row) => (
              <div key={row.farmId} className="flex justify-between rounded-lg bg-slate-50 p-3 text-[16px] font-bold">
                <span>{row.farmName}</span>
                <span>{row.opened}/{row.delivered} opened · {row.clicked} clicked</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
