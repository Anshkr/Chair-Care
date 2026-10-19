import React, { createContext, useContext } from 'react';

export interface IntroContextType {
  onFinishIntro?: () => void;
}

export const IntroContext = createContext<IntroContextType>({});
export const useIntro = () => useContext(IntroContext);
