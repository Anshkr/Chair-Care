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

export interface QrCollectionRecord {
  id: string;
  trackingCode: string;
  customerName: string;
  chairModel: string;
  serviceTitle: string;
  amount: number;
  completedAt: string;
  upiId: string;
  upiPhone: string;
  paymentMethod: 'direct_upi_qr';
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
  upiId: string;
  setUpiId: (id: string) => void;
  upiPhone: string;
  setUpiPhone: (phone: string) => void;
  updateUpiSettings: (newUpiId: string, newUpiPhone: string) => Promise<boolean>;
  qrCollections: QrCollectionRecord[];
  recordQrPayment: (payment: {
    trackingCode: string;
    customerName: string;
    chairModel: string;
    serviceTitle: string;
    amount: number;
  }) => void;
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

  // Dynamic Direct UPI State
  const initialUpiId = (() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('chaircare_technician_upi_id');
        if (saved) return saved;
      } catch {}
    }
    const rawDigits = (currentUser?.phone || '').replace(/[^0-9]/g, '');
    return rawDigits.length >= 10 ? `${rawDigits.slice(-10)}@paytm` : '9217460742@paytm';
  })();

  const initialUpiPhone = (() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('chaircare_technician_upi_phone');
        if (saved) return saved;
      } catch {}
    }
    return currentUser?.phone || '+91 92174 60742';
  })();

  const [upiId, setUpiId] = useState<string>(initialUpiId);
  const [upiPhone, setUpiPhone] = useState<string>(initialUpiPhone);
  const [qrCollections, setQrCollections] = useState<QrCollectionRecord[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('chaircare_technician_qr_collections');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

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
        if (res.data.upiId && res.data.upiId.trim()) {
          setUpiId(res.data.upiId.trim());
          if (typeof window !== 'undefined' && window.localStorage) {
            try { window.localStorage.setItem('chaircare_technician_upi_id', res.data.upiId.trim()); } catch {}
          }
        }
        if (res.data.upiPhone && res.data.upiPhone.trim()) {
          setUpiPhone(res.data.upiPhone.trim());
          if (typeof window !== 'undefined' && window.localStorage) {
            try { window.localStorage.setItem('chaircare_technician_upi_phone', res.data.upiPhone.trim()); } catch {}
          }
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

  const updateUpiSettings = async (newUpiId: string, newUpiPhone: string): Promise<boolean> => {
    const cleanUpi = (newUpiId || '').trim();
    const cleanPhone = (newUpiPhone || '').trim();
    if (!cleanUpi && !cleanPhone) return false;

    if (cleanUpi) setUpiId(cleanUpi);
    if (cleanPhone) setUpiPhone(cleanPhone);

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (cleanUpi) window.localStorage.setItem('chaircare_technician_upi_id', cleanUpi);
        if (cleanPhone) window.localStorage.setItem('chaircare_technician_upi_phone', cleanPhone);
      } catch {}
    }

    try {
      await technicianApi.updateProfile({
        upiId: cleanUpi,
        upiPhone: cleanPhone,
      });
      return true;
    } catch (err) {
      console.warn('⚠️ [technicianApi.updateProfile upi sync error]:', err);
      return true; // local state updated
    }
  };

  const recordQrPayment = (payment: {
    trackingCode: string;
    customerName: string;
    chairModel: string;
    serviceTitle: string;
    amount: number;
  }) => {
    const newRecord: QrCollectionRecord = {
      id: `qr-col-${Date.now()}`,
      trackingCode: payment.trackingCode,
      customerName: payment.customerName,
      chairModel: payment.chairModel,
      serviceTitle: payment.serviceTitle,
      amount: payment.amount,
      completedAt: 'Just Now',
      upiId,
      upiPhone,
      paymentMethod: 'direct_upi_qr',
    };

    setQrCollections((prev) => {
      const updated = [newRecord, ...prev];
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('chaircare_technician_qr_collections', JSON.stringify(updated.slice(0, 50)));
        } catch {}
      }
      return updated;
    });

    if (acceptedRequest) {
      setAcceptedRequest({
        ...acceptedRequest,
        isPaid: true,
        is_paid: true,
        paymentMethod: 'direct_upi_qr',
      });
    }
  };

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
        upiId,
        setUpiId,
        upiPhone,
        setUpiPhone,
        updateUpiSettings,
        qrCollections,
        recordQrPayment,
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
