(function () {
  const DB_NAME = "goshala-local";
  const DB_VERSION = 2;

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
})();
