"use client";

import {
  addLocalAIRecord,
  addLocalDairySlip,
  addLocalHealthRecord,
  addLocalMilkRecord,
  addLocalMonthlyExpense,
  addLocalReminder,
  addLocalSettlement,
  addPendingSlipUpload,
  addToPendingSync,
  cacheAIRecords,
  cacheCows,
  cacheDairySlips,
  cacheHealthRecords,
  cacheMilkRecords,
  cacheMonthlyExpenses,
  cacheReminders,
  cacheSettlements,
  getCachedAIByCow,
  getCachedCow,
  getCachedCows,
  getCachedDairySlips,
  getCachedDoneReminders,
  getCachedHealthByCow,
  getCachedMilkByDate,
  getCachedMilkByCow,
  getCachedMonthlyExpenses,
  getCachedOverdueReminders,
  getCachedReminder,
  getCachedSettlements,
  getCachedTodayReminders,
  getCachedUpcomingReminders,
  getPendingSlipUploads,
  markReminderDoneLocally,
  replaceCachedDairySlips,
  replaceCachedMonthlyExpenses,
  replaceCachedReminders,
  replaceCachedSettlements,
  updateCachedCow,
  updatePendingSlipUpload,
  updateCachedReminder
} from "@/lib/localDB";
import { isOnline } from "@/lib/networkStatus";
import { registerBackgroundSync } from "@/lib/syncManager";
import { addDaysToISODate, calculateAIReminders, getTodayISODate } from "@/lib/reminderUtils";
import { getMonthRange } from "@/lib/reportUtils";
import {
  getDeductionsCountedInProfit,
  getMonthYearString,
  summarizeMilkIncomeForMonth,
  summarizeDairySlips,
  summarizeExpenses,
  summarizeSettlements
} from "@/lib/accountingUtils";
import { compressImageFileToWebP, validateImageSize } from "@/lib/imageCompression";

function getStoredFarm() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("goshala_farm") || "null");
  } catch {
    return null;
  }
}

function getFarmId() {
  return getStoredFarm()?.id || "";
}

function getAuthHeader() {
  if (typeof localStorage === "undefined") {
    return {};
  }

  const token = localStorage.getItem("goshala_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getStoredToken() {
  if (typeof localStorage === "undefined") {
    return "";
  }

  return localStorage.getItem("goshala_token") || "";
}

function nowISO() {
  return new Date().toISOString();
}

function tempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dispatchOfflineSave(entity) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("offline-save", { detail: { entity } }));
    window.dispatchEvent(new CustomEvent("pending-sync-change"));
  }
}

function withFreshQuery(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_=${Date.now()}`;
}

const GET_CACHE_TTL_MS = 20 * 1000;
const getResponseCache = new Map();
const inflightGetRequests = new Map();
let getCacheVersion = 0;

function cloneJson(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function clearGetCache() {
  getCacheVersion += 1;
  getResponseCache.clear();
  inflightGetRequests.clear();
}

async function cacheFreshRemindersForFilter(filter, reminders, farmId) {
  const today = getTodayISODate();

  if (filter === "today") {
    await replaceCachedReminders(
      reminders,
      (reminder) => reminder.reminder_date === today && !reminder.is_done,
      farmId
    );
    return;
  }

  if (filter === "week") {
    const weekEnd = addDaysToISODate(today, 7);
    await replaceCachedReminders(
      reminders,
      (reminder) =>
        reminder.reminder_date >= today &&
        reminder.reminder_date <= weekEnd &&
        !reminder.is_done,
      farmId
    );
    return;
  }

  if (filter === "overdue") {
    await replaceCachedReminders(
      reminders,
      (reminder) => reminder.reminder_date < today && !reminder.is_done,
      farmId
    );
    return;
  }

  if (filter === "done") {
    await replaceCachedReminders(reminders, (reminder) => reminder.is_done, farmId);
    return;
  }

  await cacheReminders(reminders, farmId);
}

export async function fetchJson(url, options = {}) {
  const { fresh = true, unwrapData = true, cacheTtlMs = GET_CACHE_TTL_MS, ...fetchOptions } = options;
  const method = String(fetchOptions.method || "GET").toUpperCase();
  const isGet = method === "GET";
  const token = getStoredToken();
  const cacheKey = `${token}:${url}`;

  if (isGet && cacheTtlMs > 0) {
    const cached = getResponseCache.get(cacheKey);

    if (cached && Date.now() - cached.createdAt < cacheTtlMs) {
      return cloneJson(cached.value);
    }

    const inflight = inflightGetRequests.get(cacheKey);

    if (inflight) {
      return cloneJson(await inflight);
    }
  } else if (!isGet) {
    clearGetCache();
  }

  const requestUrl = fresh && method === "GET" ? withFreshQuery(url) : url;
  const requestCacheVersion = getCacheVersion;

  const fetchPromise = fetch(requestUrl, {
    cache: "no-store",
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(fetchOptions.headers || {})
    }
  }).then(async (response) => {
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "माहिती मिळवताना चूक झाली.");
    }

    const value = unwrapData ? result.data : result;

    if (isGet && cacheTtlMs > 0 && requestCacheVersion === getCacheVersion) {
      getResponseCache.set(cacheKey, {
        createdAt: Date.now(),
        value: cloneJson(value)
      });
    }

    return value;
  });

  if (isGet && cacheTtlMs > 0) {
    inflightGetRequests.set(cacheKey, fetchPromise);
  }

  try {
    return cloneJson(await fetchPromise);
  } finally {
    if (isGet) {
      inflightGetRequests.delete(cacheKey);
    }
  }
}

function queueAction(action) {
  const farmId = action.farm_id || getFarmId();
  return addToPendingSync({
    ...action,
    farm_id: farmId,
    token: action.token || getStoredToken(),
    payload: {
      ...(action.payload || {}),
      farm_id: farmId || action.payload?.farm_id
    },
    createdAt: nowISO()
  }).then((localId) => {
    registerBackgroundSync();
    dispatchOfflineSave(action.entity);
    return localId;
  });
}

export async function fetchCows() {
  const farmId = getFarmId();
  if (isOnline()) {
    try {
      const data = await fetchJson("/api/cows");
      await cacheCows(data || [], farmId);
      return {
        data: data || [],
        fromCache: false,
        fetchedAt: nowISO()
      };
    } catch {
      const cached = await getCachedCows();
      return {
        data: cached,
        fromCache: true,
        fetchedAt: typeof localStorage !== "undefined" ? localStorage.getItem("goshala-cows-fetched-at") : null
      };
    }
  }

  const cached = await getCachedCows(farmId);
  return {
    data: cached,
    fromCache: true,
    fetchedAt: typeof localStorage !== "undefined" ? localStorage.getItem("goshala-cows-fetched-at") : null
  };
}

export async function saveCow(cowData, cowId = null) {
  const farmId = getFarmId();
  const method = cowId ? "PUT" : "POST";
  const endpoint = cowId ? `/api/cows/${cowId}` : "/api/cows";
  const payload = {
    ...cowData,
    ...(cowId ? {} : { breed: cowData.breed || "जर्सी" }),
    farm_id: farmId
  };

  if (isOnline()) {
    const data = await fetchJson(endpoint, {
      method,
      body: JSON.stringify(payload)
    });
    await updateCachedCow(data, farmId);
    return { success: true, data, offline: false };
  }

  const tempCowId = cowId || tempId("cow");
  const localCow = {
    ...payload,
    id: tempCowId,
    _pending: true
  };
  await updateCachedCow(localCow, farmId);
  const localId = await queueAction({
    type: cowId ? "UPDATE" : "CREATE",
    entity: "cow",
    endpoint,
    method,
    payload,
    farm_id: farmId,
    cow_id: tempCowId,
    cowName: cowData.name || ""
  });

  return { success: true, offline: true, tempId: tempCowId, localId, data: localCow };
}

export async function fetchCowProfile(cowId) {
  const farmId = getFarmId();
  if (isOnline()) {
    try {
      const data = await fetchJson(`/api/cows/${cowId}`);
      await updateCachedCow(data?.cow, farmId);
      await cacheAIRecords(data?.records?.ai_records || [], farmId);
      await cacheHealthRecords(data?.records?.health_records || [], farmId);
      return { data, fromCache: false };
    } catch {
      // Fall through to cache.
    }
  }

  const cow = await getCachedCow(cowId, farmId);

  if (!cow) {
    throw new Error("गायीची माहिती फोनवर सापडली नाही.");
  }

  const [aiRecords, healthRecords] = await Promise.all([
    getCachedAIByCow(cowId, farmId),
    getCachedHealthByCow(cowId, farmId)
  ]);

  return {
    data: {
      cow,
      records: {
        ai_records: aiRecords,
        calving_records: [],
        milk_records: [],
        health_records: healthRecords,
        finance_records: [],
        reminders: []
      }
    },
    fromCache: true
  };
}

export async function deleteCow(cowId, cowName = "") {
  const farmId = getFarmId();
  const endpoint = `/api/cows/${cowId}`;

  if (isOnline()) {
    const data = await fetchJson(endpoint, { method: "DELETE" });
    await updateCachedCow(data, farmId);
    return { success: true, data, offline: false };
  }

  await updateCachedCow({
    id: cowId,
    name: cowName,
    farm_id: farmId,
    is_active: false,
    _pending: true
  }, farmId);
  const localId = await queueAction({
    type: "DELETE",
    entity: "cow",
    endpoint,
    method: "DELETE",
    payload: { id: cowId, farm_id: farmId },
    farm_id: farmId,
    cow_id: cowId,
    cowName
  });

  return { success: true, offline: true, localId };
}

export async function fetchMilkByDate(date) {
  const farmId = getFarmId();
  if (isOnline()) {
    try {
      const data = await fetchJson(`/api/milk?date=${encodeURIComponent(date)}`);
      await cacheMilkRecords(data || [], farmId);
      return { data: data || [], fromCache: false };
    } catch {
      const cached = await getCachedMilkByDate(date, farmId);
      return { data: cached, fromCache: true };
    }
  }

  const cached = await getCachedMilkByDate(date, farmId);
  return { data: cached, fromCache: true };
}

export async function saveMilkRecord(milkData) {
  const farmId = getFarmId();
  const method = milkData.id ? "PUT" : "POST";
  const endpoint = milkData.id ? `/api/milk/${milkData.id}` : "/api/milk";
  const payload = {
    cow_id: null,
    date: milkData.date,
    morning_litres: milkData.morning_litres,
    evening_litres: milkData.evening_litres,
    price_per_litre: milkData.price_per_litre,
    morning_price_per_litre: milkData.morning_price_per_litre,
    evening_price_per_litre: milkData.evening_price_per_litre,
    fat_percentage: milkData.fat_percentage,
    morning_fat_percentage: milkData.morning_fat_percentage,
    evening_fat_percentage: milkData.evening_fat_percentage,
    snf_value: milkData.snf_value,
    morning_snf_value: milkData.morning_snf_value,
    evening_snf_value: milkData.evening_snf_value,
    degree_reading: milkData.degree_reading,
    morning_degree_reading: milkData.morning_degree_reading,
    evening_degree_reading: milkData.evening_degree_reading,
    notes: milkData.notes
  };
  const payloadWithFarm = { ...payload, farm_id: farmId };

  if (isOnline()) {
    const data = await fetchJson(endpoint, {
      method,
      body: JSON.stringify(payloadWithFarm)
    });
    await cacheMilkRecords([data], farmId);
    return { success: true, data, offline: false };
  }

  const localRecord = {
    ...payloadWithFarm,
    id: milkData.id || tempId("milk"),
    total_litres: Number(payload.morning_litres || 0) + Number(payload.evening_litres || 0),
    total_amount:
      Number(payload.morning_litres || 0) *
        Number(payload.morning_price_per_litre ?? payload.price_per_litre ?? 0) +
      Number(payload.evening_litres || 0) *
        Number(payload.evening_price_per_litre ?? payload.price_per_litre ?? 0),
    cows: null,
    _pending: true
  };
  await addLocalMilkRecord(localRecord, farmId);
  const localId = await queueAction({
    type: milkData.id ? "UPDATE" : "CREATE",
    entity: "milk",
    endpoint,
    method,
    payload: payloadWithFarm,
    farm_id: farmId,
    cow_id: null,
    cowName: ""
  });

  return { success: true, offline: true, localId, data: localRecord };
}

export async function saveBulkMilkRecords(milkArray) {
  const farmId = getFarmId();

  if (isOnline()) {
    const data = await fetchJson("/api/milk/bulk", {
      method: "POST",
      body: JSON.stringify({
        records: milkArray.map((milkData) => ({
          id: milkData.id,
          cow_id: null,
          date: milkData.date,
          morning_litres: milkData.morning_litres,
          evening_litres: milkData.evening_litres,
          price_per_litre: milkData.price_per_litre,
          morning_price_per_litre: milkData.morning_price_per_litre,
          evening_price_per_litre: milkData.evening_price_per_litre,
          fat_percentage: milkData.fat_percentage,
          morning_fat_percentage: milkData.morning_fat_percentage,
          evening_fat_percentage: milkData.evening_fat_percentage,
          snf_value: milkData.snf_value,
          morning_snf_value: milkData.morning_snf_value,
          evening_snf_value: milkData.evening_snf_value,
          degree_reading: milkData.degree_reading,
          morning_degree_reading: milkData.morning_degree_reading,
          evening_degree_reading: milkData.evening_degree_reading,
          notes: milkData.notes,
          farm_id: farmId
        }))
      })
    });
    await cacheMilkRecords(data || [], farmId);
    return {
      success: true,
      saved: data?.length || 0,
      queued: 0,
      offline: false,
      data: data || []
    };
  }

  let saved = 0;
  let queued = 0;
  const savedRecords = [];

  for (const milkData of milkArray) {
    const result = await saveMilkRecord(milkData);

    if (result.offline) {
      queued += 1;
    } else {
      saved += 1;
    }

    savedRecords.push(result.data);
  }

  return {
    success: true,
    saved,
    queued,
    offline: queued > 0,
    data: savedRecords
  };
}

export async function saveAIRecord(aiData) {
  const farmId = getFarmId();
  const payload = { ...aiData, bull_breed: aiData.bull_breed || "जर्सी", farm_id: farmId };

  if (isOnline()) {
    const data = await fetchJson("/api/ai", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const cowData = await fetchJson(`/api/cows/${aiData.cow_id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "गाभण", farm_id: farmId })
    });
    await updateCachedCow(cowData, farmId);
    return { success: true, data, offline: false };
  }

  const localAI = {
    ...payload,
    id: tempId("ai"),
    _pending: true
  };
  await addLocalAIRecord(localAI, farmId);
  await updateCachedCow({
    ...(aiData.cow || {}),
    id: aiData.cow_id,
    farm_id: farmId,
    name: aiData.cowName || aiData.cow?.name || "",
    status: "गाभण",
    _pending: true
  }, farmId);

  await queueAction({
    type: "CREATE",
    entity: "ai",
    endpoint: "/api/ai",
    method: "POST",
    payload,
    farm_id: farmId,
    cow_id: aiData.cow_id,
    cowName: aiData.cowName || aiData.cow?.name || ""
  });
  await queueAction({
    type: "UPDATE",
    entity: "cow",
    endpoint: `/api/cows/${aiData.cow_id}`,
    method: "PUT",
    payload: { status: "गाभण", farm_id: farmId },
    farm_id: farmId,
    cow_id: aiData.cow_id,
    cowName: aiData.cowName || aiData.cow?.name || ""
  });

  const reminders = calculateAIReminders(aiData.ai_date, aiData.cowName || aiData.cow?.name || "गाय");
  await Promise.all(
    reminders.map((reminder) =>
      addLocalReminder({
        ...reminder,
        farm_id: farmId,
        cow_id: aiData.cow_id,
        cows: aiData.cow ? { id: aiData.cow_id, name: aiData.cow.name, status: "गाभण" } : null,
        _generated: true,
        createdAt: nowISO()
      }, farmId)
    )
  );

  return { success: true, offline: true, data: localAI };
}

export async function saveHealthRecord(healthData) {
  const farmId = getFarmId();
  const payload = { ...healthData, farm_id: farmId };

  if (isOnline()) {
    const data = await fetchJson("/api/health", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await cacheHealthRecords([data], farmId);

    if (healthData.type === "उपचार") {
      const cowData = await fetchJson(`/api/cows/${healthData.cow_id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "उपचार सुरू", farm_id: farmId })
      });
      await updateCachedCow(cowData, farmId);
    }

    return { success: true, data, offline: false };
  }

  const localHealth = {
    ...payload,
    id: tempId("health"),
    _pending: true
  };
  await addLocalHealthRecord(localHealth, farmId);
  await queueAction({
    type: "CREATE",
    entity: healthData.type === "लसीकरण" || healthData.type === "जंतनाशक" ? "vaccination" : "health",
    endpoint: "/api/health",
    method: "POST",
    payload,
    farm_id: farmId,
    cow_id: healthData.cow_id,
    cowName: healthData.cowName || healthData.cow?.name || ""
  });

  if (healthData.type === "उपचार") {
    await updateCachedCow({
      ...(healthData.cow || {}),
      id: healthData.cow_id,
      farm_id: farmId,
      name: healthData.cowName || healthData.cow?.name || "",
      status: "उपचार सुरू",
      _pending: true
    }, farmId);
    await queueAction({
      type: "UPDATE",
      entity: "cow",
      endpoint: `/api/cows/${healthData.cow_id}`,
      method: "PUT",
      payload: { status: "उपचार सुरू", farm_id: farmId },
      farm_id: farmId,
      cow_id: healthData.cow_id,
      cowName: healthData.cowName || healthData.cow?.name || ""
    });
  }

  if (healthData.next_due_date) {
    const reminderType =
      healthData.type === "जंतनाशक" ? "जंतनाशक" : healthData.type === "लसीकरण" ? "लसीकरण" : "तपासणी";
    const cowName = healthData.cowName || "गाय";
    const reminderMessage =
      healthData.type === "जंतनाशक"
        ? `${cowName} ला ${healthData.vaccine_name || "जंतनाशक"} देण्याची वेळ झाली`
        : healthData.type === "लसीकरण"
          ? `${cowName} ला ${healthData.vaccine_name || "लस"} देण्याची वेळ झाली`
          : `${cowName} ची पुढील तपासणी करा`;

    await addLocalReminder({
      farm_id: farmId,
      cow_id: healthData.cow_id,
      reminder_date: healthData.next_due_date,
      type: reminderType,
      message: reminderMessage,
      cows: healthData.cow ? { id: healthData.cow_id, name: healthData.cow.name, status: healthData.cow.status } : null,
      _generated: true,
      createdAt: nowISO()
    }, farmId);
  }

  return { success: true, offline: true, data: localHealth };
}

export async function fetchTodayReminders() {
  const farmId = getFarmId();

  if (isOnline()) {
    try {
      const data = await fetchJson("/api/reminders?filter=today");
      await cacheFreshRemindersForFilter("today", data || [], farmId);
      return { data: data || [], fromCache: false };
    } catch {
      const cached = await getCachedTodayReminders(farmId);
      return { data: cached, fromCache: true };
    }
  }

  const cached = await getCachedTodayReminders(farmId);
  return { data: cached, fromCache: true };
}

export async function fetchRemindersByFilter(filter = "week") {
  const farmId = getFarmId();

  if (isOnline()) {
    try {
      const now = new Date();
      const query =
        filter === "done"
          ? `filter=done&month=${now.getMonth() + 1}&year=${now.getFullYear()}`
          : `filter=${encodeURIComponent(filter)}`;
      const data = await fetchJson(`/api/reminders?${query}`);
      await cacheFreshRemindersForFilter(filter, data || [], farmId);
      return { data: data || [], fromCache: false };
    } catch {
      // Fall through to cache.
    }
  }

  if (filter === "today") {
    return { data: await getCachedTodayReminders(farmId), fromCache: true };
  }

  if (filter === "overdue") {
    return { data: await getCachedOverdueReminders(farmId), fromCache: true };
  }

  if (filter === "done") {
    return { data: await getCachedDoneReminders(farmId), fromCache: true };
  }

  return { data: await getCachedUpcomingReminders(7, farmId), fromCache: true };
}

export async function fetchReminderDetail(reminderId) {
  const farmId = getFarmId();

  if (isOnline()) {
    try {
      const reminder = await fetchJson(`/api/reminders?id=${reminderId}&include_done=true`);
      await cacheReminders(reminder ? [reminder] : [], farmId);

      let cowProfile = null;
      if (reminder?.cow_id) {
        const result = await fetchCowProfile(reminder.cow_id);
        cowProfile = result.data;
      }

      return { reminder, cowProfile, fromCache: false };
    } catch {
      // Fall through to cache.
    }
  }

  const reminder = await getCachedReminder(reminderId, farmId);

  if (!reminder) {
    throw new Error("आठवण फोनवर सापडली नाही.");
  }

  const cow = reminder.cow_id ? await getCachedCow(reminder.cow_id, farmId) : null;

  return {
    reminder: {
      ...reminder,
      cows: reminder.cows || cow || null
    },
    cowProfile: cow
      ? {
          cow,
          records: {
            ai_records: await getCachedAIByCow(cow.id, farmId),
            calving_records: [],
            milk_records: await getCachedMilkByCow(cow.id, 60, farmId),
            health_records: await getCachedHealthByCow(cow.id, farmId),
            finance_records: [],
            reminders: []
          }
        }
      : null,
    fromCache: true
  };
}

export async function saveReminder(reminderData) {
  const farmId = getFarmId();
  const payload = {
    ...reminderData,
    farm_id: farmId,
    cow_id: reminderData.cow_id || null,
    related_record_id: reminderData.related_record_id || null
  };

  if (isOnline()) {
    const data = await fetchJson("/api/reminders", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await cacheReminders([data], farmId);
    return { success: true, data, offline: false };
  }

  const localId = await addLocalReminder(
    {
      ...payload,
      cows: reminderData.cows || null,
      createdAt: nowISO()
    },
    farmId
  );
  await queueAction({
    type: "CREATE",
    entity: "reminder",
    endpoint: "/api/reminders",
    method: "POST",
    payload,
    farm_id: farmId,
    cow_id: payload.cow_id,
    cowName: reminderData.cowName || reminderData.cows?.name || ""
  });

  return { success: true, offline: true, localId, data: { ...payload, id: localId } };
}

export async function markReminderDone(reminderId) {
  const farmId = getFarmId();

  if (isOnline()) {
    const data = await fetchJson("/api/reminders", {
      method: "PATCH",
      body: JSON.stringify({ action: "done", id: reminderId })
    });
    await cacheReminders([data], farmId);
    return { success: true, data, offline: false };
  }

  await markReminderDoneLocally(reminderId, farmId);
  registerBackgroundSync();
  dispatchOfflineSave("reminder");
  return { success: true, offline: true };
}

export async function updateReminderAction(reminderId, action = "done", days) {
  const farmId = getFarmId();

  if (action === "done") {
    return markReminderDone(reminderId);
  }

  if (isOnline()) {
    const data = await fetchJson("/api/reminders", {
      method: "PATCH",
      body: JSON.stringify({ action, id: reminderId, days })
    });
    await cacheReminders([data], farmId);
    return { success: true, data, offline: false };
  }

  await queueAction({
    type: "UPDATE",
    entity: "reminder",
    endpoint: "/api/reminders",
    method: "PATCH",
    payload: { action, id: reminderId, days, farm_id: farmId },
    farm_id: farmId,
    cow_id: null,
    cowName: ""
  });

  const cachedReminder = await getCachedReminder(reminderId, farmId);
  if (cachedReminder) {
    if (action === "snooze") {
      await updateCachedReminder({
        ...cachedReminder,
        reminder_date: addDaysToISODate(cachedReminder.reminder_date, Number(days || 1))
      }, farmId);
    } else if (action === "skip") {
      await updateCachedReminder({
        ...cachedReminder,
        is_done: true,
        skipped: true,
        done_at: nowISO()
      }, farmId);
    }
  }

  return { success: true, offline: true };
}

export async function saveFinanceRecord(financeData) {
  const farmId = getFarmId();
  const payload = { ...financeData, farm_id: farmId };

  if (isOnline()) {
    const data = await fetchJson("/api/finance", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return { success: true, data, offline: false };
  }

  const localId = await queueAction({
    type: "CREATE",
    entity: "finance",
    endpoint: "/api/finance",
    method: "POST",
    payload,
    farm_id: farmId,
    cow_id: financeData.cow_id || null,
    cowName: financeData.cowName || ""
  });

  return { success: true, offline: true, localId };
}

export async function fetchSlipUploads(limit = 10) {
  if (!isOnline()) {
    return { data: await getPendingSlipUploads(getFarmId()), fromCache: true };
  }

  try {
    const data = await fetchJson(`/api/accounting/slip-scan/upload?limit=${limit}`);
    return { data: data || [], fromCache: false };
  } catch {
    return { data: await getPendingSlipUploads(getFarmId()), fromCache: true };
  }
}

export async function uploadSlipImage(imageBlob, metadata = {}) {
  const farmId = getFarmId();

  if (!isOnline()) {
    const localId = await captureSlipOffline(imageBlob, farmId, metadata);
    return {
      success: true,
      offline: true,
      localId,
      message: "फोटो फोनवर साठवला. इंटरनेट आल्यानंतर AI वाचेल."
    };
  }

  metadata.onProgress?.({ stage: "compressing", message: "फोटो तपासत आहे..." });
  const compressed = await compressImageFileToWebP(imageBlob);
  const validation = validateImageSize(compressed.compressedSize);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  metadata.onProgress?.({
    stage: "compressed",
    message: compressed.skippedCompression ? "फोटो आधीच योग्य आकाराचा आहे." : "फोटो संकुचित झाला.",
    compression: compressed
  });

  const formData = new FormData();
  const originalFilename = metadata.originalFilename || imageBlob?.name || "dairy-slip.jpg";
  const originalSize = metadata.originalSize || imageBlob?.size || 0;
  formData.append("image", compressed.compressedFile, compressed.compressedFilename);
  formData.append("originalFilename", originalFilename);
  formData.append("originalSize", String(originalSize));
  formData.append("compressionRatio", String(compressed.compressionRatio));
  formData.append("clientCompressed", "true");
  formData.append("clientPrepared", "true");
  formData.append("skippedCompression", String(Boolean(compressed.skippedCompression)));

  metadata.onProgress?.({ stage: "uploading", message: "फोटो अपलोड होत आहे...", compression: compressed });

  const response = await fetch("/api/accounting/slip-scan/upload", {
    method: "POST",
    cache: "no-store",
    headers: {
      ...getAuthHeader()
    },
    body: formData
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "फोटो अपलोड झाला नाही.");
  }

  return { success: true, offline: false, data: result.data, compression: compressed };
}

export async function extractSlipUpload(uploadId, options = {}) {
  if (!isOnline()) {
    throw new Error("AI वाचनासाठी इंटरनेट आवश्यक आहे. फोटो फोनवर साठवून ठेवा.");
  }

  const data = await fetchJson("/api/accounting/slip-scan/extract", {
    method: "POST",
    body: JSON.stringify({ uploadId, force: Boolean(options.force) })
  });

  return { success: true, data };
}

export async function saveSlipScanRecord(saveData) {
  if (!isOnline()) {
    throw new Error("जतन करण्यासाठी इंटरनेट आवश्यक आहे.");
  }

  const data = await fetchJson("/api/accounting/slip-scan/save", {
    method: "POST",
    body: JSON.stringify(saveData)
  });

  return { success: true, data };
}

export async function captureSlipOffline(imageBlob, farmId = getFarmId(), metadata = {}) {
  const localId = await addPendingSlipUpload(
    {
      farm_id: farmId,
      status: "captured",
      slip_type: metadata.slip_type || null,
      blob: imageBlob,
      originalFilename: metadata.originalFilename || imageBlob?.name || "dairy-slip.jpg",
      originalSize: metadata.originalSize || imageBlob?.size || 0,
      extractedData: null,
      serverSyncId: null,
      uploadedAt: nowISO()
    },
    farmId
  );

  return localId;
}

export async function processPendingSlips() {
  const farmId = getFarmId();

  if (!isOnline()) {
    return { offline: true, processed: 0, failed: 0 };
  }

  const pending = await getPendingSlipUploads(farmId);
  let processed = 0;
  let failed = 0;

  for (const record of pending) {
    if (!record.blob || record.status === "saved") {
      continue;
    }

    try {
      await updatePendingSlipUpload(record.localId, { status: "queued" }, farmId);
      const upload = await uploadSlipImage(record.blob, {
        originalFilename: record.originalFilename,
        originalSize: record.originalSize
      });
      const uploadId = upload.data?.uploadId;

      if (!uploadId) {
        throw new Error("Upload ID मिळाला नाही.");
      }

      const extraction = await extractSlipUpload(uploadId);
      await updatePendingSlipUpload(
        record.localId,
        {
          status: "extracted",
          serverSyncId: uploadId,
          slip_type: extraction.data?.extractedData?.slip_type || null,
          extractedData: extraction.data?.extractedData || null
        },
        farmId
      );
      processed += 1;
    } catch (error) {
      failed += 1;
      await updatePendingSlipUpload(
        record.localId,
        {
          status: "failed",
          error: error.message || "स्लिप process झाली नाही."
        },
        farmId
      );
    }
  }

  return { processed, failed };
}

export async function fetchDairySlips(month, year) {
  const farmId = getFarmId();
  const range = getMonthRange(month, year);

  if (isOnline()) {
    try {
      const data = await fetchJson(`/api/accounting/dairy-slips?month=${month}&year=${year}`);
      await replaceCachedDairySlips(data?.slips || [], range.start, range.end, farmId);
      return { data, fromCache: false };
    } catch {
      // Fall through to cache.
    }
  }

  const slips = await getCachedDairySlips(range.start, range.end, farmId);
  const summary = summarizeDairySlips(slips);
  return {
    data: {
      slips,
      dailyTotals: summary.dailyTotals,
      monthlyTotal: summary.monthlyTotal
    },
    fromCache: true
  };
}

export async function saveDairySlip(slipData, slipId = null) {
  const farmId = getFarmId();
  const method = slipId ? "PUT" : "POST";
  const endpoint = slipId ? `/api/accounting/dairy-slips/${slipId}` : "/api/accounting/dairy-slips";
  const payload = { ...slipData, farm_id: farmId };

  if (isOnline()) {
    const result = await fetchJson(endpoint, {
      method,
      body: JSON.stringify(payload)
    });
    const slip = result.slip || result;
    await cacheDairySlips([slip], farmId);
    return { success: true, data: slip, result, offline: false };
  }

  const localSlip = {
    ...payload,
    id: slipId || tempId("dairy-slip"),
    total_amount: Number(payload.liters || 0) * Number(payload.rate_per_liter || 0),
    _pending: true
  };
  await addLocalDairySlip(localSlip, farmId);
  const localId = await queueAction({
    type: slipId ? "UPDATE" : "CREATE",
    entity: "dairy_slip",
    endpoint,
    method,
    payload,
    farm_id: farmId,
    cow_id: null,
    cowName: ""
  });

  return { success: true, data: localSlip, offline: true, localId };
}

export async function fetchSettlements(month, year) {
  const farmId = getFarmId();
  const range = getMonthRange(month, year);

  if (isOnline()) {
    try {
      const data = await fetchJson(`/api/accounting/settlements?month=${month}&year=${year}`);
      await replaceCachedSettlements(data?.settlements || [], range.start, range.end, farmId);
      return { data, fromCache: false };
    } catch {
      // Fall through to cache.
    }
  }

  const settlements = await getCachedSettlements(range.start, range.end, farmId);
  return {
    data: {
      settlements,
      summary: summarizeSettlements(settlements),
      reconciliation: []
    },
    fromCache: true
  };
}

export async function saveSettlement(settlementData, settlementId = null) {
  const farmId = getFarmId();
  const method = settlementId ? "PUT" : "POST";
  const endpoint = settlementId
    ? `/api/accounting/settlements/${settlementId}`
    : "/api/accounting/settlements";
  const payload = { ...settlementData, farm_id: farmId };

  if (isOnline()) {
    const result = await fetchJson(endpoint, {
      method,
      body: JSON.stringify(payload)
    });
    const settlement = result.settlement || result;
    await cacheSettlements([settlement], farmId);
    return { success: true, data: settlement, result, offline: false };
  }

  const periodSlips = await getCachedDairySlips(payload.period_start, addDaysToISODate(payload.period_end, 1), farmId);
  const expectedAmount = periodSlips.reduce(
    (sum, slip) => sum + Number(slip.total_amount ?? Number(slip.liters || 0) * Number(slip.rate_per_liter || 0)),
    0
  );
  const expectedLiters = periodSlips.reduce((sum, slip) => sum + Number(slip.liters || 0), 0);
  const localSettlement = {
    ...payload,
    id: settlementId || tempId("settlement"),
    cattle_feed_deduction: Number(payload.cattle_feed_deduction || 0),
    other_deductions: Number(payload.other_deductions || 0),
    total_deductions:
      Number(payload.cattle_feed_deduction || 0) +
      Number(payload.other_deductions || 0),
    net_payable:
      Number(payload.total_milk_income || 0) -
      Number(payload.cattle_feed_deduction || 0) -
      Number(payload.other_deductions || 0),
    expected_amount: expectedAmount,
    expected_liters: expectedLiters,
    discrepancy: Number(payload.total_milk_income || 0) - expectedAmount,
    liters_discrepancy: Number(payload.total_liters || 0) - expectedLiters,
    matched_slips: periodSlips.map((slip) => slip.id),
    _pending: true
  };
  await addLocalSettlement(localSettlement, farmId);
  const localId = await queueAction({
    type: settlementId ? "UPDATE" : "CREATE",
    entity: "settlement",
    endpoint,
    method,
    payload,
    farm_id: farmId,
    cow_id: null,
    cowName: ""
  });

  return { success: true, data: localSettlement, offline: true, localId };
}

export async function fetchMonthlyExpenses(month, year) {
  const farmId = getFarmId();
  const range = getMonthRange(month, year);

  if (isOnline()) {
    try {
      const data = await fetchJson(`/api/accounting/expenses?month=${month}&year=${year}`);
      await replaceCachedMonthlyExpenses(data?.expenses || [], range.start, range.end, farmId);
      return { data, fromCache: false };
    } catch {
      // Fall through to cache.
    }
  }

  const expenses = await getCachedMonthlyExpenses(range.start, range.end, farmId);
  const summary = summarizeExpenses(expenses);
  return {
    data: {
      expenses,
      byCategory: summary.byCategory,
      monthlyTotal: summary.monthlyTotal
    },
    fromCache: true
  };
}

export async function saveAccountingExpense(expenseData, expenseId = null) {
  const farmId = getFarmId();
  const method = expenseId ? "PUT" : "POST";
  const endpoint = expenseId
    ? `/api/accounting/expenses/${expenseId}`
    : "/api/accounting/expenses";
  const payload = { ...expenseData, farm_id: farmId };

  if (isOnline()) {
    const result = await fetchJson(endpoint, {
      method,
      body: JSON.stringify(payload)
    });
    const expense = result.expense || result;
    await cacheMonthlyExpenses([expense], farmId);
    return { success: true, data: expense, result, offline: false };
  }

  const localExpense = {
    ...payload,
    id: expenseId || tempId("accounting-expense"),
    month_year: getMonthYearString(payload.expense_date),
    _pending: true
  };
  await addLocalMonthlyExpense(localExpense, farmId);
  const localId = await queueAction({
    type: expenseId ? "UPDATE" : "CREATE",
    entity: "accounting_expense",
    endpoint,
    method,
    payload,
    farm_id: farmId,
    cow_id: null,
    cowName: ""
  });

  return { success: true, data: localExpense, offline: true, localId };
}

export async function fetchAccountingSummary(month, year) {
  if (isOnline()) {
    try {
      const data = await fetchJson(`/api/accounting/monthly-summary?month=${month}&year=${year}`);
      return { data, fromCache: false };
    } catch {
      // Fall through to derived cache.
    }
  }

  const [slipsResult, settlementsResult, expensesResult] = await Promise.all([
    fetchDairySlips(month, year),
    fetchSettlements(month, year),
    fetchMonthlyExpenses(month, year)
  ]);
  const milk = summarizeMilkIncomeForMonth(
    slipsResult.data.slips || [],
    settlementsResult.data.settlements || []
  );
  const settlements = settlementsResult.data.summary;
  const expenses = expensesResult.data;
  const deductionsCountedInProfit = getDeductionsCountedInProfit(settlements);
  const summary = {
    total_milk_income: milk.totalAmount,
    total_liters: milk.totalLiters,
    total_feed_expenses: expenses.byCategory["चारा"] || 0,
    total_straw_expenses: expenses.byCategory["भूसा"] || 0,
    total_medicine_expenses: expenses.byCategory["औषध"] || 0,
    total_labor_expenses: expenses.byCategory["मजुरी"] || 0,
    total_transport_expenses: expenses.byCategory["परिवहन"] || 0,
    total_other_expenses: expenses.byCategory["इतर"] || 0,
    total_all_expenses: expenses.monthlyTotal,
    total_dairy_deductions: deductionsCountedInProfit,
    net_profit: Number(milk.totalAmount || 0) - Number(expenses.monthlyTotal || 0) - deductionsCountedInProfit
  };

  return {
    data: {
      summary,
      report: {
        milk,
        settlementsSummary: settlements,
        expensesSummary: expenses,
        slips: slipsResult.data.slips,
        settlements: settlementsResult.data.settlements,
        expenses: expensesResult.data.expenses
      },
      trend: []
    },
    fromCache: true
  };
}

export async function saveCalvingRecord(calvingData) {
  const farmId = getFarmId();
  const calvingPayload = {
    cow_id: calvingData.cow_id,
    farm_id: farmId,
    ai_record_id: calvingData.ai_record_id || null,
    expected_date: calvingData.expected_date || null,
    actual_date: calvingData.actual_date,
    calf_count: calvingData.calf_count || 1,
    calf_gender: calvingData.calf_gender,
    calf_name: calvingData.calf_name || null,
    calving_notes: calvingData.calving_notes || null,
    raise_calf: Boolean(calvingData.raise_calf),
    calf_color: calvingData.calf_color || null,
    calf_breed: calvingData.calf_breed || null,
    reminder_id: calvingData.reminderId || null
  };
  const reminderPayload = {
    cow_id: calvingData.cow_id,
    farm_id: farmId,
    reminder_date: calvingData.dryOffDate,
    type: "दूध बंद",
    message: `${calvingData.cowName || "गाय"} चे दूध बंद करण्याची वेळ आली आहे`,
    related_record_id: null
  };

  if (isOnline()) {
    const calvingRecord = await fetchJson("/api/calving", {
      method: "POST",
      body: JSON.stringify(calvingPayload)
    });

    if (calvingRecord?.cow) {
      await updateCachedCow(calvingRecord.cow, farmId);
    } else {
      await updateCachedCow({
        ...(calvingData.cow || {}),
        id: calvingData.cow_id,
        farm_id: farmId,
        name: calvingData.cowName || calvingData.cow?.name || "",
        status: "व्याललेली"
      }, farmId);
    }

    if (calvingRecord?.reminder) {
      await cacheReminders([calvingRecord.reminder], farmId);
    }

    if (calvingRecord?.completedReminders?.length > 0) {
      await cacheReminders(calvingRecord.completedReminders, farmId);
    } else if (calvingRecord?.completedReminder) {
      await cacheReminders([calvingRecord.completedReminder], farmId);
    }

    return { success: true, offline: false, data: calvingRecord };
  }

  await queueAction({
    type: "CREATE",
    entity: "calving",
    endpoint: "/api/calving",
    method: "POST",
    payload: calvingPayload,
    farm_id: farmId,
    cow_id: calvingData.cow_id,
    cowName: calvingData.cowName || ""
  });
  await updateCachedCow({
    ...(calvingData.cow || {}),
    id: calvingData.cow_id,
    farm_id: farmId,
    name: calvingData.cowName || calvingData.cow?.name || "",
    status: "व्याललेली",
    _pending: true
  }, farmId);
  await addLocalReminder({
    ...reminderPayload,
    cows: calvingData.cow
      ? { id: calvingData.cow_id, name: calvingData.cow.name, status: "व्याललेली" }
      : null,
    _generated: true,
    createdAt: nowISO()
  }, farmId);

  if (calvingData.reminderId) {
    await markReminderDoneLocally(calvingData.reminderId, farmId);
  }

  return { success: true, offline: true, data: { ...calvingPayload, id: tempId("calving") } };
}
