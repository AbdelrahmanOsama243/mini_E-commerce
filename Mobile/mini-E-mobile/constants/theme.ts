/**
 * Koshk Store – Neo-Brutalist Theme System
 *
 * Two modes:
 *   • Bauhaus (Light)       – stark white, heavy black borders, primary accents
 *   • Nocturnal Bauhaus (Dark) – deep charcoal, white borders, primary color pops
 *
 * Typography: Space Grotesk (geometric, modern sans-serif)
 */

import { Platform } from 'react-native';

// ─── Primary Color Palette (Bauhaus primaries) ──────────────────────────────

export const Palette = {
  red: '#E63946',
  blue: '#457B9D',
  yellow: '#F4A261',
  black: '#1A1A1A',
  white: '#FFFFFF',
  offWhite: '#F5F5F5',
  charcoal: '#121212',
  darkSurface: '#1E1E1E',
  darkCard: '#2A2A2A',
  grey100: '#F0F0F0',
  grey200: '#E0E0E0',
  grey300: '#C0C0C0',
  grey400: '#999999',
  grey500: '#666666',
  grey600: '#444444',
  grey700: '#333333',
  grey800: '#222222',
  success: '#2A9D8F',
  accentGreen: '#10B981',
  warning: '#E9C46A',
  danger: '#E76F51',
} as const;

// ─── Theme Colors ────────────────────────────────────────────────────────────

export const Colors = {
  light: {
    // Surfaces
    background: Palette.white,
    surface: Palette.offWhite,
    card: Palette.white,
    // Text
    text: Palette.black,
    textSecondary: Palette.grey500,
    textMuted: Palette.grey400,
    // Borders – heavy for neo-brutalist
    border: Palette.black,
    borderLight: Palette.grey200,
    // Primary actions
    primary: Palette.red,
    primaryText: Palette.white,
    secondary: Palette.blue,
    secondaryText: Palette.white,
    accent: Palette.yellow,
    accentText: Palette.black,
    // Navigation
    tabBar: Palette.white,
    tabBarBorder: Palette.black,
    tabIconDefault: Palette.grey400,
    tabIconSelected: Palette.red,
    // Status
    success: Palette.success,
    warning: Palette.warning,
    danger: Palette.danger,
    // Misc
    tint: Palette.red,
    icon: Palette.grey500,
    shadow: 'rgba(0, 0, 0, 0.25)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    inputBackground: Palette.offWhite,
  },
  dark: {
    // Surfaces
    background: Palette.charcoal,
    surface: Palette.darkSurface,
    card: Palette.darkCard,
    // Text
    text: Palette.white,
    textSecondary: Palette.grey300,
    textMuted: Palette.grey400,
    // Borders – white for dark mode brutalist
    border: Palette.white,
    borderLight: Palette.grey600,
    // Primary actions
    primary: Palette.red,
    primaryText: Palette.white,
    secondary: Palette.blue,
    secondaryText: Palette.white,
    accent: Palette.yellow,
    accentText: Palette.black,
    // Navigation
    tabBar: Palette.darkSurface,
    tabBarBorder: Palette.white,
    tabIconDefault: Palette.grey400,
    tabIconSelected: Palette.red,
    // Status
    success: Palette.success,
    warning: Palette.warning,
    danger: Palette.danger,
    // Misc
    tint: Palette.white,
    icon: Palette.grey300,
    shadow: 'rgba(0, 0, 0, 0.6)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    inputBackground: Palette.darkCard,
  },
} as const;

export type ThemeColors = typeof Colors.light | typeof Colors.dark;

// ─── Typography ──────────────────────────────────────────────────────────────

export const Typography = {
  fontFamily: Platform.select({
    ios: 'SpaceGrotesk-Regular',
    android: 'SpaceGrotesk-Regular',
    default: 'SpaceGrotesk-Regular',
  }) as string,
  fontFamilyBold: Platform.select({
    ios: 'SpaceGrotesk-Bold',
    android: 'SpaceGrotesk-Bold',
    default: 'SpaceGrotesk-Bold',
  }) as string,
  fontFamilyMedium: Platform.select({
    ios: 'SpaceGrotesk-Medium',
    android: 'SpaceGrotesk-Medium',
    default: 'SpaceGrotesk-Medium',
  }) as string,
  fontFamilySemiBold: Platform.select({
    ios: 'SpaceGrotesk-SemiBold',
    android: 'SpaceGrotesk-SemiBold',
    default: 'SpaceGrotesk-SemiBold',
  }) as string,
  fontFamilyLight: Platform.select({
    ios: 'SpaceGrotesk-Light',
    android: 'SpaceGrotesk-Light',
    default: 'SpaceGrotesk-Light',
  }) as string,

  sizes: {
    xs: 9,
    sm: 11,
    base: 13,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 26,
    '4xl': 30,
  },
  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    widest: 2.0,
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Borders (Neo-Brutalist heavy borders) ───────────────────────────────────

export const Borders = {
  thin: 1,
  medium: 2,
  heavy: 3,
  brutalist: 4,
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
} as const;

// ─── Shadows (Brutalist offset shadows) ──────────────────────────────────────

export const Shadows = {
  light: {
    brutalist: {
      shadowColor: Palette.black,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 6,
    },
    brutalistSm: {
      shadowColor: Palette.black,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    },
    soft: {
      shadowColor: Palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  },
  dark: {
    brutalist: {
      shadowColor: Palette.white,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 0,
      elevation: 6,
    },
    brutalistSm: {
      shadowColor: Palette.white,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 0,
      elevation: 3,
    },
    soft: {
      shadowColor: Palette.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 3,
    },
  },
} as const;

// ─── Legacy Exports (for backward compat) ────────────────────────────────────

export const Fonts = Platform.select({
  ios: { sans: 'SpaceGrotesk-Regular', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'SpaceGrotesk-Regular', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: "'Space Grotesk', system-ui, -apple-system, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
