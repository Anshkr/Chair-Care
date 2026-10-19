import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  AnimationDuration,
  AnimationEasing,
  isNativeDriverSupported,
  useReducedMotion,
} from './animationConfig';
import { AppIcon } from '../components/common/AppIcon';
import { Colors, Shadows } from '../constants/theme';

export interface SuccessCheckmarkProps {
  size?: number;
  iconColor?: string;
  badgeColor?: string;
  style?: StyleProp<ViewStyle>;
  onComplete?: () => void;
}

/**
 * Premium success state sequence:
 * 1. Background ring scales out gently
 * 2. Checkmark scales in with crisp easeOut curve
 */
export const SuccessCheckmark: React.FC<SuccessCheckmarkProps> = ({
  size = 68,
  iconColor = '#FFFFFF',
  badgeColor = '#009668',
  style,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      ringAnim.setValue(1.3);
      ringOpacity.setValue(0.2);
      onComplete?.();
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: AnimationDuration.fast,
          easing: AnimationEasing.easeOut,
          useNativeDriver: isNativeDriverSupported,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: AnimationDuration.fast,
          easing: AnimationEasing.easeOut,
          useNativeDriver: isNativeDriverSupported,
        }),
      ]),
      Animated.parallel([
        Animated.timing(ringAnim, {
          toValue: 1.35,
          duration: AnimationDuration.normal,
          easing: AnimationEasing.easeOut,
          useNativeDriver: isNativeDriverSupported,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0.18,
          duration: AnimationDuration.normal / 2,
          easing: AnimationEasing.easeOut,
          useNativeDriver: isNativeDriverSupported,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, [scaleAnim, opacityAnim, ringAnim, ringOpacity, reducedMotion]);

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.5 }, style]}>
      {/* Outer Halo */}
      <Animated.View
        style={[
          styles.haloRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: badgeColor,
            opacity: ringOpacity,
            transform: [{ scale: ringAnim }],
          },
        ]}
      />

      {/* Main Core Badge */}
      <Animated.View
        style={[
          styles.coreBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: badgeColor,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
          Shadows.level2,
        ]}
      >
        <AppIcon
          name="Check"
          size={Math.round(size * 0.52)}
          color={iconColor}
          strokeWidth={2.4}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloRing: {
    position: 'absolute',
  },
  coreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
