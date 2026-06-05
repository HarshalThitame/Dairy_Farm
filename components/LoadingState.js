import BrandLockup from "@/components/BrandLockup";

export default function LoadingState({ text = "माहिती लोड होत आहे..." }) {
  return (
    <div className="loading-state-shell flex min-h-[55vh] items-center justify-center px-3 py-8 text-center">
      <section
        className="loading-state-panel relative w-full max-w-md overflow-hidden rounded-lg border border-white/85 bg-white/80 px-5 py-7 shadow-soft backdrop-blur"
        role="status"
        aria-live="polite"
      >
        <div className="loading-state-topline" aria-hidden="true" />
        <div className="loading-state-sheen" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="loading-state-brand relative flex min-h-[86px] w-full items-center justify-center">
            <div className="loading-state-ring loading-state-ring-outer" aria-hidden="true" />
            <div className="loading-state-ring loading-state-ring-inner" aria-hidden="true" />
            <BrandLockup size="sm" center className="relative z-10" />
          </div>

          <div className="loading-state-meter mt-6" aria-hidden="true">
            <span className="loading-state-meter-fill" />
          </div>

          <p className="mt-5 text-[22px] font-extrabold leading-snug text-slate-900">
            {text}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
            <span className="loading-state-dot loading-state-dot-green" />
            <span className="loading-state-dot loading-state-dot-sky" />
            <span className="loading-state-dot loading-state-dot-amber" />
          </div>
        </div>
      </section>
    </div>
  );
}
