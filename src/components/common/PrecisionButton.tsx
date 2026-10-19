import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import {
  AnimationDuration,
  AnimationEasing,
  isNativeDriverSupported,
  useReducedMotion,
} from '../../animations/animationConfig';

interface PrecisionButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PrecisionButton: React.FC<PrecisionButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const handlePressIn = () => {
    if (!disabled && !loading && !reducedMotion) {
      Animated.timing(scaleAnim, {
        toValue: 0.972,
        duration: AnimationDuration.micro,
        easing: AnimationEasing.easeOut,
        useNativeDriver: isNativeDriverSupported,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading && !reducedMotion) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: AnimationDuration.micro,
        easing: AnimationEasing.easeOut,
        useNativeDriver: isNativeDriverSupported,
      }).start();
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      default:
        return styles.defaultText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      default:
        return styles.sizeMd;
    }
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: reducedMotion ? 1 : scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          getContainerStyle(),
          getSizeStyle(),
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' ? Colors.primary : Colors.onPrimary}
            size="small"
          />
        ) : (
          <>
            {leftIcon}
            <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
            {rightIcon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondaryContainer: {
    backgroundColor: Colors.secondaryCobalt,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  dangerContainer: {
    backgroundColor: Colors.error,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  sizeLg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 52,
  },
  text: {
    ...Typography.bodyMd,
    fontWeight: '600',
  },
  defaultText: {
    color: Colors.onPrimary,
  },
  outlineText: {
    color: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
