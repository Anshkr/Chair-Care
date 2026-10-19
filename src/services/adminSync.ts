import { useEffect } from 'react';

type AdminSyncCallback = () => void | Promise<void>;

class AdminSyncEmitter {
  private listeners: Set<AdminSyncCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'chaircare_admin_sync_tick') {
          this.notifyLocal();
        }
      });
    }
  }

  subscribe(callback: AdminSyncCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifySync(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('chaircare_admin_sync_tick', Date.now().toString());
      } catch {
        // silent
      }
    }
    this.notifyLocal();
  }

  private notifyLocal(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('Admin sync listener error:', err);
      }
    });
  }
}

export const adminSyncEmitter = new AdminSyncEmitter();

/**
 * Universal hook for keeping any admin or customer screen in live sync:
 * 1. Automatically refetches on screen focus (React Navigation).
 * 2. Automatically refetches when ANY admin mutation occurs across the application.
 * 3. Cross-tab/window synchronisation via storage events.
 */
export function useAdminSync(navigation: any, refreshCallback: AdminSyncCallback) {
  useEffect(() => {
    // 1. Navigation focus listener
    const unsubscribeFocus = navigation?.addListener?.('focus', () => {
      refreshCallback();
    });

    // 2. Global mutation / cross-window sync listener
    const unsubscribeSync = adminSyncEmitter.subscribe(() => {
      refreshCallback();
    });

    return () => {
      if (typeof unsubscribeFocus === 'function') {
        unsubscribeFocus();
      }
      unsubscribeSync();
    };
  }, [navigation, refreshCallback]);
}
