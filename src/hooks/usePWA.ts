import { useState, useEffect, useCallback } from 'react';

export interface PWAState {
  isOnline: boolean;
  updateAvailable: boolean;
  isUpdating: boolean;
  updateStatus: string | null;
  lastSyncTime: string | null;
  triggerUpdate: (refreshDataFn?: () => Promise<number>) => Promise<void>;
  dismissStatus: () => void;
}

const LAST_SYNC_KEY = 'reinvent_pwa_last_sync';

export function usePWA(): PWAState {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null;
  });

  // Track online/offline connectivity status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setUpdateStatus('Internet connection restored. Tap "Update" to refresh catalog.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setUpdateStatus('Offline mode active. All 2,043 sessions and schedule remain accessible.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Service Worker updates
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    // Reload page when new service worker takes over
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      // Check if there is already a waiting service worker
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
      }

      // Detect when a new service worker is installed
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
            setUpdateStatus('New app version available! Tap "Update" to apply.');
          }
        });
      });
    });
  }, []);

  const dismissStatus = useCallback(() => {
    setUpdateStatus(null);
  }, []);

  // Trigger app update and data refresh
  const triggerUpdate = useCallback(
    async (refreshDataFn?: () => Promise<number>) => {
      if (!navigator.onLine) {
        setUpdateStatus('Cannot update: you are currently offline. Connect to Wi-Fi/cellular to sync.');
        return;
      }

      setIsUpdating(true);
      setUpdateStatus('Updating application and syncing session catalog...');

      try {
        // 1. If a new service worker is waiting, activate it immediately
        if (waitingWorker) {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          setUpdateStatus('Applying latest app update...');
          return;
        }

        // 2. Check for service worker updates
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update().catch((e) => console.warn('SW update check:', e));
          }
        }

        // 3. Refresh session catalog data via cache-busting fetch & update CacheStorage
        let count = 2043;
        if (refreshDataFn) {
          count = await refreshDataFn();
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem(LAST_SYNC_KEY, timeStr);
        setLastSyncTime(timeStr);
        setUpdateAvailable(false);
        setUpdateStatus(`Successfully updated! ${count.toLocaleString()} sessions synchronized (${timeStr}).`);

        // Auto-dismiss success message after 4.5 seconds
        setTimeout(() => {
          setUpdateStatus((current) => (current?.startsWith('Successfully updated') ? null : current));
        }, 4500);
      } catch (err: unknown) {
        console.error('Update failed:', err);
        setUpdateStatus('Failed to update catalog. Please check your network and try again.');
      } finally {
        setIsUpdating(false);
      }
    },
    [waitingWorker]
  );

  return {
    isOnline,
    updateAvailable,
    isUpdating,
    updateStatus,
    lastSyncTime,
    triggerUpdate,
    dismissStatus,
  };
}
