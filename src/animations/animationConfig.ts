import { useState, useEffect } from 'react';
import { Easing, Platform, AccessibilityInfo } from 'react-native';

/**
 * Standardized Animation Tokens & Easing Constants
 * Designed for a subtle, high-performance SaaS & marketplace aesthetic.
 */
export const AnimationDuration = {
  micro: 140, // Button presses, quick icon scales, chip toggles
  fast: 220,  // Dropdowns, modal reveals, tab bar highlights
  normal: 300, // Card entrances, screen fades, list stagger steps
  emphasis: 420, // Success checkmark sequences, radar ping cycles
  numberCount: 750, // Metric KPI count-ups
  shimmer: 1200, // Skeleton shimmer loop
  ambient: 2400, // Subtle background breathing / float loops
} as const;

export const AnimationEasing = {
  standard: Easing.bezier(0.2, 0.0, 0, 1),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  gentle: Easing.bezier(0.25, 0.1, 0.25, 1),
  decelerate: Easing.out(Easing.poly(4)),
} as const;

/**
 * Helper to determine if native driver is supported (native platforms vs web)
 */
export const isNativeDriverSupported = Platform.OS !== 'web';

/**
 * Hook to respect user device reduced motion preferences
 */
export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Query initial state
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setReducedMotion(enabled);
      })
      .catch(() => {
        // Fallback default is false
      });

    // Listen for changes
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (isMounted) setReducedMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      listener?.remove?.();
    };
  }, []);

  return reducedMotion;
};
