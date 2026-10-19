import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  style?: StyleProp<ViewStyle>;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  dot = false,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          text: '#047857',
          border: 'rgba(16, 185, 129, 0.2)',
          dot: Colors.tertiaryEmerald,
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          text: '#B45309',
          border: 'rgba(245, 158, 11, 0.2)',
          dot: Colors.warning,
        };
      case 'error':
        return {
          bg: 'rgba(186, 26, 26, 0.1)',
          text: '#BA1A1A',
          border: 'rgba(186, 26, 26, 0.2)',
          dot: Colors.error,
        };
      case 'info':
        return {
          bg: 'rgba(37, 99, 235, 0.1)',
          text: '#2563EB',
          border: 'rgba(37, 99, 235, 0.2)',
          dot: Colors.secondaryCobalt,
        };
      default:
        return {
          bg: Colors.surfaceContainerLow,
          text: Colors.onSurfaceVariant,
          border: Colors.outlineVariant,
          dot: Colors.outline,
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: colors.dot }]} />}
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...Typography.labelMd,
    textTransform: 'uppercase',
  },
});
