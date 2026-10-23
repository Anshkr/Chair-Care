import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CustomerNavigator } from './CustomerNavigator';
import { TechnicianNavigator } from './TechnicianNavigator';
import { AdminNavigator } from './AdminNavigator';
import { DevRoleSwitcher } from '../components/dev/DevRoleSwitcher';
import { Colors } from '../constants/theme';

export const RootNavigator: React.FC = () => {
  const { role, isAuthenticated, currentUser, isTechnicianAuthorized, isAdminAuthorized } = useAuth();
  const { isDarkMode, theme } = useTheme();

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
    // Role-based portal routing: only activated once authenticated with corresponding role
    if (isAdminAuthorized) {
      return <AdminNavigator />;
    }

    if (isTechnicianAuthorized) {
      return <TechnicianNavigator />;
    }

    // Single source of truth: all login and account creation starts in the customer portal
    return <CustomerNavigator />;
  };

  return (
    <NavigationContainer theme={navTheme}>
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        {renderRoleNavigator()}
        <DevRoleSwitcher />
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
