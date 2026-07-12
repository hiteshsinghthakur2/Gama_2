import { PurchaseInvoice } from '../types';
import { getClient } from './StorageService';

const DB_NAME = 'bos_cloud_purchases_db';
const STORE_NAME = 'purchase_invoices';
const DB_VERSION = 1;
const CLOUD_KEY = 'bos_cloud_purchases';
const CURRENT_USER_ID = 'admin-1';

export const PurchaseStorageService = {
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

  async syncToCloud(allInvoices: PurchaseInvoice[]): Promise<void> {
    const client = getClient();
    if (client) {
      try {
        const timestamp = new Date().toISOString();
        const { error } = await client
          .from('user_data')
          .upsert({ 
             user_id: CURRENT_USER_ID,
             key_id: CLOUD_KEY, 
             content: allInvoices, 
             updated_at: timestamp 
           }, { onConflict: 'user_id,key_id' });
        if (error) throw error;
      } catch (e) {
        console.error("Purchase Cloud Sync Error:", e);
      }
    }
  },

  async syncFromCloud(): Promise<PurchaseInvoice[]> {
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
          const cloudInvoices = data.content as PurchaseInvoice[];
          // Update local DB with cloud data
          const db = await this.getDb();
          await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Clear existing and add from cloud to be safe
            store.clear();
            
            cloudInvoices.forEach(inv => {
              store.put(inv);
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
          });
          return cloudInvoices;
        }
      } catch (e) {
        console.error("Purchase Cloud Load Error:", e);
      }
    }
    return [];
  },

  async save(invoice: PurchaseInvoice): Promise<void> {
    const db = await this.getDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(invoice);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    const allInvoices = await this.loadAllLocal();
    await this.syncToCloud(allInvoices);
  },

  async loadAllLocal(): Promise<PurchaseInvoice[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result as PurchaseInvoice[]);
      request.onerror = () => reject(request.error);
    });
  },
  
  async loadAll(): Promise<PurchaseInvoice[]> {
    const localInvoices = await this.loadAllLocal();
    // In a real app we'd compare timestamps, for now we assume cloud takes precedence
    // if it exists, otherwise use local
    const client = getClient();
    if (client) {
       const cloudInvoices = await this.syncFromCloud();
       if (cloudInvoices && cloudInvoices.length > 0) {
           return cloudInvoices;
       }
    }
    return localInvoices;
  },

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    const allInvoices = await this.loadAllLocal();
    await this.syncToCloud(allInvoices);
  }
};
