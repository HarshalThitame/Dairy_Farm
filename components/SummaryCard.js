const colorStyles = {
  green: "border-green-200 bg-green-50 text-green-900",
  red: "border-red-200 bg-red-50 text-red-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-900",
  purple: "border-purple-200 bg-purple-50 text-purple-900",
  slate: "border-slate-200 bg-white text-slate-900"
};

export default function SummaryCard({ title, value, subtext, color = "slate", emoji }) {
  return (
    <article
      className={`min-h-[150px] rounded-lg border-2 p-4 shadow-soft ${colorStyles[color] || colorStyles.slate}`}
    >
      <div className="text-[30px] leading-none" aria-hidden="true">
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
