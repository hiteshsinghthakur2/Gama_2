
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global state for sync tracking
let _supabase: SupabaseClient | null = null;
let lastSyncTime: Date | null = null;
let syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';

// Helper to get or init client
export const getClient = () => {
  if (_supabase) return _supabase;

  const url = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' && process.env.SUPABASE_URL) || (window as any).SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY) || (window as any).SUPABASE_ANON_KEY;

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

let webhookSyncTimeout: any = null;

const triggerWebhookSync = () => {
  const webhookUrl = localStorage.getItem('bos_cloud_webhook_url');
  if (!webhookUrl) return;

  if (webhookSyncTimeout) clearTimeout(webhookSyncTimeout);
  
  // Debounce the webhook sync by 3 seconds to avoid spamming the webhook URL
  webhookSyncTimeout = setTimeout(async () => {
    try {
      localStorage.setItem('bos_cloud_webhook_sync_status', 'syncing');
      window.dispatchEvent(new Event('webhook-sync-update'));

      const payload: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bos_cloud_') && key !== 'bos_cloud_webhook_url' && key !== 'bos_cloud_webhook_sync_status' && key !== 'bos_cloud_webhook_last_sync') {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              let dataToSync = parsed.data !== undefined ? parsed.data : parsed;
              
              // Strip logoUrl to prevent huge payloads which crash Google Apps Script limits
              if (key === 'bos_cloud_business_profile' && dataToSync && dataToSync.logoUrl) {
                dataToSync = { ...dataToSync };
                delete dataToSync.logoUrl;
              }
              
              payload[key] = dataToSync;
            }
          } catch(e) {}
        }
      }
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Use no-cors to prevent preflight blocking on some webhooks
      });
      localStorage.setItem('bos_cloud_webhook_sync_status', 'success');
      localStorage.setItem('bos_cloud_webhook_last_sync', new Date().toISOString());
      window.dispatchEvent(new Event('webhook-sync-update'));
      console.log('Successfully synced to webhook');
    } catch (e) {
      console.error('Failed to sync to webhook', e);
      localStorage.setItem('bos_cloud_webhook_sync_status', 'error');
      localStorage.setItem('bos_cloud_webhook_last_sync', new Date().toISOString());
      window.dispatchEvent(new Event('webhook-sync-update'));
    }
  }, 3000);
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
    if (!client) return { success: false, message: 'No credentials provided in environment variables.' };
    
    try {
      const { data, error } = await client
        .from('user_data')
        .select('key_id')
        .limit(1);
      
      if (error) throw error;
      return { success: true, message: 'Connected to Supabase' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Table user_data not found or RLS policy blocked access.' };
    }
  },

  forceWebhookSync: () => {
    triggerWebhookSync();
  },

  async save(key: string, data: any) {
    const timestamp = new Date().toISOString();
    // Always save local first, with timestamp
    localStorage.setItem(key, JSON.stringify({ data, timestamp }));
    
    triggerWebhookSync();

    const client = getClient();
    if (client) {
      try {
        // Since login is removed, we use a default hardcoded ID for syncing
        const currentUserId = 'admin-1';

        syncStatus = 'syncing';
        window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'syncing' } }));

        const { error } = await client
          .from('user_data')
          .upsert({ 
            user_id: currentUserId,
            key_id: key, 
            content: data, 
            updated_at: timestamp 
          }, { onConflict: 'user_id,key_id' });

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
        // Since login is removed, we use a default hardcoded ID for syncing
        const currentUserId = 'admin-1';
        
        const { data, error } = await client
          .from('user_data')
          .select('content, updated_at')
          .eq('user_id', currentUserId)
          .eq('key_id', key)
          .single();
          
        if (!error && data) {
          // Always prefer cloud data if local is empty or default, OR if cloud is newer
          const isLocalEmpty = !localData || (Array.isArray(localData) && localData.length === 0);
          
          if (isLocalEmpty || !localTimestamp || new Date(data.updated_at) >= new Date(localTimestamp)) {
            // Cloud is newer, same, or local is empty - update local
            localStorage.setItem(key, JSON.stringify({ data: data.content, timestamp: data.updated_at }));
            return data.content;
          } else {
            // Local is newer and NOT empty, return local and trigger a sync
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
