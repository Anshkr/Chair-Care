import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CustomerNavigator } from './CustomerNavigator';
import { TechnicianNavigator, TechnicianAuthNavigator } from './TechnicianNavigator';
import { AdminNavigator } from './AdminNavigator';
import { IntroNavigator } from './IntroNavigator';
import { TechnicianLoginChaircareMobileScreen } from '../screens/technician';
import { SuperAdminLoginChaircareMobileScreen } from '../screens/admin';
import { DevRoleSwitcher } from '../components/dev/DevRoleSwitcher';
import { Colors } from '../constants/theme';
import { hasSeenIntro, markIntroAsSeen, resetIntroSeen } from '../utils/introStorage';

export const RootNavigator: React.FC = () => {
  const { role, isAuthenticated, currentUser, isTechnicianAuthorized, isAdminAuthorized } = useAuth();
  const { isDarkMode, theme } = useTheme();

  // Only show intro if user has NOT seen it before and is NOT already authenticated
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (isAuthenticated) return false;
    return !hasSeenIntro();
  });

  // Whenever user becomes authenticated, ensure intro is marked as seen and dismissed
  useEffect(() => {
    if (isAuthenticated) {
      markIntroAsSeen();
      setShowIntro(false);
    }
  }, [isAuthenticated]);

  const handleFinishIntro = () => {
    markIntroAsSeen();
    setShowIntro(false);
  };

  const navTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.surface,
      card: theme.surfaceContainerLowest,
      text: theme.onSurface,
      border: theme.outlineHairline,
      primary: theme.secondaryCobalt,
    },
  };

  const renderRoleNavigator = () => {
    if (showIntro) {
      return <IntroNavigator onFinishIntro={handleFinishIntro} />;
    }

    // Role-based navigation guarding and isolation
    switch (role) {
      case 'technician':
        if (!isTechnicianAuthorized) {
          return <TechnicianAuthNavigator />;
        }
        return <TechnicianNavigator />;

      case 'admin':
        if (!isAdminAuthorized) {
          return (
            <SuperAdminLoginChaircareMobileScreen
              navigation={{
                canGoBack: () => false,
                goBack: () => {},
                navigate: () => {},
              }}
            />
          );
        }
        return <AdminNavigator />;

      case 'customer':
      default:
        return <CustomerNavigator />;
    }
  };

  return (
    <NavigationContainer theme={navTheme}>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {renderRoleNavigator()}
        <DevRoleSwitcher onReplayIntro={() => setShowIntro(true)} />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
});
