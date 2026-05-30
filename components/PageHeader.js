export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="page-header-card flex items-start justify-between gap-3 rounded-lg border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-tight text-slate-950 sm:text-[32px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[19px] font-semibold leading-snug text-slate-600">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
