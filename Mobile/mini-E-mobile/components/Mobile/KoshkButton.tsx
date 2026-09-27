import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import { Borders, Spacing, Typography } from '../../constants/theme';
import { KoshkText } from './KoshkText';

// ─── Types ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface KoshkButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function KoshkButton({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  style,
  ...props
}: KoshkButtonProps) {
  const { colors, isDark } = useTheme();

  const variantColors = {
    primary: { bg: colors.primary, text: colors.primaryText, border: colors.border },
    secondary: { bg: colors.secondary, text: colors.secondaryText, border: colors.border },
    accent: { bg: colors.accent, text: colors.accentText, border: colors.border },
    outline: { bg: 'transparent', text: colors.text, border: colors.border },
    ghost: { bg: 'transparent', text: colors.text, border: 'transparent' },
    danger: { bg: colors.danger, text: '#FFFFFF', border: colors.border },
    success: { bg: '#10B981', text: '#FFFFFF', border: '#059669' },
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
    md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg },
    lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  };

  const vc = variantColors[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: vc.bg,
          borderColor: vc.border,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={vc.text} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <KoshkText
            variant="button"
            color={vc.text}
            style={icon ? { marginLeft: Spacing.sm } : undefined}
          >
            {title}
          </KoshkText>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
  },
  fullWidth: {
    width: '100%',
  },
});

export default KoshkButton;
