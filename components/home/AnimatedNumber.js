"use client";

import { useEffect, useMemo, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("majhi-reduce-motion");
}

export default function AnimatedNumber({
  value,
  formatter = (nextValue) => nextValue,
  duration = 720,
  className = ""
}) {
  const numericValue = useMemo(() => Number(value || 0), [value]);
  const [displayValue, setDisplayValue] = useState(numericValue);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(numericValue);
      return undefined;
    }

    const startValue = 0;
    const startTime = performance.now();
    let frameId = 0;

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (numericValue - startValue) * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [duration, numericValue]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
