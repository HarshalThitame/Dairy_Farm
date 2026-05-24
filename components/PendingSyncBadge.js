"use client";

import { useCallback, useEffect, useState } from "react";
import { getPendingSyncCount } from "@/lib/localDB";
import { toMarathiNumerals } from "@/lib/marathiUtils";

export default function PendingSyncBadge() {
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async () => {
    setCount(await getPendingSyncCount());
  }, []);

  useEffect(() => {
    refreshCount();

    window.addEventListener("pending-sync-change", refreshCount);
    window.addEventListener("sync-complete", refreshCount);
    window.addEventListener("offline-save", refreshCount);

    const interval = window.setInterval(refreshCount, 15000);

    return () => {
      window.removeEventListener("pending-sync-change", refreshCount);
      window.removeEventListener("sync-complete", refreshCount);
      window.removeEventListener("offline-save", refreshCount);
      window.clearInterval(interval);
    };
  }, [refreshCount]);

  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute right-1 top-1 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tatkal px-1 text-[14px] font-extrabold leading-none text-white">
      {toMarathiNumerals(count)}
    </span>
  );
}
