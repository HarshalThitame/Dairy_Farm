"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatCowBreed } from "@/lib/marathiUtils";
import { fetchCows as fetchCowsOffline } from "@/lib/offlineActions";

const preferredStatuses = ["रिकामी", "गाभण"];

function sortCows(cows) {
  return [...cows].sort((first, second) => {
    const firstPreferred = preferredStatuses.includes(first.status) ? 0 : 1;
    const secondPreferred = preferredStatuses.includes(second.status) ? 0 : 1;

    if (firstPreferred !== secondPreferred) {
      return firstPreferred - secondPreferred;
    }

    return first.name.localeCompare(second.name, "mr-IN");
  });
}

export default function CowSelector({
  onSelect,
  selectedCow,
  placeholder = "गायीचे नाव शोधा...",
  initialCowId
}) {
  const [cows, setCows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCows() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchCowsOffline();

        setCows(sortCows(result.data || []));
      } catch (fetchError) {
        setError(fetchError.message || "गायींची माहिती मिळाली नाही.");
      } finally {
        setLoading(false);
      }
    }

    fetchCows();
  }, []);

  useEffect(() => {
    if (!initialCowId || selectedCow || cows.length === 0) {
      return;
    }

    const initialCow = cows.find((cow) => cow.id === initialCowId);

    if (initialCow) {
      onSelect(initialCow);
    }
  }, [cows, initialCowId, onSelect, selectedCow]);

  const filteredCows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("mr-IN");

    if (!normalizedQuery) {
      return cows;
    }

    return cows.filter((cow) =>
      cow.name.toLocaleLowerCase("mr-IN").includes(normalizedQuery)
    );
  }, [cows, query]);

  if (selectedCow) {
    return (
      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[22px] font-extrabold leading-tight text-slate-950">
              {selectedCow.name}
            </p>
            <p className="mt-1 text-[18px] font-semibold text-slate-700">
              जात: {formatCowBreed(selectedCow.breed)}
            </p>
            <div className="mt-2">
              <StatusBadge status={selectedCow.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-lg border-2 border-green-200 bg-white text-[22px] font-extrabold text-slate-700 active:bg-green-100"
            aria-label="निवड काढा"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="min-h-[56px] w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-[20px] font-semibold text-slate-950 shadow-sm outline-none focus:border-sheti focus:ring-4 focus:ring-green-100"
      />

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-[19px] font-bold text-slate-700">
          गायी लोड होत आहेत...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[19px] font-bold text-red-800">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="max-h-[420px] space-y-2 overflow-y-auto">
          {filteredCows.map((cow) => (
            <button
              key={cow.id}
              type="button"
              onClick={() => onSelect(cow)}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm active:bg-green-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[21px] font-extrabold leading-tight text-slate-950">
                    {cow.name}
                  </p>
                  <p className="mt-1 text-[18px] font-semibold text-slate-600">
                    जात: {formatCowBreed(cow.breed)}
                  </p>
                </div>
                <StatusBadge status={cow.status} />
              </div>
            </button>
          ))}

          {filteredCows.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-4 text-center text-[19px] font-bold text-slate-600">
              या नावाची गाय सापडली नाही.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
