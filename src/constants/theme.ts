/**
 * Precision Ergonomics Design System Tokens
 * Source: DESIGN.md & Stitch Screen References
 */

export const LightColors = {
  // Surfaces & Backgrounds
  surface: '#F7F9FB',
  surfaceDim: '#D8DADC',
  surfaceBright: '#F7F9FB',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2F4F6',
  surfaceContainer: '#ECEEF0',
  surfaceContainerHigh: '#E6E8EA',
  surfaceContainerHighest: '#E0E3E5',
  surfaceVariant: '#E0E3E5',
  
  // Text & On-Surfaces
  onSurface: '#191C1E',
  onSurfaceVariant: '#45464D',
  inverseSurface: '#2D3133',
  inverseOnSurface: '#EFF1F3',
  
  // Brand Primary (Deep Slate Navy / Black)
  primary: '#0F172A',
  primaryBlack: '#000000',
  onPrimary: '#FFFFFF',
  primaryContainer: '#131B2E',
  onPrimaryContainer: '#7C839B',
  inversePrimary: '#BEC6E0',
  
  // Brand Secondary (Precision Cobalt / Electric Blue)
  secondary: '#0051D5',
  secondaryCobalt: '#2563EB',
  secondaryContainer: '#316BF3',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#FEFCFF',
  secondaryFixed: '#DBE1FF',
  secondaryFixedDim: '#B4C5FF',
  onSecondaryFixed: '#00174B',
  onSecondaryFixedVariant: '#003EA8',
  
  // Brand Tertiary (Luminous Emerald - Certified Health & Calibrated)
  tertiary: '#009668',
  tertiaryEmerald: '#10B981',
  tertiaryContainer: '#002113',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#009668',
  tertiaryFixed: '#6FFBBE',
  tertiaryFixedDim: '#4EDEA3',
  
  // Alert & Warning (Mechanical Amber)
  warning: '#F59E0B',
  warningDark: '#B45309',
  warningContainer: '#FEF3C7',
  
  // Error (Crimson)
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  
  // Structural Outlines & Borders
  outline: '#76777D',
  outlineVariant: '#CBD5E1',
  outlineHairline: '#E2E8F0',
  
  // Scrim & Overlay
  scrim: 'rgba(15, 23, 42, 0.45)',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
};

export const DarkColors: typeof LightColors = {
  // Surfaces & Backgrounds - Ultra-clean Dark Theme (deep midnight slate with rich contrast)
  surface: '#0B0F17',
  surfaceDim: '#070A10',
  surfaceBright: '#161F2E',
  surfaceContainerLowest: '#111827', // Card & element backgrounds
  surfaceContainerLow: '#1A2333',
  surfaceContainer: '#1F293D',
  surfaceContainerHigh: '#26334A',
  surfaceContainerHighest: '#2F3F5B',
  surfaceVariant: '#1F293D',
  
  // Text & On-Surfaces
  onSurface: '#F8FAFC',
  onSurfaceVariant: '#CBD5E1',
  inverseSurface: '#F8FAFC',
  inverseOnSurface: '#0F172A',
  
  // Brand Primary (Vibrant contrast)
  primary: '#60A5FA',
  primaryBlack: '#05080E',
  onPrimary: '#0B0F17',
  primaryContainer: '#1E293B',
  onPrimaryContainer: '#CBD5E1',
  inversePrimary: '#1E293B',
  
  // Brand Secondary (Cobalt & Vivid Blues)
  secondary: '#3B82F6',
  secondaryCobalt: '#60A5FA',
  secondaryContainer: '#1D4ED8',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#DBEAFE',
  secondaryFixed: '#1E3A8A',
  secondaryFixedDim: '#172554',
  onSecondaryFixed: '#BFDBFE',
  onSecondaryFixedVariant: '#93C5FD',
  
  // Brand Tertiary (Luminous Emerald)
  tertiary: '#10B981',
  tertiaryEmerald: '#34D399',
  tertiaryContainer: '#064E3B',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#A7F3D0',
  tertiaryFixed: '#065F46',
  tertiaryFixedDim: '#047857',
  
  // Alert & Warning
  warning: '#FBBF24',
  warningDark: '#D97706',
  warningContainer: '#451A03',
  
  // Error
  error: '#F87171',
  onError: '#FFFFFF',
  errorContainer: '#450A0A',
  onErrorContainer: '#FECACA',
  
  // Structural Outlines & Borders
  outline: '#94A3B8',
  outlineVariant: '#334155',
  outlineHairline: '#1E293B',
  
  // Scrim & Overlay
  scrim: 'rgba(0, 0, 0, 0.75)',
  glassBackground: 'rgba(17, 24, 39, 0.85)',
};

export const Colors = { ...LightColors };

function parseRgb(str: string): { r: number; g: number; b: number } | null {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }
  }
  const match = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }
  return null;
}

function isDarkNeutral(r: number, g: number, b: number): boolean {
  const diff = Math.max(r, g, b) - Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return diff <= 45 && lum < 140;
}

function isLightBackground(r: number, g: number, b: number): boolean {
  const diff = Math.max(r, g, b) - Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return diff <= 45 && lum > 175;
}

function isLightBorder(r: number, g: number, b: number): boolean {
  const diff = Math.max(r, g, b) - Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return diff <= 40 && lum > 160;
}

let hasThemeObserver = false;
let syncDebounceTimer: any = null;

function syncDarkModeStyles(isDark: boolean): void {
  if (typeof document === 'undefined') return;

  const styleId = 'chaircare-theme-runtime-styles';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  if (!isDark) {
    styleEl.textContent = '';
    return;
  }

  const generatedRules: string[] = [];
  const processedSelectors = new Set<string>();

  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules || sheet.rules;
      } catch {
        continue;
      }
      if (!rules) continue;

      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j] as CSSStyleRule;
        if (!rule.selectorText || !rule.style) continue;
        const sel = rule.selectorText;
        if (processedSelectors.has(sel)) continue;

        // Check text color
        if (rule.style.color && sel.includes('r-color-')) {
          const rgb = parseRgb(rule.style.color);
          if (rgb && isDarkNeutral(rgb.r, rgb.g, rgb.b)) {
            const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
            const targetColor = lum < 60 ? '#F8FAFC' : '#CBD5E1';
            generatedRules.push(`html.chaircare-dark-mode ${sel} { color: ${targetColor} !important; }`);
            processedSelectors.add(sel);
          }
        }

        // Check background color
        if (rule.style.backgroundColor && sel.includes('r-backgroundColor-')) {
          const rgb = parseRgb(rule.style.backgroundColor);
          if (rgb && isLightBackground(rgb.r, rgb.g, rgb.b)) {
            const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
            const targetBg = lum > 235 ? '#111827' : '#1A2333';
            generatedRules.push(`html.chaircare-dark-mode ${sel} { background-color: ${targetBg} !important; }`);
            processedSelectors.add(sel);
          }
        }

        // Check border color
        if (
          (rule.style.borderColor || rule.style.borderTopColor) &&
          (sel.includes('r-borderColor-') || sel.includes('r-borderTopColor-') || sel.includes('r-borderBottomColor-'))
        ) {
          const rgb = parseRgb(rule.style.borderColor || rule.style.borderTopColor);
          if (rgb && isLightBorder(rgb.r, rgb.g, rgb.b)) {
            generatedRules.push(`html.chaircare-dark-mode ${sel} { border-color: #1E293B !important; }`);
            processedSelectors.add(sel);
          }
        }
      }
    }
  } catch {
    // Guard against potential cross-origin or security exceptions
  }

  const baseRules = `
    html.chaircare-dark-mode, 
    html.chaircare-dark-mode body,
    html.chaircare-dark-mode #root {
      background-color: #0B0F17 !important;
      color: #F8FAFC !important;
    }

    /* Fallback default for any text element rendered by React Native Web */
    html.chaircare-dark-mode div[dir="auto"]:not([class*="r-color-"]),
    html.chaircare-dark-mode span[dir="auto"]:not([class*="r-color-"]) {
      color: #F8FAFC;
    }

    /* Modals & Dropdowns */
    html.chaircare-dark-mode [role="dialog"],
    html.chaircare-dark-mode [role="menu"] {
      background-color: #111827 !important;
      color: #F8FAFC !important;
      border-color: #1E293B !important;
    }

    /* Inputs & Form Elements */
    html.chaircare-dark-mode input,
    html.chaircare-dark-mode textarea,
    html.chaircare-dark-mode select {
      background-color: #1A2333 !important;
      color: #F8FAFC !important;
      border-color: #334155 !important;
    }

    /* Placeholder text */
    html.chaircare-dark-mode input::placeholder,
    html.chaircare-dark-mode textarea::placeholder {
      color: #94A3B8 !important;
    }

    /* Scrollbars in dark mode */
    html.chaircare-dark-mode ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    html.chaircare-dark-mode ::-webkit-scrollbar-track {
      background: #0B0F17;
    }
    html.chaircare-dark-mode ::-webkit-scrollbar-thumb {
      background: #243248;
      border-radius: 4px;
    }
    html.chaircare-dark-mode ::-webkit-scrollbar-thumb:hover {
      background: #3B82F6;
    }
  `;

  styleEl.textContent = baseRules + '\n' + generatedRules.join('\n');

  // Install observer on head once to track newly injected react-native-stylesheet rules
  if (!hasThemeObserver && typeof MutationObserver !== 'undefined' && document.head) {
    hasThemeObserver = true;
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains('chaircare-dark-mode')) {
        if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
        syncDebounceTimer = setTimeout(() => {
          syncDarkModeStyles(true);
        }, 100);
      }
    });
    observer.observe(document.head, { childList: true, subtree: true });
  }
}

/**
 * Apply theme dynamically to Colors object and inject Web CSS when running in browser
 */
export const applyTheme = (mode: 'light' | 'dark'): void => {
  const isDark = mode === 'dark';
  Object.assign(Colors, isDark ? DarkColors : LightColors);

  if (typeof document !== 'undefined' && document.documentElement) {
    if (isDark) {
      document.documentElement.classList.add('chaircare-dark-mode');
      if (document.body) document.body.classList.add('chaircare-dark-mode');
    } else {
      document.documentElement.classList.remove('chaircare-dark-mode');
      if (document.body) document.body.classList.remove('chaircare-dark-mode');
    }

    syncDarkModeStyles(isDark);
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  gutter: 24,
  gutterSm: 16,
  margin: 32,
  marginSm: 16,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
  small: 6,
  medium: 8,
  large: 12,
};

import { Platform } from 'react-native';

export const Shadows = {
  level1: Platform.select({
    web: {
      boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.04)',
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
  }) as any,
  level2: Platform.select({
    web: {
      boxShadow: '0px 4px 6px rgba(15, 23, 42, 0.08)',
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
  }) as any,
  level3: Platform.select({
    web: {
      boxShadow: '0px 12px 20px rgba(15, 23, 42, 0.12)',
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  }) as any,
  small: Platform.select({
    web: {
      boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.04)',
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
  }) as any,
  medium: Platform.select({
    web: {
      boxShadow: '0px 4px 6px rgba(15, 23, 42, 0.08)',
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
  }) as any,
  large: Platform.select({
    web: {
      boxShadow: '0px 12px 20px rgba(15, 23, 42, 0.12)',
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  }) as any,
};

