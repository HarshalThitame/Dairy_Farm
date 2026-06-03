"use client";

function SkeletonBlock({ className = "" }) {
  return <div className={`home-skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

export default function HomeSkeleton() {
  return (
    <div className="space-y-5 pb-2" aria-label="मुख्यपृष्ठ लोड होत आहे">
      <section className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-soft">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="mt-4 h-10 w-64 max-w-full" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <SkeletonBlock className="h-[122px]" />
        <SkeletonBlock className="h-[122px]" />
        <SkeletonBlock className="h-[122px]" />
      </section>

      <section className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-soft">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-20 w-20 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="mt-3 h-8 w-full" />
            <SkeletonBlock className="mt-3 h-4 w-3/4" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
      </section>
    </div>
  );
}
