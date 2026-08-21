import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import { Borders, Spacing } from '../../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KoshkCardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'flat';
  padding?: keyof typeof Spacing | number;
  noBorder?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function KoshkCard({
  variant = 'default',
  padding = 'base',
  noBorder = false,
  style,
  children,
  ...props
}: KoshkCardProps) {
  const { colors, shadows } = useTheme();

  const paddingValue = typeof padding === 'number' ? padding : Spacing[padding];

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderColor: noBorder ? 'transparent' : colors.border,
    borderWidth: noBorder ? 0 : Borders.brutalist,
    borderRadius: Borders.radius.xs,
    padding: paddingValue,
    ...(variant === 'elevated' ? shadows.brutalistSm : {}),
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}

export default KoshkCard;
