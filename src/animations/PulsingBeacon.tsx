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
import { Colors } from '../constants/theme';

export interface PulsingBeaconProps {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Live operational status indicator with a subtle breathing outer ring.
 */
export const PulsingBeacon: React.FC<PulsingBeaconProps> = ({
  color = Colors.secondaryCobalt,
  size = 8,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: AnimationDuration.ambient,
        easing: AnimationEasing.easeOut,
        useNativeDriver: isNativeDriverSupported,
      })
    );

    loop.start();

    return () => loop.stop();
  }, [pulseAnim, reducedMotion]);

  const ringScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  const ringOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  return (
    <View style={[styles.container, { width: size * 2.5, height: size * 2.5 }, style]}>
      {!reducedMotion && (
        <Animated.View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.coreDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  coreDot: {
    zIndex: 2,
  },
});
