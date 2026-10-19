import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { technicianApi } from '../services/api/technicianApi';
import { useAuth } from './AuthContext';

export type AvailabilityStatus = 'available' | 'busy' | 'offline';

export interface DaySchedule {
  day: string;
  label: string;
  hours: string;
  active: boolean;
}

export interface BlockedTimeSlot {
  id: string;
  timeRange: string;
  reason: string;
}

interface TechnicianContextType {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  availabilityStatus: AvailabilityStatus;
  setAvailabilityStatus: (status: AvailabilityStatus) => void;
  serviceRadius: number;
  setServiceRadius: (radius: number) => void;
  activeZone: string;
  schedules: DaySchedule[];
  updateDaySchedule: (day: string, active: boolean, hours?: string) => void;
  blockedSlots: BlockedTimeSlot[];
  addBlockedSlot: (timeRange: string, reason: string) => void;
  removeBlockedSlot: (id: string) => void;
  activeJobId: string | null;
  setActiveJobId: (id: string | null) => void;
  acceptedRequest: any | null;
  setAcceptedRequest: (req: any | null) => void;
  acceptRequest: (req: any) => void;
  refreshProfile: () => Promise<void>;
}

const INITIAL_SCHEDULES: DaySchedule[] = [
  { day: 'MON', label: 'Monday', hours: '9:00 AM – 7:00 PM', active: true },
  { day: 'TUE', label: 'Tuesday', hours: '9:00 AM – 7:00 PM', active: true },
  { day: 'WED', label: 'Wednesday', hours: '9:00 AM – 7:00 PM', active: true },
  { day: 'THU', label: 'Thursday', hours: '9:00 AM – 7:00 PM', active: true },
  { day: 'FRI', label: 'Friday', hours: '9:00 AM – 7:00 PM', active: true },
  { day: 'SAT', label: 'Saturday', hours: '10:00 AM – 5:00 PM', active: true },
  { day: 'SUN', label: 'Sunday', hours: 'Off Duty', active: false },
];

const INITIAL_BLOCKED_SLOTS: BlockedTimeSlot[] = [
  {
    id: 'block-1',
    timeRange: 'Today, 1:00 PM – 2:00 PM',
    reason: 'Lunch Break & Mechanical Restock',
  },
];

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

export const TechnicianProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const isTechnician = isAuthenticated && currentUser?.role === 'technician';

  const [isOnline, setIsOnlineState] = useState<boolean>(true);
  const [availabilityStatus, setAvailabilityStatusState] = useState<AvailabilityStatus>('available');
  const [serviceRadius, setServiceRadius] = useState<number>(15);
  const [activeZone, setActiveZone] = useState<string>('Delhi NCR Hub');
  const [schedules, setSchedules] = useState<DaySchedule[]>(INITIAL_SCHEDULES);
  const [blockedSlots, setBlockedSlots] = useState<BlockedTimeSlot[]>(INITIAL_BLOCKED_SLOTS);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [acceptedRequest, setAcceptedRequest] = useState<any | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!isTechnician) {
      return;
    }
    try {
      const res = await technicianApi.getProfile();
      if (res.success && res.data) {
        const dbOnline = Boolean(res.data.isOnline);
        setIsOnlineState(dbOnline);
        setAvailabilityStatusState(dbOnline ? 'available' : 'offline');
        if (res.data.currentZone) {
          setActiveZone(res.data.currentZone);
        }
      }
    } catch {
      // Retain optimistic local state if offline or unauthenticated
    }
  }, [isTechnician]);

  useEffect(() => {
    if (isTechnician) {
      refreshProfile();
    }
  }, [isTechnician, refreshProfile]);

  const acceptRequest = (req: any) => {
    const updatedReq = {
      ...req,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    };
    setAcceptedRequest(updatedReq);
    if (req?.id) {
      setActiveJobId(req.id);
    }
  };

  const setIsOnline = (online: boolean) => {
    setIsOnlineState(online);
    if (!online) {
      setAvailabilityStatusState('offline');
    } else {
      setAvailabilityStatusState('available');
    }
    if (isTechnician) {
      technicianApi.updateAvailability(online, activeZone).catch((err) => {
        console.warn('Technician availability server sync error:', err);
      });
    }
  };

  const setAvailabilityStatus = (status: AvailabilityStatus) => {
    setAvailabilityStatusState(status);
    const online = status !== 'offline';
    setIsOnlineState(online);
    if (isTechnician) {
      technicianApi.updateAvailability(online, activeZone).catch((err) => {
        console.warn('Technician availability server sync error:', err);
      });
    }
  };

  const updateDaySchedule = (day: string, active: boolean, hours?: string) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.day === day
          ? { ...item, active, hours: hours || item.hours }
          : item
      )
    );
  };

  const addBlockedSlot = (timeRange: string, reason: string) => {
    const newSlot: BlockedTimeSlot = {
      id: `block-${Date.now()}`,
      timeRange,
      reason,
    };
    setBlockedSlots((prev) => [...prev, newSlot]);
  };

  const removeBlockedSlot = (id: string) => {
    setBlockedSlots((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <TechnicianContext.Provider
      value={{
        isOnline,
        setIsOnline,
        availabilityStatus,
        setAvailabilityStatus,
        serviceRadius,
        setServiceRadius,
        activeZone,
        schedules,
        updateDaySchedule,
        blockedSlots,
        addBlockedSlot,
        removeBlockedSlot,
        activeJobId,
        setActiveJobId,
        acceptedRequest,
        setAcceptedRequest,
        acceptRequest,
        refreshProfile,
      }}
    >
      {children}
    </TechnicianContext.Provider>
  );
};

export const useTechnician = (): TechnicianContextType => {
  const context = useContext(TechnicianContext);
  if (!context) {
    throw new Error('useTechnician must be used within a TechnicianProvider');
  }
  return context;
};
