"use client";

import AnimatedNumber from "@/components/home/AnimatedNumber";
import DairyConfetti from "@/components/home/DairyConfetti";
import { formatLitres, toMarathiNumerals } from "@/lib/marathiUtils";

export default function MilkWaveProgress({ current = 0, target = 300, enabled = true }) {
  const currentValue = Math.max(0, Number(current || 0));
  const targetValue = Math.max(1, Number(target || 300));
  const progress = Math.min((currentValue / targetValue) * 100, 100);
  const progressText = toMarathiNumerals(progress.toFixed(0));
  const remainingLiters = Math.max(0, targetValue - currentValue);
  const completed = enabled && currentValue >= targetValue;
  const isDisabled = enabled === false;
  const statusText = isDisabled
    ? "लक्ष्य बंद आहे"
    : completed
      ? "लक्ष्य पूर्ण"
      : "काम सुरू";
  const helperText = isDisabled
    ? "लक्ष्य सुरू केल्यावर आजची प्रगती येथे दिसेल."
    : completed
      ? "अभिनंदन! आजचे दूध लक्ष्य पूर्ण झाले."
      : `${toMarathiNumerals(remainingLiters.toFixed(0))} लिटर बाकी`;
  const meterLabel = `दूध लक्ष्य ${progressText}%`;

  return (
    <section
      className={`milk-goal-card dashboard-card rounded-lg border p-4 shadow-soft ${
        completed
          ? "border-emerald-200 bg-emerald-50"
          : isDisabled
            ? "border-slate-200 bg-white"
            : "border-sky-100 bg-white"
      }`}
      style={{
        "--milk-goal-progress": `${progress}%`,
        "--milk-goal-mid-progress": `${progress * 0.72}%`
      }}
    >
      <DairyConfetti active={completed} />

      <div className="relative z-10 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full bg-slate-950 px-3 py-1 text-[14px] font-extrabold text-white">
              आजचे लक्ष्य
            </p>
            <p
              className={`rounded-full px-3 py-1 text-[14px] font-extrabold ${
                completed
                  ? "bg-emerald-600 text-white"
                  : isDisabled
                    ? "bg-slate-100 text-slate-600"
                    : "bg-sky-100 text-sky-800"
              }`}
            >
              {statusText}
            </p>
          </div>

          <h2 className="mt-3 text-[30px] font-black leading-tight text-slate-950">
            <AnimatedNumber
              value={currentValue}
              formatter={(value) => `${formatLitres(value)} लिटर`}
            />
          </h2>
          <p className="mt-1 text-[16px] font-extrabold leading-snug text-slate-600">
            लक्ष्य: {formatLitres(targetValue)} लिटर
          </p>

          <div className="mt-4">
            <div className="milk-goal-rail" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(progress.toFixed(0))} aria-label={meterLabel}>
              <span className="milk-goal-rail-fill" />
              <span className="milk-goal-rail-glow" />
            </div>
            <div className="mt-2 flex justify-between text-[12px] font-extrabold text-slate-500" aria-hidden="true">
              <span>०%</span>
              <span>५०%</span>
              <span>१००%</span>
            </div>
          </div>

          <p
            className={`mt-3 text-[17px] font-extrabold leading-snug ${
              completed ? "text-emerald-800" : isDisabled ? "text-slate-500" : "text-sky-800"
            }`}
          >
            {helperText}
          </p>
        </div>

        <div className="milk-goal-gauge mx-auto" aria-label={meterLabel}>
          <div className="milk-goal-gauge-core">
            <span className="text-[30px] font-black leading-none text-slate-950">
              <AnimatedNumber
                value={progress}
                formatter={(value) => `${toMarathiNumerals(value.toFixed(0))}%`}
              />
            </span>
            <span className="mt-1 text-[13px] font-extrabold text-slate-500">
              पूर्ण
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
