import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { getApiBaseUrl } from '../services/api/apiClient';

interface NetworkContextType {
  isOnline: boolean;
  isChecking: boolean;
  isSimulatedOffline: boolean;
  checkConnection: () => Promise<boolean>;
  setSimulatedOffline: (offline: boolean) => void;
  toggleSimulatedOffline: () => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isChecking: false,
  isSimulatedOffline: false,
  checkConnection: async () => true,
  setSimulatedOffline: () => {},
  toggleSimulatedOffline: () => {},
});

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  });

  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  // Web event listeners for online/offline
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        if (!isSimulatedOffline) {
          setIsOnline(true);
        }
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isSimulatedOffline]);

  // Actual connectivity test via health endpoint or fallback check
  const checkConnection = async (): Promise<boolean> => {
    if (isSimulatedOffline) {
      // In simulated mode, stay offline until simulation is toggled off
      setIsChecking(true);
      await new Promise((resolve) => setTimeout(resolve, 1400));
      setIsChecking(false);
      return false;
    }

    try {
      setIsChecking(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Ping health check or origin
      const healthUrl = `${getApiBaseUrl()}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      const connected = response.status >= 200 && response.status < 400;
      setIsOnline(connected);
      return connected;
    } catch {
      // If server is unreachable or offline
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        return false;
      }
      // If backend is down but browser is online, could still be offline to app
      setIsOnline(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const setSimulatedOffline = (offline: boolean) => {
    setIsSimulatedOffline(offline);
    setIsOnline(!offline);
  };

  const toggleSimulatedOffline = () => {
    const nextVal = !isSimulatedOffline;
    setIsSimulatedOffline(nextVal);
    setIsOnline(!nextVal);
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline: isSimulatedOffline ? false : isOnline,
        isChecking,
        isSimulatedOffline,
        checkConnection,
        setSimulatedOffline,
        toggleSimulatedOffline,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
