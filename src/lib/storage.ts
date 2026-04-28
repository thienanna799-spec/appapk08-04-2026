import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'driver-go-db';
const STORE_NAME = 'offline-sync';

export interface OfflineAction {
  id?: number;
  type: string;
  payload: any;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      },
    });
  }
  return dbPromise;
}

export const storage = {
  async addAction(type: string, payload: any) {
    const db = await getDB();
    return db.add(STORE_NAME, {
      type,
      payload,
      timestamp: Date.now(),
    });
  },

  async getActions(): Promise<OfflineAction[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async removeAction(id: number) {
    const db = await getDB();
    return db.delete(STORE_NAME, id);
  },

  async clearActions() {
    const db = await getDB();
    return db.clear(STORE_NAME);
  }
};
