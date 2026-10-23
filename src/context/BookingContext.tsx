import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BookingDraft } from '../types/models';

interface BookingContextType {
  draft: BookingDraft;
  updateDraft: (updates: Partial<BookingDraft>) => void;
  resetDraft: () => void;
}

const initialDraft: BookingDraft = {
  serviceId: '',
  serviceTitle: '',
  chairType: '',
  symptoms: [],
  problemDescription: '',
  photoUris: [],
  serviceAddress: '',
  unitOrFloor: '',
  visitDate: '',
  timeSlot: '',
  estimatedTotal: 0,
  latitude: undefined,
  longitude: undefined,
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<BookingDraft>(initialDraft);

  const updateDraft = (updates: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const resetDraft = () => {
    setDraft(initialDraft);
  };

  return (
    <BookingContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
