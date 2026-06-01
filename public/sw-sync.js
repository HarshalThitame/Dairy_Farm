(function () {
  const DB_NAME = "goshala-local";
  const DB_VERSION = 4;

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function normalizePushPayload(event) {
    if (!event.data) {
      return {
        title: "🐄 माझी डेअरी",
        body: "नवीन सूचना आली आहे."
      };
    }

    const text = event.data.text();
    const parsed = safeJsonParse(text);
    const payload = parsed || { body: text };
    const notification = payload.notification || {};
    const data = payload.data || {};

    return {
      id: payload.id || payload.notificationId || data.id || data.notificationId || payload.tag || `${Date.now()}`,
      title: payload.title || notification.title || data.title || "🐄 माझी डेअरी",
      body: payload.body || payload.message || notification.body || data.body || data.message || "नवीन सूचना आली आहे.",
      tag: payload.tag || data.tag || payload.id || payload.notificationId || "majhi-dairy-notification",
      url: payload.url || data.url || "/",
      icon: payload.icon || notification.icon || data.icon || "/icons/icon-192x192.png",
      badge: payload.badge || notification.badge || data.badge || "/icons/icon-192x192.png"
    };
  }

  async function postNotificationToClients(notification) {
    const clientsList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    clientsList.forEach((client) => {
      client.postMessage({
        type: "MAJHI_DAIRY_PUSH_NOTIFICATION",
        notification
      });
    });
  }

  function openLocalDB() {
    return new Promise((resolve, reject) => {
      if (!self.indexedDB) {
        resolve(null);
        return;
      }

      const request = self.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function () {
        const db = request.result;
        let store;

        if (!db.objectStoreNames.contains("pending_sync")) {
          store = db.createObjectStore("pending_sync", {
            keyPath: "localId",
            autoIncrement: true
          });
          store.createIndex("type", "type");
          store.createIndex("createdAt", "createdAt");
          store.createIndex("synced", "synced");
        }

        if (!db.objectStoreNames.contains("cows_cache")) {
          store = db.createObjectStore("cows_cache", { keyPath: "id" });
          store.createIndex("name", "name");
          store.createIndex("status", "status");
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("farm_id", "farm_id");
        }

        if (!db.objectStoreNames.contains("milk_cache")) {
          store = db.createObjectStore("milk_cache", { keyPath: "id" });
          store.createIndex("cow_id", "cow_id");
          store.createIndex("date", "date");
          store.createIndex("farm_id", "farm_id");
        }

        if (!db.objectStoreNames.contains("reminders_cache")) {
          store = db.createObjectStore("reminders_cache", { keyPath: "id" });
          store.createIndex("reminder_date", "reminder_date");
          store.createIndex("is_done", "is_done");
          store.createIndex("type", "type");
          store.createIndex("farm_id", "farm_id");
        }

        if (!db.objectStoreNames.contains("health_cache")) {
          store = db.createObjectStore("health_cache", { keyPath: "id" });
          store.createIndex("cow_id", "cow_id");
          store.createIndex("date", "date");
          store.createIndex("type", "type");
          store.createIndex("farm_id", "farm_id");
        }

        if (!db.objectStoreNames.contains("ai_cache")) {
          store = db.createObjectStore("ai_cache", { keyPath: "id" });
          store.createIndex("cow_id", "cow_id");
          store.createIndex("ai_date", "ai_date");
          store.createIndex("farm_id", "farm_id");
        }

        if (!db.objectStoreNames.contains("dairy_slips_cache")) {
          store = db.createObjectStore("dairy_slips_cache", { keyPath: "id" });
          store.createIndex("slip_date", "slip_date");
          store.createIndex("farm_id", "farm_id");
        }

        if (!db.objectStoreNames.contains("settlements_cache")) {
          store = db.createObjectStore("settlements_cache", { keyPath: "id" });
          store.createIndex("settlement_date", "settlement_date");
          store.createIndex("farm_id", "farm_id");
        }

        if (!db.objectStoreNames.contains("expenses_cache")) {
          store = db.createObjectStore("expenses_cache", { keyPath: "id" });
          store.createIndex("expense_date", "expense_date");
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
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function getAllRecords(db) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("pending_sync", "readonly");
      const request = tx.objectStore("pending_sync").getAll();

      request.onsuccess = function () {
        resolve(request.result || []);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function putRecord(db, record) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("pending_sync", "readwrite");
      const request = tx.objectStore("pending_sync").put(record);

      request.onsuccess = function () {
        resolve();
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  async function markSynced(db, record) {
    await putRecord(db, {
      ...record,
      synced: true,
      syncedAt: new Date().toISOString(),
      syncError: null,
      permanentFail: false
    });
  }

  async function markFailed(db, record, error) {
    const retryCount = Number(record.retryCount || 0) + 1;

    await putRecord(db, {
      ...record,
      retryCount,
      syncError: String(error && error.message ? error.message : "समक्रमण चुकले."),
      permanentFail: retryCount > 3
    });
  }

  async function syncRecord(record) {
    const headers = { "Content-Type": "application/json" };

    if (record.token) {
      headers.Authorization = `Bearer ${record.token}`;
    }

    const response = await fetch(record.endpoint, {
      method: record.method,
      headers,
      body:
        record.method === "GET" || record.method === "HEAD"
          ? undefined
          : JSON.stringify(record.payload || {})
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "समक्रमण चुकले.");
    }
  }

  async function syncPendingQueue() {
    const db = await openLocalDB();

    if (!db) {
      return;
    }

    const records = (await getAllRecords(db))
      .filter((record) => !record.synced && !record.permanentFail)
      .sort((first, second) => String(first.createdAt).localeCompare(String(second.createdAt)));

    for (const record of records) {
      try {
        await syncRecord(record);
        await markSynced(db, record);
      } catch (error) {
        await markFailed(db, record, error);
      }
    }
  }

  self.addEventListener("sync", function (event) {
    if (event.tag === "goshala-sync") {
      event.waitUntil(syncPendingQueue());
    }
  });

  self.addEventListener("push", function (event) {
    const notification = normalizePushPayload(event);

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge,
          tag: notification.tag,
          data: {
            id: notification.id,
            url: notification.url,
            body: notification.body,
            title: notification.title
          },
          renotify: false
        }),
        postNotificationToClients(notification)
      ])
    );
  });

  self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    const targetUrl = event.notification.data?.url || "/";

    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
        const openClient = clientsList.find((client) => client.url.includes(self.location.origin));
        if (openClient) {
          openClient.focus();
          openClient.postMessage({
            type: "MAJHI_DAIRY_PUSH_NOTIFICATION",
            notification: {
              id: event.notification.data?.id,
              title: event.notification.data?.title || event.notification.title,
              body: event.notification.data?.body || "",
              tag: event.notification.tag
            }
          });
          return;
        }

        return self.clients.openWindow(targetUrl);
      })
    );
  });
})();
