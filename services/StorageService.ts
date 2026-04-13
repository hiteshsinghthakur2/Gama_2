
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global state for sync tracking
let _supabase: SupabaseClient | null = null;
let lastSyncTime: Date | null = null;
let syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';

// Helper to get or init client
const getClient = () => {
  if (_supabase) return _supabase;

  const configStr = localStorage.getItem('SUPABASE_CONFIG');
  let url = (window as any).SUPABASE_URL;
  let key = (window as any).SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        url = config.url;
        key = config.key;
      } catch (e) {
        return null;
      }
    }
  }

  if (url && key) {
    try {
      _supabase = createClient(url, key);
      return _supabase;
    } catch (e) {
      console.error("Supabase Initialization Failed:", e);
      return null;
    }
  }
  return null;
};

export const StorageService = {
  isCloudEnabled: () => !!getClient(),
  
  getSyncInfo: () => ({
    status: syncStatus,
    lastSync: lastSyncTime,
    enabled: !!getClient()
  }),

  async testConnection() {
    const client = getClient();
    if (!client) return { success: false, message: 'No credentials provided' };
    
    try {
      const { data, error } = await client
        .from('user_data')
        .select('key_id')
        .limit(1);
      
      if (error) throw error;
      return { success: true, message: 'Connected to Supabase' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Table user_data not found' };
    }
  },

  async save(key: string, data: any) {
    const timestamp = new Date().toISOString();
    // Always save local first, with timestamp
    localStorage.setItem(key, JSON.stringify({ data, timestamp }));

    const client = getClient();
    if (client) {
      syncStatus = 'syncing';
      window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'syncing' } }));
      
      try {
        const { error } = await client
          .from('user_data')
          .upsert({ 
            key_id: key, 
            content: data, 
            updated_at: timestamp 
          }, { onConflict: 'key_id' });

        if (error) throw error;
        
        syncStatus = 'success';
        lastSyncTime = new Date();
        window.dispatchEvent(new CustomEvent('sync-status-change', { 
          detail: { status: 'success', time: lastSyncTime } 
        }));
      } catch (e) {
        console.error("Cloud Sync Error:", e);
        syncStatus = 'error';
        window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'error' } }));
      }
    }
  },

  async load(key: string, defaultValue: any) {
    const savedStr = localStorage.getItem(key);
    let localData = null;
    let localTimestamp = null;
    
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr);
        if (parsed && typeof parsed === 'object' && 'timestamp' in parsed && 'data' in parsed) {
          localData = parsed.data;
          localTimestamp = parsed.timestamp;
        } else {
          // Legacy format
          localData = parsed;
          localTimestamp = new Date(0).toISOString();
        }
      } catch (e) {
        localData = defaultValue;
      }
    }

    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('user_data')
          .select('content, updated_at')
          .eq('key_id', key)
          .single();
        
        if (!error && data) {
          // Compare timestamps
          if (!localTimestamp || new Date(data.updated_at) >= new Date(localTimestamp)) {
            // Cloud is newer or same, update local
            localStorage.setItem(key, JSON.stringify({ data: data.content, timestamp: data.updated_at }));
            return data.content;
          } else {
            // Local is newer, return local and trigger a sync
            console.warn("Local data is newer than cloud data. Using local data.");
            this.save(key, localData);
            return localData;
          }
        }
      } catch (e) {
        console.warn("Cloud load failed, falling back to local:", e);
      }
    }

    return localData !== null ? localData : defaultValue;
  }
};
