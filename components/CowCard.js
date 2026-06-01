import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import StatusBadge, { getStatusBorderClass } from "@/components/StatusBadge";
import {
  calculateAgeMarathi,
  formatCowBreed,
  formatMarathiDate
} from "@/lib/marathiUtils";

export default function CowCard({ cow }) {
  const borderClass = getStatusBorderClass(cow.status);

  return (
    <Link
      href={`/gayi/${cow.id}`}
      className={`dashboard-card group block overflow-hidden rounded-lg border border-l-4 border-slate-200 bg-white/95 shadow-soft backdrop-blur active:bg-green-50 ${borderClass}`}
      aria-label={`${cow.name} माहिती बघा`}
    >
      <article className="relative p-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 via-sky-400 to-amber-400" />
        <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-gradient-to-bl from-green-100/70 via-sky-50/80 to-transparent" />

        <div className="relative flex items-start gap-3">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white bg-gradient-to-br from-green-50 via-white to-sky-50 shadow-sm ring-1 ring-slate-100 sm:h-28 sm:w-28">
            {cow.photo_url ? (
              <img src={cow.photo_url} alt={cow.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[44px]">🐄</div>
            )}
            {cow.tag_number ? (
              <span className="absolute bottom-1 left-1 rounded bg-white/90 px-2 py-0.5 text-[12px] font-extrabold text-slate-700 shadow-sm">
                #{cow.tag_number}
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-[25px] font-extrabold leading-tight text-slate-950">
                  {cow.name}
                </h2>
                <p className="mt-1 break-words text-[17px] font-bold leading-snug text-slate-500">
                  {formatCowBreed(cow.breed)}
                  {cow.color ? ` • ${cow.color}` : ""}
                </p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={cow.status} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[16px] font-bold leading-snug text-slate-700">
              <div className="rounded-lg bg-slate-50 px-3 py-2 shadow-sm ring-1 ring-slate-100">
                <span className="block text-[13px] font-extrabold text-slate-400">वय</span>
                {calculateAgeMarathi(cow.date_of_birth)}
              </div>
              <div className="rounded-lg bg-green-50 px-3 py-2 text-green-900 shadow-sm ring-1 ring-green-100">
                <span className="block text-[13px] font-extrabold text-green-500">स्थिती</span>
                {cow.status || "रिकामी"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="min-w-0 break-words text-[15px] font-bold leading-snug text-slate-500">
            {cow.purchased_on ? `खरेदी: ${formatMarathiDate(cow.purchased_on)}` : cow.notes || "तपशील पाहण्यासाठी टॅप करा"}
          </p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[20px] font-extrabold text-white transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </div>
      </article>
    </Link>
  );
}
