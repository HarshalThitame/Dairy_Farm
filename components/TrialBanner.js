"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { toMarathiNumerals } from "@/lib/marathiUtils";

function daysBetweenToday(dateString) {
  if (!dateString) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dateString);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TrialBanner() {
  const { farm } = useAuth();
  const daysLeft = useMemo(() => daysBetweenToday(farm?.trialEndsAt), [farm?.trialEndsAt]);

  if (!farm || farm.subscriptionStatus !== "trial" || daysLeft === null) {
    return null;
  }

  if (daysLeft > 7) {
    return (
      <div className="dashboard-card rounded-lg border border-green-200 bg-green-50 p-4 text-[18px] font-extrabold text-green-800 shadow-soft">
        🎉 आपल्याकडे {toMarathiNumerals(daysLeft)} दिवसांचा चाचणी कालावधी आहे.
      </div>
    );
  }

  if (daysLeft >= 0) {
    return (
      <div className="dashboard-card rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-[18px] font-extrabold text-yellow-900 shadow-soft">
        ⚠️ आपला चाचणी कालावधी {toMarathiNumerals(daysLeft || 1)} दिवसांत संपणार आहे.
      </div>
    );
  }

  return (
    <div className="dashboard-card rounded-lg border border-red-200 bg-red-50 p-4 text-[18px] font-extrabold text-red-800 shadow-soft">
      🔒 आपला चाचणी कालावधी संपला आहे.
    </div>
  );
}
