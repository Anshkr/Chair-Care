import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface PrecisionCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accentColor?: string;
  hasPadding?: boolean;
}

export const PrecisionCard: React.FC<PrecisionCardProps> = ({
  children,
  style,
  onPress,
  accentColor,
  hasPadding = true,
}) => {
  const { theme } = useTheme();

  const cardStyles = [
    styles.card,
    {
      backgroundColor: theme.surfaceContainerLowest,
      borderColor: theme.outlineHairline,
    },
    hasPadding && styles.padding,
    accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={cardStyles}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
    overflow: 'hidden',
  },
  padding: {
    padding: 16,
  },
});

