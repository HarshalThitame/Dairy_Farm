"use client";

import AnimatedNumber from "@/components/home/AnimatedNumber";
import DairyConfetti from "@/components/home/DairyConfetti";
import { formatLitres, toMarathiNumerals } from "@/lib/marathiUtils";

export default function MilkWaveProgress({ current = 0, target = 300, enabled = true }) {
  const currentValue = Math.max(0, Number(current || 0));
  const targetValue = Math.max(1, Number(target || 300));
  const progress = Math.min((currentValue / targetValue) * 100, 100);
  const completed = enabled && currentValue >= targetValue;

  return (
    <section className="milk-wave-card dashboard-card rounded-lg border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-green-50 p-4 shadow-soft">
      <DairyConfetti active={completed} />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold text-blue-700">आजचे लक्ष्य</p>
          <h2 className="mt-1 text-[25px] font-black leading-tight text-slate-950">
            <AnimatedNumber
              value={currentValue}
              formatter={(value) => `${formatLitres(value)} / ${formatLitres(targetValue)} लिटर`}
            />
          </h2>
          <p className="mt-2 text-[16px] font-bold leading-snug text-slate-600">
            {completed ? "🎉 अभिनंदन! आजचे लक्ष्य पूर्ण झाले." : `${toMarathiNumerals(Math.max(0, targetValue - currentValue).toFixed(0))} लिटर बाकी`}
          </p>
        </div>

        <div className="milk-wave-bottle" aria-label={`दूध लक्ष्य ${toMarathiNumerals(progress.toFixed(0))}%`}>
          <div className="milk-wave-fill" style={{ height: `${progress}%` }}>
            <span className="milk-wave-surface milk-wave-surface-one" />
            <span className="milk-wave-surface milk-wave-surface-two" />
            <span className="milk-bubble milk-bubble-one" />
            <span className="milk-bubble milk-bubble-two" />
          </div>
          <span className="milk-wave-percent">
            {toMarathiNumerals(progress.toFixed(0))}%
          </span>
        </div>
      </div>
    </section>
  );
}
