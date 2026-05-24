export default function FormField({ label, required = false, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[20px] font-extrabold leading-tight text-slate-900">
        {label} {required ? <span className="text-tatkal">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-2 block text-[18px] font-semibold leading-snug text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
