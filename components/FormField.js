export default function FormField({ label, required = false, children, hint }) {
  return (
    <div className="block">
      <span className="mb-2 flex items-center gap-2 text-[20px] font-extrabold leading-tight text-slate-900">
        <span className="h-2.5 w-2.5 rounded-full bg-sheti" aria-hidden="true" />
        {label} {required ? <span className="text-tatkal">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-2 block text-[18px] font-semibold leading-snug text-slate-500">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
