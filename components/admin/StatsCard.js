export default function StatsCard({ title, value, subtext, tone = "slate", icon = "📊" }) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    red: "border-red-200 bg-red-50 text-red-800",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-900",
    slate: "border-slate-200 bg-white text-slate-900"
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[16px] font-bold uppercase tracking-wide opacity-70">{title}</p>
          <p className="mt-3 text-[36px] font-extrabold leading-none">{value}</p>
          {subtext ? <p className="mt-3 text-[16px] font-semibold opacity-75">{subtext}</p> : null}
        </div>
        <div className="text-[36px] leading-none">{icon}</div>
      </div>
    </div>
  );
}
