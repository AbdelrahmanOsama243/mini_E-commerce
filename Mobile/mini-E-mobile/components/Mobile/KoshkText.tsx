import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import { Typography } from '../../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'overline'
  | 'button';

interface KoshkTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  bold?: boolean;
  medium?: boolean;
  semiBold?: boolean;
  uppercase?: boolean;
  center?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function KoshkText({
  variant = 'body',
  color,
  bold,
  medium,
  semiBold,
  uppercase,
  center,
  style,
  children,
  ...props
}: KoshkTextProps) {
  const { colors } = useTheme();

  const variantStyle = variantStyles[variant];

  const dynamicStyle: TextStyle = {
    color: color ?? colors.text,
    ...(bold && { fontFamily: Typography.fontFamilyBold }),
    ...(medium && { fontFamily: Typography.fontFamilyMedium }),
    ...(semiBold && { fontFamily: Typography.fontFamilySemiBold }),
    ...(uppercase && { textTransform: 'uppercase', letterSpacing: Typography.letterSpacing.wider }),
    ...(center && { textAlign: 'center' }),
  };

  return (
    <Text style={[variantStyle, dynamicStyle, style]} {...props}>
      {children}
    </Text>
  );
}

// ─── Variant Styles ──────────────────────────────────────────────────────────

const variantStyles = StyleSheet.create({
  h1: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.sizes['4xl'],
    lineHeight: Typography.sizes['4xl'] * Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  h2: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.sizes['3xl'],
    lineHeight: Typography.sizes['3xl'] * Typography.lineHeights.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },
  h3: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sizes['2xl'],
    lineHeight: Typography.sizes['2xl'] * Typography.lineHeights.tight,
  },
  h4: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sizes.xl,
    lineHeight: Typography.sizes.xl * Typography.lineHeights.normal,
  },
  body: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.base,
    lineHeight: Typography.sizes.base * Typography.lineHeights.relaxed,
  },
  bodySmall: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  caption: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.normal,
  },
  label: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sizes.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  overline: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sizes.md,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
    letterSpacing: Typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
});

export default KoshkText;
