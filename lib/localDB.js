"use client";

import { openDB } from "idb";
import { addDaysToISODate, getTodayISODate } from "@/lib/reminderUtils";

const DB_NAME = "goshala-local";
const DB_VERSION = 2;

function hasIndexedDB() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

async function getDB() {
  if (!hasIndexedDB()) {
    return null;
  }

  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains("pending_sync")) {
        const store = db.createObjectStore("pending_sync", {
          keyPath: "localId",
          autoIncrement: true
        });
        store.createIndex("type", "type");
        store.createIndex("createdAt", "createdAt");
        store.createIndex("synced", "synced");
      }

      let store;

      if (!db.objectStoreNames.contains("cows_cache")) {
        store = db.createObjectStore("cows_cache", { keyPath: "id" });
        store.createIndex("name", "name");
        store.createIndex("status", "status");
        store.createIndex("updatedAt", "updatedAt");
      } else {
        store = transaction.objectStore("cows_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("milk_cache")) {
        store = db.createObjectStore("milk_cache", { keyPath: "id" });
        store.createIndex("cow_id", "cow_id");
        store.createIndex("date", "date");
      } else {
        store = transaction.objectStore("milk_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("reminders_cache")) {
        store = db.createObjectStore("reminders_cache", { keyPath: "id" });
        store.createIndex("reminder_date", "reminder_date");
        store.createIndex("is_done", "is_done");
        store.createIndex("type", "type");
      } else {
        store = transaction.objectStore("reminders_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("health_cache")) {
        store = db.createObjectStore("health_cache", { keyPath: "id" });
        store.createIndex("cow_id", "cow_id");
        store.createIndex("date", "date");
        store.createIndex("type", "type");
      } else {
        store = transaction.objectStore("health_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("ai_cache")) {
        store = db.createObjectStore("ai_cache", { keyPath: "id" });
        store.createIndex("cow_id", "cow_id");
        store.createIndex("ai_date", "ai_date");
      } else {
        store = transaction.objectStore("ai_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }
    }
  });
}

function nowISO() {
  return new Date().toISOString();
}

function tempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dispatchPendingChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pending-sync-change"));
  }
}

export function getCurrentFarmId() {
  if (typeof localStorage === "undefined") {
    return "";
  }

  try {
    const farm = JSON.parse(localStorage.getItem("goshala_farm") || "null");
    return farm?.id || "";
  } catch {
    return "";
  }
}

function matchesFarm(record, farmId) {
  return !farmId || record.farm_id === farmId;
}

async function getAllFromStore(storeName) {
  try {
    const db = await getDB();
    return db ? db.getAll(storeName) : [];
  } catch {
    return [];
  }
}

export async function addToPendingSync(action) {
  try {
    const db = await getDB();

    if (!db) {
      return null;
    }

    const localId = await db.add("pending_sync", {
      ...action,
      createdAt: action.createdAt || nowISO(),
      synced: false,
      syncError: null,
      retryCount: 0,
      permanentFail: false
    });

    dispatchPendingChange();
    return localId;
  } catch {
    return null;
  }
}

export async function getPendingSync() {
  const records = await getAllFromStore("pending_sync");
  const farmId = getCurrentFarmId();

  return records
    .filter((record) => !record.synced && !record.permanentFail && matchesFarm(record, farmId))
    .sort((first, second) => String(first.createdAt).localeCompare(String(second.createdAt)));
}

export async function getAllSyncRecords() {
  const records = await getAllFromStore("pending_sync");
  const farmId = getCurrentFarmId();

  return records
    .filter((record) => matchesFarm(record, farmId))
    .sort((first, second) => String(second.createdAt).localeCompare(String(first.createdAt)));
}

export async function getRecentlySynced(limit = 10) {
  const records = await getAllSyncRecords();

  return records
    .filter((record) => record.synced)
    .sort((first, second) => String(second.syncedAt || "").localeCompare(String(first.syncedAt || "")))
    .slice(0, limit);
}

export async function markSynced(localId) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const record = await db.get("pending_sync", localId);

    if (record) {
      await db.put("pending_sync", {
        ...record,
        synced: true,
        syncedAt: nowISO(),
        syncError: null,
        permanentFail: false
      });
      localStorage.setItem("goshala-last-sync", nowISO());
      dispatchPendingChange();
    }
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function markSyncFailed(localId, error) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const record = await db.get("pending_sync", localId);

    if (record) {
      const retryCount = Number(record.retryCount || 0) + 1;
      await db.put("pending_sync", {
        ...record,
        retryCount,
        syncError: String(error?.message || error || "समक्रमण चुकले."),
        permanentFail: retryCount > 3
      });
      dispatchPendingChange();
    }
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function getPendingSyncCount() {
  const records = await getPendingSync();
  return records.length;
}

export async function clearSyncedRecords() {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const records = await db.getAll("pending_sync");
    const tx = db.transaction("pending_sync", "readwrite");

    await Promise.all(
      records
        .filter((record) => record.synced)
        .map((record) => tx.store.delete(record.localId))
    );
    await tx.done;
    dispatchPendingChange();
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function deleteSyncRecord(localId) {
  try {
    const db = await getDB();

    if (db) {
      await db.delete("pending_sync", localId);
      dispatchPendingChange();
    }
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function resetSyncRecord(localId) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const record = await db.get("pending_sync", localId);

    if (record) {
      await db.put("pending_sync", {
        ...record,
        synced: false,
        syncError: null,
        retryCount: 0,
        permanentFail: false
      });
      dispatchPendingChange();
    }
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function cacheCows(cowsArray, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const existing = await db.getAll("cows_cache");
    const tx = db.transaction("cows_cache", "readwrite");
    await Promise.all(existing.filter((cow) => matchesFarm(cow, farmId)).map((cow) => tx.store.delete(cow.id)));
    await Promise.all(
      (cowsArray || []).map((cow) =>
        tx.store.put({
          ...cow,
          farm_id: cow.farm_id || farmId,
          updatedAt: cow.updatedAt || nowISO()
        })
      )
    );
    await tx.done;
    localStorage.setItem("goshala-cows-fetched-at", nowISO());
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function getCachedCows(farmId = getCurrentFarmId()) {
  const cows = await getAllFromStore("cows_cache");
  return cows
    .filter((cow) => cow.is_active !== false && matchesFarm(cow, farmId))
    .sort((first, second) => String(first.name || "").localeCompare(String(second.name || ""), "mr-IN"));
}

export async function getCachedCow(id, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();
    const cow = db ? await db.get("cows_cache", id) : null;
    return cow && matchesFarm(cow, farmId) ? cow : null;
  } catch {
    return null;
  }
}

export async function updateCachedCow(cow, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (db && cow?.id) {
      const existing = await db.get("cows_cache", cow.id);
      await db.put("cows_cache", {
        ...(existing || {}),
        ...cow,
        farm_id: cow.farm_id || existing?.farm_id || farmId,
        updatedAt: nowISO()
      });
    }
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function cacheMilkRecords(records, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const tx = db.transaction("milk_cache", "readwrite");
    await Promise.all(
      (records || []).map((record) =>
        tx.store.put({
          ...record,
          id: record.id || tempId("milk"),
          farm_id: record.farm_id || farmId,
          updatedAt: nowISO()
        })
      )
    );
    await tx.done;
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function getCachedMilkByDate(date, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("milk_cache");
  return records.filter((record) => record.date === date && matchesFarm(record, farmId));
}

export async function getCachedMilkByCow(cowId, days = 30, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("milk_cache");
  const fromDate = addDaysToISODate(getTodayISODate(), -Number(days || 30));

  return records
    .filter((record) => record.cow_id === cowId && record.date >= fromDate && matchesFarm(record, farmId))
    .sort((first, second) => String(second.date).localeCompare(String(first.date)));
}

export async function getCachedAIByCow(cowId, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("ai_cache");

  return records
    .filter((record) => record.cow_id === cowId && matchesFarm(record, farmId))
    .sort((first, second) => String(second.ai_date || "").localeCompare(String(first.ai_date || "")));
}

export async function getCachedHealthByCow(cowId, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("health_cache");

  return records
    .filter((record) => record.cow_id === cowId && matchesFarm(record, farmId))
    .sort((first, second) => String(second.date || "").localeCompare(String(first.date || "")));
}

export async function cacheReminders(reminders, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const tx = db.transaction("reminders_cache", "readwrite");
    await Promise.all(
      (reminders || []).map((reminder) =>
        tx.store.put({
          ...reminder,
          id: reminder.id || tempId("reminder"),
          farm_id: reminder.farm_id || farmId,
          updatedAt: nowISO()
        })
      )
    );
    await tx.done;
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function getCachedReminder(id, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();
    const reminder = db ? await db.get("reminders_cache", id) : null;
    return reminder && matchesFarm(reminder, farmId) ? reminder : null;
  } catch {
    return null;
  }
}

export async function updateCachedReminder(reminder, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !reminder?.id) {
      return;
    }

    const existing = await db.get("reminders_cache", reminder.id);
    await db.put("reminders_cache", {
      ...(existing || {}),
      ...reminder,
      farm_id: reminder.farm_id || existing?.farm_id || farmId,
      updatedAt: nowISO()
    });
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function getCachedTodayReminders(farmId = getCurrentFarmId()) {
  const today = getTodayISODate();
  const reminders = await getAllFromStore("reminders_cache");

  return reminders
    .filter((reminder) => reminder.reminder_date === today && !reminder.is_done && matchesFarm(reminder, farmId))
    .sort((first, second) => String(first.createdAt || "").localeCompare(String(second.createdAt || "")));
}

export async function getCachedUpcomingReminders(days = 7, farmId = getCurrentFarmId()) {
  const today = getTodayISODate();
  const endDate = addDaysToISODate(today, Number(days || 7));
  const reminders = await getAllFromStore("reminders_cache");

  return reminders
    .filter(
      (reminder) =>
        reminder.reminder_date >= today &&
        reminder.reminder_date <= endDate &&
        !reminder.is_done &&
        matchesFarm(reminder, farmId)
    )
    .sort((first, second) => String(first.reminder_date).localeCompare(String(second.reminder_date)));
}

export async function getCachedOverdueReminders(farmId = getCurrentFarmId()) {
  const today = getTodayISODate();
  const reminders = await getAllFromStore("reminders_cache");

  return reminders
    .filter((reminder) => reminder.reminder_date < today && !reminder.is_done && matchesFarm(reminder, farmId))
    .sort((first, second) => String(first.reminder_date).localeCompare(String(second.reminder_date)));
}

export async function getCachedDoneReminders(farmId = getCurrentFarmId()) {
  const reminders = await getAllFromStore("reminders_cache");

  return reminders
    .filter((reminder) => reminder.is_done && matchesFarm(reminder, farmId))
    .sort((first, second) => String(second.done_at || second.updatedAt || "").localeCompare(String(first.done_at || first.updatedAt || "")));
}

export async function markReminderDoneLocally(id, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const reminder = await db.get("reminders_cache", id);

    if (reminder && matchesFarm(reminder, farmId)) {
      await db.put("reminders_cache", {
        ...reminder,
        is_done: true,
        done_at: nowISO(),
        updatedAt: nowISO()
      });
    }

    await addToPendingSync({
      type: "UPDATE",
      entity: "reminder",
      endpoint: "/api/reminders",
      method: "PATCH",
      payload: { id, action: "done" },
      farm_id: farmId,
      cow_id: reminder?.cow_id || null,
      cowName: reminder?.cows?.name || reminder?.cowName || "",
      createdAt: nowISO()
    });
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function cacheHealthRecords(records, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const tx = db.transaction("health_cache", "readwrite");
    await Promise.all(
      (records || []).map((record) =>
        tx.store.put({
          ...record,
          id: record.id || tempId("health"),
          farm_id: record.farm_id || farmId,
          updatedAt: nowISO()
        })
      )
    );
    await tx.done;
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function cacheAIRecords(records, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db) {
      return;
    }

    const tx = db.transaction("ai_cache", "readwrite");
    await Promise.all(
      (records || []).map((record) =>
        tx.store.put({
          ...record,
          id: record.id || tempId("ai"),
          farm_id: record.farm_id || farmId,
          updatedAt: nowISO()
        })
      )
    );
    await tx.done;
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function addLocalMilkRecord(record, farmId = getCurrentFarmId()) {
  const id = record.id || tempId("milk");
  await cacheMilkRecords([{ ...record, id, farm_id: record.farm_id || farmId, _pending: true }], farmId);
  return id;
}

export async function addLocalHealthRecord(record, farmId = getCurrentFarmId()) {
  const id = record.id || tempId("health");
  await cacheHealthRecords([{ ...record, id, farm_id: record.farm_id || farmId, _pending: true }], farmId);
  return id;
}

export async function addLocalAIRecord(record, farmId = getCurrentFarmId()) {
  const id = record.id || tempId("ai");
  await cacheAIRecords([{ ...record, id, farm_id: record.farm_id || farmId, _pending: true }], farmId);
  return id;
}

export async function addLocalReminder(reminder, farmId = getCurrentFarmId()) {
  const id = reminder.id || tempId("reminder");
  await cacheReminders([{ ...reminder, id, farm_id: reminder.farm_id || farmId, _pending: true, is_done: false }], farmId);
  return id;
}
