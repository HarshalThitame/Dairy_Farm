"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function VeterinarianSelect({
  value,
  onChange,
  label = "पशुवैद्यकाचे नाव",
  className = "",
  allowEmpty = true
}) {
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVeterinarians = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/settings/veterinarians?active=true", {
        cache: "no-store"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "पशुवैद्यकांची यादी मिळाली नाही.");
      }

      setVeterinarians(result.data || []);
    } catch (loadError) {
      setError(loadError.message || "पशुवैद्यकांची यादी मिळाली नाही.");
      setVeterinarians([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVeterinarians();
  }, [loadVeterinarians]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[20px] font-extrabold text-slate-900">{label}</span>
        <Link
          href="/settings/veterinarians"
          className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-[14px] font-black text-sheti ring-1 ring-green-100"
        >
          + नवीन
        </Link>
      </div>

      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading}
        className={
          className ||
          "min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 outline-none focus:border-sheti focus:ring-4 focus:ring-green-100 disabled:bg-slate-50 disabled:text-slate-500"
        }
      >
        {allowEmpty ? (
          <option value="">
            {loading ? "यादी लोड होत आहे..." : "पशुवैद्यक निवडा"}
          </option>
        ) : null}
        {veterinarians.map((doctor) => (
          <option key={doctor.id} value={doctor.name}>
            {doctor.name}
            {doctor.mobile ? ` - ${doctor.mobile}` : ""}
          </option>
        ))}
      </select>

      {!loading && veterinarians.length === 0 ? (
        <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-[15px] font-bold text-yellow-900">
          अजून पशुवैद्यक जोडलेले नाहीत. Settings मधून नाव जोडा, मग इथे dropdown मध्ये दिसेल.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-[15px] font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
