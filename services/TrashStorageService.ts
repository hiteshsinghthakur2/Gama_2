import { getClient } from './StorageService';

export interface DeletedItem {
  id: string; // Unique trash entry ID
  originalId: string;
  type: 'invoice' | 'quotation' | 'delivery_challan' | 'purchase' | 'client' | 'lead';
  data: any; // The original object
  deletedAt: string;
  summary: string; // e.g. "Invoice INV-001"
}

const DB_NAME = 'bos_cloud_trash_db';
const STORE_NAME = 'trash_items';
const DB_VERSION = 1;
const CLOUD_KEY = 'bos_cloud_trash';
const CURRENT_USER_ID = 'admin-1';

export const TrashStorageService = {
  async getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async syncToCloud(allItems: DeletedItem[]): Promise<void> {
    const client = getClient();
    if (client) {
      try {
        const timestamp = new Date().toISOString();
        const { error } = await client
          .from('user_data')
          .upsert({
              user_id: CURRENT_USER_ID, 
              key_id: CLOUD_KEY,
              content: allItems,
              updated_at: timestamp
            }, { onConflict: 'user_id,key_id' });
        if (error) throw error;
      } catch (e) {
        console.error("Trash Cloud Sync Error:", e);
      }
    }
  },

  async syncFromCloud(): Promise<DeletedItem[]> {
    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('user_data')
          .select('content, updated_at')
          .eq('user_id', CURRENT_USER_ID)
          .eq('key_id', CLOUD_KEY)
          .single();
          
        if (!error && data && data.content) {
          const cloudItems = data.content as DeletedItem[];
          const db = await this.getDb();
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.clear();
            cloudItems.forEach(item => {
              store.put(item);
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
          return cloudItems;
        }
      } catch (e) {
        console.error("Trash Cloud Load Error:", e);
      }
    }
    return [];
  },

  async moveToTrash(item: Omit<DeletedItem, 'id' | 'deletedAt'>): Promise<void> {
    const deletedItem: DeletedItem = {
      ...item,
      id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deletedAt: new Date().toISOString()
    };

    const db = await this.getDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(deletedItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const allItems = await this.loadAllLocal();
    await this.syncToCloud(allItems);
  },

  async loadAllLocal(): Promise<DeletedItem[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result as DeletedItem[]);
      request.onerror = () => reject(request.error);
    });
  },
  
  async loadAll(): Promise<DeletedItem[]> {
    let localItems = await this.loadAllLocal();
    const client = getClient();
    if (client) {
       const cloudItems = await this.syncFromCloud();
       if (cloudItems && cloudItems.length > 0) {
           localItems = cloudItems;
       }
    }

    // Auto cleanup items older than 30 days
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const validItems = localItems.filter(item => {
      const deletedAt = new Date(item.deletedAt).getTime();
      return (now - deletedAt) <= THIRTY_DAYS;
    });

    if (validItems.length < localItems.length) {
      // Need to cleanup
      const toDelete = localItems.filter(item => !validItems.includes(item));
      for (const item of toDelete) {
         await this.deletePermanentLocal(item.id);
      }
      await this.syncToCloud(validItems);
    }

    return validItems.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  },

  async deletePermanentLocal(id: string): Promise<void> {
    const db = await this.getDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deletePermanent(id: string): Promise<void> {
    await this.deletePermanentLocal(id);
    const allItems = await this.loadAllLocal();
    await this.syncToCloud(allItems);
  },
  
  async clearTrash(): Promise<void> {
    const db = await this.getDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    await this.syncToCloud([]);
  }
};
