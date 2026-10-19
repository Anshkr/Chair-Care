import { TextStyle } from 'react-native';

/**
 * Precision Ergonomics Typography
 * Font Families: Plus Jakarta Sans (Headings), Inter (Body & UI), JetBrains Mono (Telemetry)
 */

export const Typography: Record<string, TextStyle> = {
  displayHero: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  headlineLg: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  headlineMd: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  headlineSm: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  titleLg: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelMono: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    letterSpacing: 0.2,
    fontFamily: 'System', // Monospace or JetBrainsMono when loaded
  },
};
