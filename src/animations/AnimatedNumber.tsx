import React, { useEffect, useState, useRef } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { AnimationDuration, useReducedMotion } from './animationConfig';

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (n: number) => string;
  style?: StyleProp<TextStyle>;
}

/**
 * Animated counter that smoothly rolls up numbers on initial screen entrance.
 * Example: 0 -> 1,248 or ₹0 -> ₹84,500 over 750ms.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = AnimationDuration.numberCount,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter,
  style,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const reducedMotion = useReducedMotion();
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startVal = 0;
    const endVal = value;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic calculation: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [value, duration, reducedMotion]);

  const formatNumber = (num: number): string => {
    if (formatter) return formatter(num);
    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  return (
    <Text style={style}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </Text>
  );
};
