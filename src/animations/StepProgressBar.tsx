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
  useReducedMotion,
} from './animationConfig';
import { Colors, BorderRadius } from '../constants/theme';

export interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  height?: number;
  activeColor?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Animated step progress indicator that smoothly glides between booking phases.
 */
export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps,
  height = 4,
  activeColor = Colors.secondaryCobalt,
  trackColor = Colors.surfaceContainerHighest,
  style,
}) => {
  const progressPercent = Math.min(Math.max(currentStep / totalSteps, 0), 1) * 100;
  const widthAnim = useRef(new Animated.Value(progressPercent)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      widthAnim.setValue(progressPercent);
      return;
    }

    Animated.timing(widthAnim, {
      toValue: progressPercent,
      duration: AnimationDuration.normal,
      easing: AnimationEasing.easeOut,
      useNativeDriver: false, // width animation requires layout driver
    }).start();
  }, [progressPercent, reducedMotion]);

  const widthInterpolation = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: activeColor,
            width: widthInterpolation,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});
