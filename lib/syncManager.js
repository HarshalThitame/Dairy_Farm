"use client";

import {
  cacheAIRecords,
  cacheCows,
  cacheDairySlips,
  cacheHealthRecords,
  cacheMilkRecords,
  cacheMonthlyExpenses,
  cacheReminders,
  cacheSettlements,
  getPendingSync,
  markSynced,
  markSyncFailed,
  replaceCachedReminders,
  updateCachedCow
} from "@/lib/localDB";
import { isOnline } from "@/lib/networkStatus";
import { addDaysToISODate, getTodayISODate } from "@/lib/reminderUtils";

const CACHE_REFRESH_KEY = "goshala-cache-refreshed-at";
const CACHE_REFRESH_TTL_MS = 10 * 60 * 1000;

function dispatchEvent(name, detail = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

function getEntityLabel(entity) {
  const labels = {
    milk: "दूध नोंद",
    ai: "रेतन नोंद",
    health: "आरोग्य नोंद",
    cow: "गाय",
    finance: "हिशोब नोंद",
    calving: "व्यायण नोंद",
    vaccination: "लसीकरण नोंद",
    reminder: "आठवण",
    dairy_slip: "दूध नोंद",
    settlement: "सेटलमेंट",
    accounting_expense: "हिशोब खर्च"
  };

  return labels[entity] || "नोंद";
}

function getStoredToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }

  return localStorage.getItem("goshala_token") || "";
}

function getLastCacheRefreshTime() {
  if (typeof localStorage === "undefined") {
    return 0;
  }

  return Number(localStorage.getItem(CACHE_REFRESH_KEY) || 0);
}

function setLastCacheRefreshTime() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CACHE_REFRESH_KEY, String(Date.now()));
  }
}

function shouldRefreshCache(force = false) {
  if (force) {
    return true;
  }

  return Date.now() - getLastCacheRefreshTime() > CACHE_REFRESH_TTL_MS;
}

function getAuthHeader(record) {
  const token = record?.token || getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function updateLocalCache(entity, data) {
  if (!data) {
    return;
  }

  if (entity === "cow") {
    if (Array.isArray(data)) {
      await cacheCows(data);
    } else {
      await updateCachedCow(data);
    }
  } else if (entity === "milk") {
    await cacheMilkRecords(Array.isArray(data) ? data : [data]);
  } else if (entity === "health" || entity === "vaccination") {
    await cacheHealthRecords(Array.isArray(data) ? data : [data]);
  } else if (entity === "ai") {
    await cacheAIRecords(Array.isArray(data) ? data : [data]);
  } else if (entity === "reminder") {
    await cacheReminders(Array.isArray(data) ? data : [data]);
  } else if (entity === "dairy_slip") {
    const records = Array.isArray(data) ? data : [data.slip || data];
    await cacheDairySlips(records.filter(Boolean));
  } else if (entity === "settlement") {
    const records = Array.isArray(data) ? data : [data.settlement || data];
    await cacheSettlements(records.filter(Boolean));
  } else if (entity === "accounting_expense") {
    const records = Array.isArray(data) ? data : [data.expense || data];
    await cacheMonthlyExpenses(records.filter(Boolean));
  } else if (entity === "calving") {
    if (data.cow) {
      await updateCachedCow(data.cow);
    }

    if (data.reminder) {
      await cacheReminders([data.reminder]);
    }

    if (data.completedReminders?.length > 0) {
      await cacheReminders(data.completedReminders);
    } else if (data.completedReminder) {
      await cacheReminders([data.completedReminder]);
    }
  }
}

function getMonthYear(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
}

async function fetchJsonSafely(url) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: getAuthHeader()
    });
    const result = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      data: result.data || [],
      error: response.ok ? null : result.error || "माहिती मिळाली नाही."
    };
  } catch (error) {
    return {
      ok: false,
      data: [],
      error: error?.message || "माहिती मिळाली नाही."
    };
  }
}

export async function resolveConflict(localRecord, serverRecord) {
  if (!serverRecord) {
    return localRecord;
  }

  if (localRecord.entity === "milk") {
    return {
      ...serverRecord,
      morning_litres: Math.max(
        Number(localRecord.payload?.morning_litres || 0),
        Number(serverRecord.morning_litres || 0)
      ),
      evening_litres: Math.max(
        Number(localRecord.payload?.evening_litres || 0),
        Number(serverRecord.evening_litres || 0)
      ),
      price_per_litre:
        localRecord.payload?.price_per_litre ?? serverRecord.price_per_litre ?? null,
      morning_price_per_litre:
        localRecord.payload?.morning_price_per_litre ??
        serverRecord.morning_price_per_litre ??
        null,
      evening_price_per_litre:
        localRecord.payload?.evening_price_per_litre ??
        serverRecord.evening_price_per_litre ??
        null,
      fat_percentage:
        localRecord.payload?.fat_percentage ?? serverRecord.fat_percentage ?? null,
      morning_fat_percentage:
        localRecord.payload?.morning_fat_percentage ??
        serverRecord.morning_fat_percentage ??
        null,
      evening_fat_percentage:
        localRecord.payload?.evening_fat_percentage ??
        serverRecord.evening_fat_percentage ??
        null,
      snf_value: localRecord.payload?.snf_value ?? serverRecord.snf_value ?? null,
      morning_snf_value:
        localRecord.payload?.morning_snf_value ?? serverRecord.morning_snf_value ?? null,
      evening_snf_value:
        localRecord.payload?.evening_snf_value ?? serverRecord.evening_snf_value ?? null,
      degree_reading:
        localRecord.payload?.degree_reading ?? serverRecord.degree_reading ?? null,
      morning_degree_reading:
        localRecord.payload?.morning_degree_reading ??
        serverRecord.morning_degree_reading ??
        null,
      evening_degree_reading:
        localRecord.payload?.evening_degree_reading ??
        serverRecord.evening_degree_reading ??
        null
    };
  }

  if (localRecord.entity === "cow") {
    return {
      ...localRecord.payload,
      status: serverRecord.status
    };
  }

  if (localRecord.entity === "reminder" && localRecord.payload?.action === "done") {
    return {
      ...serverRecord,
      is_done: true
    };
  }

  return localRecord.payload;
}

async function syncMilkWithConflict(record) {
  const payload = record.payload || {};

  if (record.method !== "POST" || !payload.date) {
    return null;
  }

  const query = payload.cow_id
    ? `/api/milk?date=${encodeURIComponent(payload.date)}&cow_id=${encodeURIComponent(payload.cow_id)}`
    : `/api/milk?date=${encodeURIComponent(payload.date)}`;
  const existingResponse = await fetch(query, {
    cache: "no-store",
    headers: getAuthHeader(record)
  });

  if (!existingResponse.ok) {
    return null;
  }

  const existingResult = await existingResponse.json();
  const existingRecord = existingResult.data?.[0];

  if (!existingRecord) {
    return null;
  }

  const resolved = await resolveConflict(record, existingRecord);
  const response = await fetch(`/api/milk/${existingRecord.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader(record) },
    body: JSON.stringify(resolved)
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "दूध नोंद समक्रमित झाली नाही.");
  }

  return result.data;
}

async function shouldSkipDuplicateFinance(record) {
  if (record.entity !== "finance" || record.method !== "POST" || !record.payload?.date) {
    return false;
  }

  const { month, year } = getMonthYear(record.payload.date);
  const response = await fetch(`/api/finance?month=${month}&year=${year}`, {
    cache: "no-store",
    headers: getAuthHeader(record)
  });

  if (!response.ok) {
    return false;
  }

  const result = await response.json();

  return (result.data || []).some(
    (item) =>
      String(item.date) === String(record.payload.date) &&
      String(item.category || "") === String(record.payload.category || "") &&
      Number(item.amount || 0) === Number(record.payload.amount || 0) &&
      String(item.type || "") === String(record.payload.type || "")
  );
}

async function syncSingleRecord(record) {
  const milkConflictData = await syncMilkWithConflict(record);

  if (milkConflictData) {
    return milkConflictData;
  }

  if (await shouldSkipDuplicateFinance(record)) {
    return record.payload;
  }

  const response = await fetch(record.endpoint, {
    method: record.method,
    headers: { "Content-Type": "application/json", ...getAuthHeader(record) },
    body: record.method === "GET" ? undefined : JSON.stringify(record.payload || {})
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "समक्रमण चुकले.");
  }

  return result.data || record.payload;
}

export async function syncAllPending() {
  if (!isOnline()) {
    return { offline: true };
  }

  const records = await getPendingSync();
  let synced = 0;
  let failed = 0;

  dispatchEvent("sync-start", { count: records.length });

  for (const record of records) {
    try {
      const data = await syncSingleRecord(record);
      await markSynced(record.localId);
      await updateLocalCache(record.entity, data);
      synced += 1;
      dispatchEvent("sync-success", {
        entity: record.entity,
        label: getEntityLabel(record.entity),
        record
      });
    } catch (error) {
      failed += 1;
      await markSyncFailed(record.localId, error);
      dispatchEvent("sync-failed", {
        entity: record.entity,
        label: getEntityLabel(record.entity),
        error: error.message
      });
    }
  }

  dispatchEvent("sync-complete", { synced, failed });
  return { synced, failed };
}

export async function syncEntity(entity) {
  if (!isOnline()) {
    return { offline: true };
  }

  const allRecords = await getPendingSync();
  const records = allRecords.filter((record) => record.entity === entity);
  let synced = 0;
  let failed = 0;

  dispatchEvent("sync-start", { count: records.length });

  for (const record of records) {
    try {
      const data = await syncSingleRecord(record);
      await markSynced(record.localId);
      await updateLocalCache(record.entity, data);
      synced += 1;
      dispatchEvent("sync-success", {
        entity: record.entity,
        label: getEntityLabel(record.entity),
        record
      });
    } catch (error) {
      failed += 1;
      await markSyncFailed(record.localId, error);
    }
  }

  dispatchEvent("sync-complete", { synced, failed });
  return { synced, failed };
}

export async function refreshCacheFromServer() {
  if (!isOnline()) {
    return { offline: true };
  }

  const [cowsResult, remindersResult, milkResult] = await Promise.all([
    fetchJsonSafely("/api/cows"),
    fetchJsonSafely("/api/reminders?filter=week"),
    fetchJsonSafely("/api/milk?days=7")
  ]);

  if (cowsResult.ok) {
    await cacheCows(cowsResult.data || []);
  }

  if (remindersResult.ok) {
    const today = getTodayISODate();
    const weekEnd = addDaysToISODate(today, 7);
    await replaceCachedReminders(
      remindersResult.data || [],
      (reminder) =>
        reminder.reminder_date >= today &&
        reminder.reminder_date <= weekEnd &&
        !reminder.is_done
    );
  }

  if (milkResult.ok) {
    await cacheMilkRecords(milkResult.data || []);
  }

  const refreshed = [cowsResult, remindersResult, milkResult].filter((result) => result.ok).length;

  if (refreshed > 0) {
    setLastCacheRefreshTime();
    dispatchEvent("cache-refreshed", { refreshed });
  }

  return {
    refreshed,
    failed: 3 - refreshed
  };
}

export function registerBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      if ("sync" in registration) {
        return registration.sync.register("goshala-sync");
      }

      return null;
    })
    .catch(() => {});
}

export async function checkNetworkAndSync(options = {}) {
  if (!isOnline()) {
    return { offline: true };
  }

  const pendingRecords = await getPendingSync();
  const syncResult = pendingRecords.length > 0 ? await syncAllPending() : { synced: 0, failed: 0 };
  const cacheResult =
    pendingRecords.length > 0 || shouldRefreshCache(Boolean(options.forceCacheRefresh))
      ? await refreshCacheFromServer()
      : { refreshed: 0, failed: 0, skipped: true };

  return { ...syncResult, cache: cacheResult };
}
