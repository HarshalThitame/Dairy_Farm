"use client";

const PREFIX = "majhi-dairy-cow-snapshot:";
const MAX_AGE_MS = 10 * 60 * 1000;

function keyForCow(cowId) {
  return `${PREFIX}${cowId}`;
}

function normalizeCowSnapshot(cow) {
  if (!cow?.id) return null;
  return {
    id: cow.id,
    farm_id: cow.farm_id || "",
    name: cow.name || "",
    breed: cow.breed || "",
    date_of_birth: cow.date_of_birth || null,
    tag_number: cow.tag_number || "",
    color: cow.color || "",
    status: cow.status || "रिकामी",
    purchased_on: cow.purchased_on || null,
    notes: cow.notes || "",
    photo_url: cow.photo_url || "",
    photo_storage_path: cow.photo_storage_path || "",
    is_active: cow.is_active !== false,
    cached_at: new Date().toISOString()
  };
}

export function cacheCowSnapshot(cow) {
  if (typeof window === "undefined") return;
  const snapshot = normalizeCowSnapshot(cow);
  if (!snapshot) return;

  try {
    const payload = JSON.stringify(snapshot);
    window.sessionStorage.setItem(keyForCow(snapshot.id), payload);
    window.localStorage.setItem(keyForCow(snapshot.id), payload);
  } catch {
    // Instant navigation cache is best-effort only.
  }
}

export function getCowSnapshot(cowId) {
  if (typeof window === "undefined" || !cowId) return null;

  try {
    const raw = window.sessionStorage.getItem(keyForCow(cowId))
      || window.localStorage.getItem(keyForCow(cowId));
    if (!raw) return null;

    const snapshot = JSON.parse(raw);
    const cachedAt = new Date(snapshot.cached_at || 0).getTime();
    if (!cachedAt || Date.now() - cachedAt > MAX_AGE_MS) {
      return null;
    }

    return snapshot?.id ? snapshot : null;
  } catch {
    return null;
  }
}
