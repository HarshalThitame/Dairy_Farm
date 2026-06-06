"use client";

import { openDB } from "idb";
import { isCalfDehorningReminder, isCalfMilkReminder } from "@/lib/calfReminderDisplay";
import {
  getClientAuthToken,
  getClientStoredFarm,
  safeSetLocalStorageItem
} from "@/lib/clientStorage";
import { isLegacyPostCalvingDryOffReminder } from "@/lib/cowDryOffReminderDisplay";
import {
  CALVING_REMINDER_TYPE,
  DRY_OFF_REMINDER_TYPE,
  MISSED_PREGNANCY_REMINDER_TYPE,
  PREGNANCY_CHECK_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE,
  addDaysToISODate,
  getReminderDisplayMessage,
  shouldShowReminder,
  getTodayISODate
} from "@/lib/reminderUtils";

const DB_NAME = "goshala-local";
const DB_VERSION = 7;
const visibleReminderTypes = new Set([
  PREGNANCY_CHECK_REMINDER_TYPE,
  MISSED_PREGNANCY_REMINDER_TYPE,
  REPEAT_BREEDING_REMINDER_TYPE,
  DRY_OFF_REMINDER_TYPE,
  CALVING_REMINDER_TYPE,
  "पुढील रेतन तयारी",
  "व्यायण",
  "लसीकरण",
  "जंतनाशक",
  "तपासणी",
  "दूध बंद",
  "शिंग काढणे",
  "वासरी दूध कमी",
  "वासरी दूध बंद"
]);

function hasIndexedDB() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function isVisibleCachedReminder(reminder) {
  if (!visibleReminderTypes.has(reminder?.type)) {
    return false;
  }

  if (!reminder.is_done && isLegacyPostCalvingDryOffReminder(reminder)) {
    return false;
  }

  if (!reminder.is_done && !shouldShowReminder(reminder)) {
    return false;
  }

  if (!isCalfMilkReminder(reminder)) {
    return true;
  }

  if (reminder.is_done) {
    return true;
  }

  const calf = reminder.related_calf || reminder.calf;

  if (!calf) {
    return true;
  }

  return calf.status === "active" && calf.is_raised !== false && (isCalfDehorningReminder(reminder) || !calf.gender || calf.gender === "मादी");
}

function normalizeReminderForDisplay(reminder) {
  if (!reminder) {
    return reminder;
  }

  return {
    ...reminder,
    message: getReminderDisplayMessage(reminder)
  };
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

      if (!db.objectStoreNames.contains("dairy_slips_cache")) {
        store = db.createObjectStore("dairy_slips_cache", { keyPath: "id" });
        store.createIndex("slip_date", "slip_date");
        store.createIndex("farm_id", "farm_id");
      } else {
        store = transaction.objectStore("dairy_slips_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("settlements_cache")) {
        store = db.createObjectStore("settlements_cache", { keyPath: "id" });
        store.createIndex("settlement_date", "settlement_date");
        store.createIndex("farm_id", "farm_id");
      } else {
        store = transaction.objectStore("settlements_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }
      if (!store.indexNames.contains("period_end")) {
        store.createIndex("period_end", "period_end");
      }

      if (!db.objectStoreNames.contains("expenses_cache")) {
        store = db.createObjectStore("expenses_cache", { keyPath: "id" });
        store.createIndex("expense_date", "expense_date");
        store.createIndex("farm_id", "farm_id");
      } else {
        store = transaction.objectStore("expenses_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("finance_cache")) {
        store = db.createObjectStore("finance_cache", { keyPath: "id" });
        store.createIndex("date", "date");
        store.createIndex("type", "type");
        store.createIndex("farm_id", "farm_id");
      } else {
        store = transaction.objectStore("finance_cache");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("slip_uploads_pending")) {
        store = db.createObjectStore("slip_uploads_pending", {
          keyPath: "localId",
          autoIncrement: true
        });
        store.createIndex("farm_id", "farm_id");
        store.createIndex("status", "status");
        store.createIndex("slip_type", "slip_type");
        store.createIndex("uploadedAt", "uploadedAt");
      } else {
        store = transaction.objectStore("slip_uploads_pending");
      }
      if (!store.indexNames.contains("farm_id")) {
        store.createIndex("farm_id", "farm_id");
      }

      if (!db.objectStoreNames.contains("notifications_cache")) {
        store = db.createObjectStore("notifications_cache", { keyPath: "id" });
        store.createIndex("farm_id", "farm_id");
        store.createIndex("deliveredAt", "deliveredAt");
        store.createIndex("readAt", "readAt");
        store.createIndex("type", "type");
      } else {
        store = transaction.objectStore("notifications_cache");
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
  return getClientStoredFarm()?.id || "";
}

function matchesFarm(record, farmId) {
  return Boolean(farmId) && record.farm_id === farmId;
}

function getStoredToken() {
  return getClientAuthToken();
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

    const farmId = getCurrentFarmId();
    const record = await db.get("pending_sync", localId);

    if (record && matchesFarm(record, farmId)) {
      await db.put("pending_sync", {
        ...record,
        synced: true,
        syncedAt: nowISO(),
        syncError: null,
        permanentFail: false
      });
      safeSetLocalStorageItem("goshala-last-sync", nowISO());
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
        .filter((record) => record.synced && matchesFarm(record, getCurrentFarmId()))
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
      const record = await db.get("pending_sync", localId);
      if (record && matchesFarm(record, getCurrentFarmId())) {
        await db.delete("pending_sync", localId);
      }
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

    if (record && matchesFarm(record, getCurrentFarmId())) {
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

    if (!db || !farmId) {
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
    safeSetLocalStorageItem("goshala-cows-fetched-at", nowISO());
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

    if (db && cow?.id && farmId) {
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

    if (!db || !farmId) {
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

export async function getCachedAIByDateRange(startDate, endDate, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("ai_cache");

  return records
    .filter(
      (record) =>
        matchesFarm(record, farmId) &&
        record.ai_date >= startDate &&
        record.ai_date < endDate
    )
    .sort((first, second) => String(second.ai_date || "").localeCompare(String(first.ai_date || "")));
}

export async function getCachedHealthByCow(cowId, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("health_cache");

  return records
    .filter((record) => record.cow_id === cowId && matchesFarm(record, farmId))
    .sort((first, second) => String(second.date || "").localeCompare(String(first.date || "")));
}

export async function getCachedHealthByDateRange(startDate, endDate, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("health_cache");

  return records
    .filter(
      (record) =>
        matchesFarm(record, farmId) &&
        record.date >= startDate &&
        record.date < endDate
    )
    .sort((first, second) => String(second.date || "").localeCompare(String(first.date || "")));
}

export async function getCachedFinanceByDateRange(startDate, endDate, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("finance_cache");

  return records
    .filter(
      (record) =>
        matchesFarm(record, farmId) &&
        record.date >= startDate &&
        record.date < endDate
    )
    .sort((first, second) => String(second.date || "").localeCompare(String(first.date || "")));
}

export async function cacheReminders(reminders, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
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

export async function replaceCachedReminders(reminders, shouldReplace, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId || typeof shouldReplace !== "function") {
      return;
    }

    const existing = await db.getAll("reminders_cache");
    const tx = db.transaction("reminders_cache", "readwrite");

    await Promise.all(
      existing
        .filter(
          (reminder) =>
            matchesFarm(reminder, farmId) &&
            (!reminder._pending || reminder._generated) &&
            shouldReplace(reminder)
        )
        .map((reminder) => tx.store.delete(reminder.id))
    );
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
    return reminder && matchesFarm(reminder, farmId) ? normalizeReminderForDisplay(reminder) : null;
  } catch {
    return null;
  }
}

export async function updateCachedReminder(reminder, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !reminder?.id || !farmId) {
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

export async function markCachedRelatedRemindersDone(
  relatedRecordId,
  types = [
    PREGNANCY_CHECK_REMINDER_TYPE,
    MISSED_PREGNANCY_REMINDER_TYPE,
    DRY_OFF_REMINDER_TYPE,
    CALVING_REMINDER_TYPE
  ],
  options = {},
  farmId = getCurrentFarmId()
) {
  try {
    const db = await getDB();

    if (!db || !farmId || !relatedRecordId) {
      return [];
    }

    const typeSet = new Set(types || []);
    const reminders = await db.getAll("reminders_cache");
    const matching = reminders.filter(
      (reminder) =>
        matchesFarm(reminder, farmId) &&
        reminder.related_record_id === relatedRecordId &&
        typeSet.has(reminder.type) &&
        !reminder.is_done
    );

    if (!matching.length) {
      return [];
    }

    const tx = db.transaction("reminders_cache", "readwrite");
    const timestamp = nowISO();
    await Promise.all(
      matching.map((reminder) =>
        tx.store.put({
          ...reminder,
          is_done: true,
          skipped: Boolean(options.skipped),
          done_at: timestamp,
          updatedAt: timestamp
        })
      )
    );
    await tx.done;

    return matching;
  } catch {
    return [];
  }
}

export async function markCachedCowRemindersDone(
  cowId,
  types = [
    PREGNANCY_CHECK_REMINDER_TYPE,
    MISSED_PREGNANCY_REMINDER_TYPE,
    REPEAT_BREEDING_REMINDER_TYPE,
    DRY_OFF_REMINDER_TYPE,
    CALVING_REMINDER_TYPE
  ],
  options = {},
  farmId = getCurrentFarmId()
) {
  try {
    const db = await getDB();

    if (!db || !farmId || !cowId) {
      return [];
    }

    const typeSet = new Set(types || []);
    const reminders = await db.getAll("reminders_cache");
    const matching = reminders.filter(
      (reminder) =>
        matchesFarm(reminder, farmId) &&
        reminder.cow_id === cowId &&
        typeSet.has(reminder.type) &&
        !reminder.is_done
    );

    if (!matching.length) {
      return [];
    }

    const tx = db.transaction("reminders_cache", "readwrite");
    const timestamp = nowISO();
    await Promise.all(
      matching.map((reminder) =>
        tx.store.put({
          ...reminder,
          is_done: true,
          skipped: Boolean(options.skipped),
          done_at: timestamp,
          updatedAt: timestamp
        })
      )
    );
    await tx.done;

    return matching;
  } catch {
    return [];
  }
}

export async function getCachedTodayReminders(farmId = getCurrentFarmId()) {
  const today = getTodayISODate();
  const reminders = await getAllFromStore("reminders_cache");

  return reminders
    .filter((reminder) => reminder.reminder_date === today && !reminder.is_done && matchesFarm(reminder, farmId) && isVisibleCachedReminder(reminder))
    .map(normalizeReminderForDisplay)
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
        matchesFarm(reminder, farmId) &&
        isVisibleCachedReminder(reminder)
    )
    .map(normalizeReminderForDisplay)
    .sort((first, second) => String(first.reminder_date).localeCompare(String(second.reminder_date)));
}

export async function getCachedOverdueReminders(farmId = getCurrentFarmId()) {
  const today = getTodayISODate();
  const reminders = await getAllFromStore("reminders_cache");

  return reminders
    .filter((reminder) => reminder.reminder_date < today && !reminder.is_done && matchesFarm(reminder, farmId) && isVisibleCachedReminder(reminder))
    .map(normalizeReminderForDisplay)
    .sort((first, second) => String(first.reminder_date).localeCompare(String(second.reminder_date)));
}

export async function getCachedDoneReminders(farmId = getCurrentFarmId()) {
  const reminders = await getAllFromStore("reminders_cache");

  return reminders
    .filter((reminder) => reminder.is_done && matchesFarm(reminder, farmId))
    .map(normalizeReminderForDisplay)
    .sort((first, second) => String(second.done_at || second.updatedAt || "").localeCompare(String(first.done_at || first.updatedAt || "")));
}

export async function markReminderDoneLocally(id, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
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
      payload: { id, action: "done", farm_id: farmId },
      farm_id: farmId,
      token: getStoredToken(),
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

    if (!db || !farmId) {
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

    if (!db || !farmId) {
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

export async function updateCachedAIRecord(record, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId || !record?.id) {
      return;
    }

    const existing = await db.get("ai_cache", record.id);
    await db.put("ai_cache", {
      ...(existing || {}),
      ...record,
      id: record.id,
      farm_id: record.farm_id || existing?.farm_id || farmId,
      updatedAt: nowISO()
    });
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function markCachedSupersededAIRecordsNegative(cowId, newAiDate, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId || !cowId || !newAiDate) {
      return [];
    }

    const records = await db.getAll("ai_cache");
    const superseded = records.filter(
      (record) =>
        matchesFarm(record, farmId) &&
        record.cow_id === cowId &&
        String(record.ai_date || "") < String(newAiDate || "") &&
        (record.pregnancy_result || "pending") === "pending"
    );

    if (!superseded.length) {
      return [];
    }

    const tx = db.transaction("ai_cache", "readwrite");
    const timestamp = nowISO();
    await Promise.all(
      superseded.map((record) =>
        tx.store.put({
          ...record,
          pregnancy_result: "negative",
          notes: appendSupersededAINote(record.notes),
          updatedAt: timestamp
        })
      )
    );
    await tx.done;

    return superseded;
  } catch {
    return [];
  }
}

function appendSupersededAINote(notes) {
  const existingNotes = String(notes || "").trim();
  const autoNote = "नंतरच्या रेतन नोंदीमुळे गर्भधारणा नाही म्हणून आपोआप चिन्हांकित.";

  if (existingNotes.includes(autoNote)) {
    return existingNotes || null;
  }

  return [existingNotes, autoNote].filter(Boolean).join("\n") || null;
}

export async function cacheFinanceRecords(records, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
      return;
    }

    const tx = db.transaction("finance_cache", "readwrite");
    await Promise.all(
      (records || []).map((record) =>
        tx.store.put({
          ...record,
          id: record.id || tempId("finance"),
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

export async function addLocalFinanceRecord(record, farmId = getCurrentFarmId()) {
  const id = record.id || tempId("finance");
  await cacheFinanceRecords([{ ...record, id, farm_id: record.farm_id || farmId, _pending: true }], farmId);
  return id;
}

export async function addLocalReminder(reminder, farmId = getCurrentFarmId()) {
  const id = reminder.id || tempId("reminder");
  await cacheReminders([{ ...reminder, id, farm_id: reminder.farm_id || farmId, _pending: true, is_done: false }], farmId);
  return id;
}

async function cacheAccountingRecords(storeName, records, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
      return;
    }

    const tx = db.transaction(storeName, "readwrite");
    await Promise.all(
      (records || []).map((record) =>
        tx.store.put({
          ...record,
          id: record.id || tempId(storeName),
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

async function replaceAccountingRecords(storeName, records, dateField, start, end, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
      return;
    }

    const existing = await db.getAll(storeName);
    const tx = db.transaction(storeName, "readwrite");
    await Promise.all(
      existing
        .filter(
          (record) =>
            matchesFarm(record, farmId) &&
            !record._pending &&
            record[dateField] >= start &&
            record[dateField] < end
        )
        .map((record) => tx.store.delete(record.id))
    );
    await Promise.all(
      (records || []).map((record) =>
        tx.store.put({
          ...record,
          id: record.id || tempId(storeName),
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

async function getAccountingRecordsByMonth(storeName, dateField, start, end, farmId = getCurrentFarmId()) {
  const records = await getAllFromStore(storeName);

  return records
    .filter((record) => record[dateField] >= start && record[dateField] < end && matchesFarm(record, farmId))
    .sort((first, second) => String(second[dateField] || "").localeCompare(String(first[dateField] || "")));
}

export async function cacheDairySlips(records, farmId = getCurrentFarmId()) {
  return cacheAccountingRecords("dairy_slips_cache", records, farmId);
}

export async function replaceCachedDairySlips(records, start, end, farmId = getCurrentFarmId()) {
  return replaceAccountingRecords("dairy_slips_cache", records, "slip_date", start, end, farmId);
}

export async function getCachedDairySlips(start, end, farmId = getCurrentFarmId()) {
  return getAccountingRecordsByMonth("dairy_slips_cache", "slip_date", start, end, farmId);
}

export async function addLocalDairySlip(record, farmId = getCurrentFarmId()) {
  const id = record.id || tempId("dairy-slip");
  await cacheDairySlips([{ ...record, id, farm_id: record.farm_id || farmId, _pending: true }], farmId);
  return id;
}

export async function cacheSettlements(records, farmId = getCurrentFarmId()) {
  return cacheAccountingRecords("settlements_cache", records, farmId);
}

export async function replaceCachedSettlements(records, start, end, farmId = getCurrentFarmId()) {
  return replaceAccountingRecords("settlements_cache", records, "period_end", start, end, farmId);
}

export async function getCachedSettlements(start, end, farmId = getCurrentFarmId()) {
  return getAccountingRecordsByMonth("settlements_cache", "period_end", start, end, farmId);
}

export async function addLocalSettlement(record, farmId = getCurrentFarmId()) {
  const id = record.id || tempId("settlement");
  await cacheSettlements([{ ...record, id, farm_id: record.farm_id || farmId, _pending: true }], farmId);
  return id;
}

export async function cacheMonthlyExpenses(records, farmId = getCurrentFarmId()) {
  return cacheAccountingRecords("expenses_cache", records, farmId);
}

export async function replaceCachedMonthlyExpenses(records, start, end, farmId = getCurrentFarmId()) {
  return replaceAccountingRecords("expenses_cache", records, "expense_date", start, end, farmId);
}

export async function getCachedMonthlyExpenses(start, end, farmId = getCurrentFarmId()) {
  return getAccountingRecordsByMonth("expenses_cache", "expense_date", start, end, farmId);
}

export async function addLocalMonthlyExpense(record, farmId = getCurrentFarmId()) {
  const id = record.id || tempId("expense");
  await cacheMonthlyExpenses([{ ...record, id, farm_id: record.farm_id || farmId, _pending: true }], farmId);
  return id;
}

export async function cacheNotifications(records, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
      return;
    }

    const tx = db.transaction("notifications_cache", "readwrite");
    await Promise.all(
      (records || []).map((record) =>
        tx.store.put({
          ...record,
          id: record.id || tempId("notification"),
          farm_id: record.farm_id || record.farmId || farmId,
          updatedAt: nowISO()
        })
      )
    );
    await tx.done;
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function getCachedNotifications(farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("notifications_cache");
  return records
    .filter((record) => matchesFarm(record, farmId))
    .sort((first, second) => String(second.deliveredAt || second.created_at || "").localeCompare(String(first.deliveredAt || first.created_at || "")));
}

export async function updateCachedNotification(id, patch, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();
    if (!db || !farmId || !id) {
      return;
    }
    const existing = await db.get("notifications_cache", id);
    if (!existing || !matchesFarm(existing, farmId)) {
      return;
    }
    await db.put("notifications_cache", { ...existing, ...patch, updatedAt: nowISO() });
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}

export async function addPendingSlipUpload(record, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
      return null;
    }

    const localId = await db.add("slip_uploads_pending", {
      ...record,
      farm_id: record.farm_id || farmId,
      status: record.status || "captured",
      uploadedAt: record.uploadedAt || nowISO(),
      updatedAt: nowISO()
    });

    dispatchPendingChange();
    return localId;
  } catch {
    return null;
  }
}

export async function getPendingSlipUploads(farmId = getCurrentFarmId()) {
  const records = await getAllFromStore("slip_uploads_pending");
  return records
    .filter((record) => matchesFarm(record, farmId) && record.status !== "saved")
    .sort((first, second) => String(first.uploadedAt || "").localeCompare(String(second.uploadedAt || "")));
}

export async function updatePendingSlipUpload(localId, updates = {}, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
      return null;
    }

    const existing = await db.get("slip_uploads_pending", Number(localId));
    if (!existing || !matchesFarm(existing, farmId)) {
      return null;
    }

    const nextRecord = {
      ...existing,
      ...updates,
      updatedAt: nowISO()
    };

    await db.put("slip_uploads_pending", nextRecord);
    dispatchPendingChange();
    return nextRecord;
  } catch {
    return null;
  }
}

export async function deletePendingSlipUpload(localId, farmId = getCurrentFarmId()) {
  try {
    const db = await getDB();

    if (!db || !farmId) {
      return;
    }

    const existing = await db.get("slip_uploads_pending", Number(localId));
    if (existing && matchesFarm(existing, farmId)) {
      await db.delete("slip_uploads_pending", Number(localId));
      dispatchPendingChange();
    }
  } catch {
    // Ignore storage errors so the UI keeps working.
  }
}
