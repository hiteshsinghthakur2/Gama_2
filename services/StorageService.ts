
// Global state for sync tracking
let lastSyncTime: Date | null = null;
let syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';

export const StorageService = {
  isCloudEnabled: () => true,
  
  getSyncInfo: () => ({
    status: syncStatus,
    lastSync: lastSyncTime,
    enabled: true
  }),

  async testConnection() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return { success: true, message: 'Connected to backend' };
      }
      return { success: false, message: 'Backend not responding' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection failed' };
    }
  },

  async save(key: string, data: any) {
    const timestamp = new Date().toISOString();
    // Always save local first, with timestamp
    localStorage.setItem(key, JSON.stringify({ data, timestamp }));

    syncStatus = 'syncing';
    window.dispatchEvent(new CustomEvent('sync-status-change', { detail: { status: 'syncing' } }));
    
    try {
      const res = await fetch(`/api/store/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      if (!res.ok) throw new Error('Failed to save to backend');
      
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

    try {
      const res = await fetch(`/api/store/${key}`);
      if (res.ok) {
        const { data, timestamp } = await res.json();
        
        // Compare timestamps
        if (!localTimestamp || new Date(timestamp) >= new Date(localTimestamp)) {
          // Cloud is newer or same, update local
          localStorage.setItem(key, JSON.stringify({ data, timestamp }));
          return data;
        } else {
          // Local is newer, return local and trigger a sync
          console.warn("Local data is newer than cloud data. Using local data.");
          StorageService.save(key, localData);
          return localData;
        }
      }
    } catch (e) {
      console.warn("Cloud load failed, falling back to local:", e);
    }

    return localData !== null ? localData : defaultValue;
  }
};
