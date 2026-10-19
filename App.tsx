import React from 'react';
import { LogBox, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NetworkProvider } from './src/context/NetworkContext';
import { NetworkStatusBoundary } from './src/components/common/NetworkStatusBoundary';
import { AuthProvider } from './src/context/AuthContext';
import { BookingProvider } from './src/context/BookingContext';
import { TechnicianProvider } from './src/context/TechnicianContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// Suppress known upstream library deprecation notices on web platform
LogBox.ignoreLogs([
  '"shadow*" style props are deprecated. Use "boxShadow".',
  'props.pointerEvents is deprecated. Use style.pointerEvents',
  'Require cycle:',
]);

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const firstArg = args[0];
    if (
      typeof firstArg === 'string' &&
      (firstArg.includes('"shadow*" style props are deprecated') ||
       firstArg.includes('props.pointerEvents is deprecated') ||
       firstArg.includes('Require cycle:'))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

function ThemedApp() {
  const { isDarkMode } = useTheme();
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <NetworkStatusBoundary>
        <RootNavigator />
      </NetworkStatusBoundary>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <BookingProvider>
              <TechnicianProvider>
                <ThemedApp />
              </TechnicianProvider>
            </BookingProvider>
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

