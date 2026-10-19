import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  AnimationDuration,
  AnimationEasing,
  isNativeDriverSupported,
  useReducedMotion,
} from './animationConfig';

export interface PressableScaleProps extends TouchableOpacityProps {
  activeScale?: number;
  pressDuration?: number;
  releaseDuration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * High-performance interactive wrapper adding subtle tactile scale feedback on press.
 * Scale: 1 -> 0.97 -> 1 (140ms), completely native-driven with zero layout disruption.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  activeScale = 0.972,
  pressDuration = AnimationDuration.micro,
  releaseDuration = AnimationDuration.micro,
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  activeOpacity = 0.88,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const handlePressIn = (e: any) => {
    if (!disabled && !reducedMotion) {
      Animated.timing(scaleAnim, {
        toValue: activeScale,
        duration: pressDuration,
        easing: AnimationEasing.easeOut,
        useNativeDriver: isNativeDriverSupported,
      }).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (!disabled && !reducedMotion) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: releaseDuration,
        easing: AnimationEasing.easeOut,
        useNativeDriver: isNativeDriverSupported,
      }).start();
    }
    onPressOut?.(e);
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: reducedMotion ? 1 : scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        {...rest}
        disabled={disabled}
        activeOpacity={activeOpacity}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: '100%' }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};
