import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';
import { Borders, Spacing, Typography } from '../../constants/theme';
import { KoshkText } from './KoshkText';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KoshkInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function KoshkInput({
  label,
  error,
  icon,
  containerStyle,
  style,
  ...props
}: KoshkInputProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <KoshkText variant="label" style={styles.label}>
          {label}
        </KoshkText>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.inputBackground,
          },
        ]}
      >
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: Typography.fontFamily,
            },
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          {...props}
        />
      </View>
      {error && (
        <KoshkText variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </KoshkText>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.sizes.base,
  },
  error: {
    marginTop: Spacing.xs,
  },
});

export default KoshkInput;
