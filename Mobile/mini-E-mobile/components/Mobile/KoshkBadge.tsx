import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import { Borders, Spacing, Palette } from '../../constants/theme';
import { KoshkText } from './KoshkText';

// ─── Types ───────────────────────────────────────────────────────────────────

type BadgeVariant = 'new' | 'limited' | 'sale' | 'outOfStock' | 'lowStock' | 'optimal' | 'custom';

interface KoshkBadgeProps {
  variant?: BadgeVariant;
  label?: string;
  color?: string;
  textColor?: string;
}

// ─── Badge Colors ────────────────────────────────────────────────────────────

const badgePresets: Record<
  Exclude<BadgeVariant, 'custom'>,
  { bg: string; text: string; label: string }
> = {
  new: { bg: Palette.red, text: Palette.white, label: 'NEW ARRIVAL' },
  limited: { bg: Palette.yellow, text: Palette.black, label: 'LIMITED' },
  sale: { bg: Palette.blue, text: Palette.white, label: 'SALE' },
  outOfStock: { bg: Palette.grey700, text: Palette.white, label: 'OUT OF STOCK' },
  lowStock: { bg: Palette.danger, text: Palette.white, label: 'LOW STOCK' },
  optimal: { bg: Palette.success, text: Palette.white, label: 'OPTIMAL' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function KoshkBadge({
  variant = 'new',
  label,
  color,
  textColor,
}: KoshkBadgeProps) {
  const preset = variant !== 'custom' ? badgePresets[variant] : null;

  const bg = color ?? preset?.bg ?? Palette.red;
  const fg = textColor ?? preset?.text ?? Palette.white;
  const text = label ?? preset?.label ?? 'BADGE';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: Palette.black }]}>
      <KoshkText variant="caption" color={fg} bold uppercase>
        {text}
      </KoshkText>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    alignSelf: 'flex-start',
  },
});

export default KoshkBadge;
