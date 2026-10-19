import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import {
  AnimationDuration,
  AnimationEasing,
  isNativeDriverSupported,
  useReducedMotion,
} from './animationConfig';
import { Colors, BorderRadius } from '../constants/theme';

export interface SkeletonShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Subtle and performant skeleton pulse shimmer.
 * Never flashes or glares; uses clean opacity oscillation.
 */
export const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.md,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      pulseAnim.setValue(0.5);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: AnimationDuration.shimmer / 2,
          easing: AnimationEasing.easeInOut,
          useNativeDriver: isNativeDriverSupported,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: AnimationDuration.shimmer / 2,
          easing: AnimationEasing.easeInOut,
          useNativeDriver: isNativeDriverSupported,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [pulseAnim, reducedMotion]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: reducedMotion ? 0.5 : pulseAnim,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
});
