import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Switch,
  Animated,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppIcon } from './AppIcon';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';

export interface ThemeSwitchButtonProps {
  variant?: 'header' | 'pill' | 'row' | 'floating';
  style?: StyleProp<ViewStyle>;
  showLabel?: boolean;
}

export const ThemeSwitchButton: React.FC<ThemeSwitchButtonProps> = ({
  variant = 'header',
  style,
  showLabel = false,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

  if (variant === 'row') {
    return (
      <View style={[styles.rowContainer, style]}>
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.rowIconBox,
              { backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(245, 158, 11, 0.15)' },
            ]}
          >
            <AppIcon
              name={isDarkMode ? 'Moon' : 'Sun'}
              size={18}
              color={isDarkMode ? '#60A5FA' : '#D97706'}
            />
          </View>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowTitle}>Dark Mode</Text>
            <Text style={styles.rowSubtitle}>
              {isDarkMode ? 'OLED Midnight Slate Active' : 'Calibrated Daylight Bright'}
            </Text>
          </View>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: Colors.outlineVariant, true: '#2563EB' }}
          thumbColor={isDarkMode ? '#60A5FA' : '#FFFFFF'}
        />
      </View>
    );
  }

  if (variant === 'pill') {
    return (
      <TouchableOpacity
        style={[
          styles.pillBtn,
          isDarkMode ? styles.pillBtnDark : styles.pillBtnLight,
          style,
        ]}
        onPress={toggleTheme}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <AppIcon
          name={isDarkMode ? 'Sun' : 'Moon'}
          size={14}
          color={isDarkMode ? '#F59E0B' : Colors.onSurface}
        />
        <Text style={[styles.pillText, { color: isDarkMode ? '#F1F5F9' : Colors.onSurface }]}>
          {isDarkMode ? 'Dark' : 'Light'}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'floating') {
    return (
      <TouchableOpacity
        style={[
          styles.floatingBtn,
          isDarkMode ? styles.floatingBtnDark : styles.floatingBtnLight,
          style,
        ]}
        onPress={toggleTheme}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Toggle theme: currently ${isDarkMode ? 'dark' : 'light'}`}
      >
        <AppIcon
          name={isDarkMode ? 'Sun' : 'Moon'}
          size={18}
          color={isDarkMode ? '#F59E0B' : '#0F172A'}
        />
      </TouchableOpacity>
    );
  }

  // Default 'header' variant: Sleek circular icon button for navigation headers
  return (
    <TouchableOpacity
      style={[
        styles.headerBtn,
        isDarkMode ? styles.headerBtnDark : styles.headerBtnLight,
        style,
      ]}
      onPress={toggleTheme}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <AppIcon
        name={isDarkMode ? 'Sun' : 'Moon'}
        size={17}
        color={isDarkMode ? '#F59E0B' : Colors.onSurface}
      />
      {showLabel && (
        <Text style={[styles.headerBtnText, { color: isDarkMode ? '#F1F5F9' : Colors.onSurface }]}>
          {isDarkMode ? 'Dark' : 'Light'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
  },
  headerBtnLight: {
    backgroundColor: Colors.surfaceContainerLow,
    borderColor: Colors.outlineHairline,
  },
  headerBtnDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderColor: 'rgba(51, 65, 85, 0.9)',
  },
  headerBtnText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  pillBtnLight: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderColor: Colors.outlineHairline,
  },
  pillBtnDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  pillText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  rowSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    borderWidth: 1,
    ...Shadows.level2,
  },
  floatingBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  floatingBtnDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
});
