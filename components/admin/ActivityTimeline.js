export default function ActivityTimeline({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-[18px] font-bold text-slate-500">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[18px] font-extrabold text-slate-950">{item.action}</div>
              <div className="mt-1 text-[15px] font-semibold text-slate-500">
                {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
              </div>
            </div>
            {item.farms?.farm_name ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-[14px] font-bold text-green-800">
                {item.farms.farm_name}
              </span>
            ) : null}
          </div>
          {item.details ? (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-[13px] text-slate-700">
              {JSON.stringify(item.details, null, 2)}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}
