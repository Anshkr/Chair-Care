import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  AnimationDuration,
  AnimationEasing,
  isNativeDriverSupported,
  useReducedMotion,
} from './animationConfig';

export interface FadeInProps {
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Reusable entrance animation wrapper providing subtle opacity + small transform transition.
 * Default: opacity 0 -> 1, translateY 10 -> 0 over 260ms.
 */
export const FadeIn: React.FC<FadeInProps> = ({
  delay = 0,
  duration = AnimationDuration.normal,
  distance = 10,
  direction = 'up',
  style,
  children,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(distance)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacityAnim.setValue(1);
      translateAnim.setValue(0);
      return;
    }

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          easing: AnimationEasing.easeOut,
          useNativeDriver: isNativeDriverSupported,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration,
          easing: AnimationEasing.easeOut,
          useNativeDriver: isNativeDriverSupported,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, reducedMotion]);

  const getTransform = () => {
    if (reducedMotion || direction === 'none') return [];
    switch (direction) {
      case 'up':
        return [{ translateY: translateAnim }];
      case 'down':
        return [
          {
            translateY: translateAnim.interpolate({
              inputRange: [0, distance],
              outputRange: [0, -distance],
            }),
          },
        ];
      case 'left':
        return [{ translateX: translateAnim }];
      case 'right':
        return [
          {
            translateX: translateAnim.interpolate({
              inputRange: [0, distance],
              outputRange: [0, -distance],
            }),
          },
        ];
      default:
        return [{ translateY: translateAnim }];
    }
  };

  return (
    <Animated.View
      style={[
        {
          opacity: reducedMotion ? 1 : opacityAnim,
          transform: getTransform(),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};
