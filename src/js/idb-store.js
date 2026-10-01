// ============================================================
// CRIMINT - IndexedDB Persistence Engine
// Almacenamiento persistente sin cuota de 5MB para dossieres,
// imágenes de perfil, archivos adjuntos (PDFs) y entidades tácticas.
// ============================================================

const DB_NAME = 'crimint_local_db';
const DB_VERSION = 1;
const STORES = ['personas', 'bandas', 'hechos', 'allanamientos', 'vinculos'];

let dbPromise = null;

export function getIDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          STORES.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          });
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => {
          console.warn('[IndexedDB] Error al abrir base de datos local:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('[IndexedDB] Excepción al inicializar:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function idbGetAll(storeName) {
  const db = await getIDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

export async function idbGet(storeName, id) {
  if (!id) return null;
  const db = await getIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

export async function idbPut(storeName, item) {
  if (!item || !item.id) return false;
  const db = await getIDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => {
        console.warn(`[IndexedDB] Error guardando en ${storeName}:`, e);
        resolve(false);
      };
    } catch (e) {
      console.warn(`[IndexedDB] Excepción guardando en ${storeName}:`, e);
      resolve(false);
    }
  });
}

export async function idbDelete(storeName, id) {
  if (!id) return false;
  const db = await getIDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}
