const colorStyles = {
  green: {
    card: "border-green-100 bg-green-50 text-green-900",
    icon: "bg-green-100",
    accent: "bg-green-500"
  },
  red: {
    card: "border-red-100 bg-red-50 text-red-900",
    icon: "bg-red-100",
    accent: "bg-red-500"
  },
  blue: {
    card: "border-blue-100 bg-blue-50 text-blue-900",
    icon: "bg-blue-100",
    accent: "bg-blue-500"
  },
  yellow: {
    card: "border-yellow-100 bg-yellow-50 text-yellow-900",
    icon: "bg-yellow-100",
    accent: "bg-yellow-500"
  },
  purple: {
    card: "border-purple-100 bg-purple-50 text-purple-900",
    icon: "bg-purple-100",
    accent: "bg-purple-500"
  },
  slate: {
    card: "border-slate-200 bg-white text-slate-900",
    icon: "bg-slate-100",
    accent: "bg-slate-400"
  }
};

export default function SummaryCard({ title, value, subtext, color = "slate", emoji }) {
  const style = colorStyles[color] || colorStyles.slate;

  return (
    <article
      className={`dashboard-card dashboard-summary-tile relative min-h-[150px] overflow-hidden rounded-lg border p-4 shadow-soft ${style.card}`}
    >
      <span className={`absolute left-0 top-0 h-1.5 w-full ${style.accent}`} aria-hidden="true" />
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-[30px] leading-none shadow-sm ${style.icon}`} aria-hidden="true">
        {emoji}
      </div>
      <h2 className="mt-3 text-[18px] font-extrabold leading-tight">{title}</h2>
      <p className="mt-2 text-[26px] font-extrabold leading-tight">{value}</p>
      {subtext ? (
        <p className="mt-2 text-[18px] font-bold leading-snug opacity-80">{subtext}</p>
      ) : null}
    </article>
  );
}
