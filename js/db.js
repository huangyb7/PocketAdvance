/* ============================================================
   IndexedDB：本地 ROM 存档柜
   ============================================================ */

(function () {
  "use strict";

  var DB_NAME = "pocket-advance";
  var DB_VERSION = 1;
  var STORE = "roms";
  var dbPromise = null;
  var memory = []; // 隐私模式 / 无 IndexedDB 时的兜底

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve) {
      if (!("indexedDB" in window)) return resolve(null);
      var req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        return resolve(null);
      }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { resolve(null); };
      req.onblocked = function () { resolve(null); };
    });
    return dbPromise;
  }

  function tx(mode) {
    return open().then(function (db) {
      if (!db) return null;
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  function wrap(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function all() {
    return tx("readonly").then(function (store) {
      if (!store) return memory.slice();
      return wrap(store.getAll()).then(function (rows) {
        return rows || [];
      });
    }).catch(function () { return memory.slice(); });
  }

  function put(record) {
    return tx("readwrite").then(function (store) {
      if (!store) {
        memory = memory.filter(function (r) { return r.id !== record.id; });
        memory.push(record);
        return record;
      }
      return wrap(store.put(record)).then(function () { return record; });
    });
  }

  function get(id) {
    return tx("readonly").then(function (store) {
      if (!store) return memory.find(function (r) { return r.id === id; }) || null;
      return wrap(store.get(id)).then(function (r) { return r || null; });
    }).catch(function () { return null; });
  }

  function remove(id) {
    return tx("readwrite").then(function (store) {
      if (!store) {
        memory = memory.filter(function (r) { return r.id !== id; });
        return;
      }
      return wrap(store.delete(id));
    });
  }

  function uid() {
    return "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  window.ROMDB = { all: all, put: put, get: get, remove: remove, uid: uid };
})();
