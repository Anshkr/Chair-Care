import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { LightColors, DarkColors, applyTheme } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  theme: typeof LightColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'chaircare_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();

  // Load initial mode from storage or fallback to system
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'light';
  });

  const isDarkMode =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : systemScheme === 'dark';

  const theme = isDarkMode ? DarkColors : LightColors;

  // Apply theme to Colors singleton and HTML root
  useEffect(() => {
    applyTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(nextMode);
  }, [isDarkMode, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        themeMode,
        theme,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      isDarkMode: false,
      themeMode: 'light',
      theme: LightColors,
      toggleTheme: () => {},
      setThemeMode: () => {},
    };
  }
  return context;
};
