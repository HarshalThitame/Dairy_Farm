import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import StatusBadge, { getStatusBorderClass } from "@/components/StatusBadge";
import {
  calculateAgeMarathi,
  formatCowBreed
} from "@/lib/marathiUtils";

export default function CowCard({ cow }) {
  const borderClass = getStatusBorderClass(cow.status);

  return (
    <article
      className={`rounded-lg border border-l-4 border-slate-200 bg-white p-4 shadow-soft ${borderClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {cow.photo_url ? (
            <img src={cow.photo_url} alt={cow.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[36px]">🐄</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 text-[24px] font-extrabold leading-tight text-slate-950">
              {cow.name}
            </h2>
            <StatusBadge status={cow.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-[18px] font-semibold leading-snug text-slate-700">
        <p>
          जात: {formatCowBreed(cow.breed)} <span className="text-slate-300">|</span>{" "}
          रंग: {cow.color || "माहिती नाही"}
        </p>
        <p>वय: {calculateAgeMarathi(cow.date_of_birth)}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href={`/gayi/${cow.id}`}
          className="flex min-h-[52px] items-center justify-center rounded-lg bg-sheti px-3 text-center text-[18px] font-extrabold leading-tight text-white shadow-sm active:bg-green-700"
        >
          👁 माहिती बघा
        </Link>
        <Link
          href="/nondi/dudh"
          className="flex min-h-[52px] items-center justify-center rounded-lg border-2 border-green-200 bg-green-50 px-3 text-center text-[18px] font-extrabold leading-tight text-sheti active:bg-green-100"
        >
          🥛 दैनिक दूध
        </Link>
      </div>
    </article>
  );
}
