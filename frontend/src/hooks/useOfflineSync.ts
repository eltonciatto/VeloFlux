import { useState, useEffect, useCallback } from 'react';

interface CachedData {
  [key: string]: {
    data: unknown;
    timestamp: number;
    expires: number;
  };
}

interface OfflineAction {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}

interface OfflineSyncResult {
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  lastSync: Date | null;
  pendingChanges: number;
  cacheData: (key: string, data: unknown, ttl?: number) => void;
  getCachedData: (key: string) => unknown | null;
  clearCache: () => void;
  syncPendingChanges: () => Promise<void>;
  queueOfflineAction: (action: OfflineAction) => void;
}

const CACHE_KEY = 'veloflux_offline_cache';
const PENDING_ACTIONS_KEY = 'veloflux_pending_actions';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const useOfflineSync = (): OfflineSyncResult => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'pending'>('synced');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);

  // Initialize from localStorage
  useEffect(() => {
    const savedLastSync = localStorage.getItem('veloflux_last_sync');
    if (savedLastSync) {
      setLastSync(new Date(savedLastSync));
    }

    const pendingActions = getPendingActions();
    setPendingChanges(pendingActions.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Online/offline event handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('pending');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cache management
  const cacheData = useCallback((key: string, data: unknown, ttl: number = DEFAULT_TTL) => {
    try {
      const cached: CachedData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const now = Date.now();
      
      cached[key] = {
        data,
        timestamp: now,
        expires: now + ttl
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  const getCachedData = useCallback((key: string) => {
    try {
      const cached: CachedData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const item = cached[key];
      
      if (!item) return null;
      
      const now = Date.now();
      if (now > item.expires) {
        // Remove expired item
        delete cached[key];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  // Pending actions management
  const getPendingActions = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || '[]');
    } catch (error) {
      console.error('Error getting pending actions:', error);
      return [];
    }
  }, []);

  const queueOfflineAction = useCallback((action: OfflineAction) => {
    try {
      const actions = getPendingActions();
      actions.push({
        ...action,
        timestamp: Date.now(),
        id: Date.now().toString()
      });
      
      localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
      setPendingChanges(actions.length);
    } catch (error) {
      console.error('Error queuing offline action:', error);
    }
  }, [getPendingActions]);

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline) return;

    const actions = getPendingActions();
    if (actions.length === 0) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');

    try {
      // Process actions in order
      for (const action of actions) {
        await processAction(action);
      }

      // Clear pending actions after successful sync
      localStorage.removeItem(PENDING_ACTIONS_KEY);
      setPendingChanges(0);
      setSyncStatus('synced');
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('veloflux_last_sync', now.toISOString());
    } catch (error) {
      console.error('Error syncing pending changes:', error);
      setSyncStatus('error');
    }
  }, [isOnline, getPendingActions]);

  const processAction = async (action: OfflineAction) => {
    // Mock API call - replace with actual implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve(action);
        } else {
          reject(new Error('Sync failed'));
        }
      }, 500);
    });
  };

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingChanges > 0 && syncStatus !== 'syncing') {
      syncPendingChanges();
    }
  }, [isOnline, pendingChanges, syncStatus, syncPendingChanges]);

  return {
    isOnline,
    syncStatus,
    lastSync,
    pendingChanges,
    cacheData,
    getCachedData,
    clearCache,
    syncPendingChanges,
    queueOfflineAction
  };
};

export default useOfflineSync;
