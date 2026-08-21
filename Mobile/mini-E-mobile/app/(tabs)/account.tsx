import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkButton, KoshkCard } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { moderateScale } from '@/Utils/responsive';
import { useAuthStore } from '@/store/authStore';
import { AuthService } from '@/Services/Auth.Service';

export default function AccountScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { user, logout, initAuth } = useAuthStore();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      initAuth();
    }
  }, [user, initAuth]);

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await AuthService.updateUserProfile({
        themePreference: isDark ? 'dark' : 'light',
      });
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <KoshkText variant="overline">PROFILE</KoshkText>
        <KoshkText variant="h2">Account</KoshkText>
      </View>

      {/* User Info Card */}
      <KoshkCard variant="elevated" style={styles.profileCard}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary, borderColor: colors.border },
          ]}
        >
          <KoshkText variant="h2" color={Palette.white}>
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </KoshkText>
        </View>
        <KoshkText variant="h4" center style={styles.userName}>
          {user?.name ?? 'Guest'}
        </KoshkText>
        <KoshkText variant="bodySmall" color={colors.textSecondary} center>
          {user?.email ?? 'Not signed in'}
        </KoshkText>
        {user?.role === 'admin' && (
          <View style={styles.adminBadge}>
            <View
              style={[
                styles.adminTag,
                { backgroundColor: colors.accent, borderColor: colors.border },
              ]}
            >
              <KoshkText variant="caption" bold color={Palette.black}>
                ADMIN
              </KoshkText>
            </View>
          </View>
        )}
      </KoshkCard>

      {/* Settings */}
      <View style={styles.section}>
        <KoshkText variant="label" style={styles.sectionLabel}>
          PREFERENCES
        </KoshkText>

        {/* Dark Mode Toggle */}
        <KoshkCard style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <KoshkText variant="body" semiBold>
              Dark Mode
            </KoshkText>
            <KoshkText variant="caption" color={colors.textSecondary}>
              {isDark ? 'Nocturnal Bauhaus' : 'Bauhaus'}
            </KoshkText>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: Palette.grey300, true: colors.primary }}
            thumbColor={Palette.white}
          />
        </KoshkCard>
      </View>

      {/* Admin Dashboard Link */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <KoshkText variant="label" style={styles.sectionLabel}>
            MANAGEMENT
          </KoshkText>
          <KoshkButton
            title="DASHBOARD"
            variant="accent"
            fullWidth
            onPress={() => router.push('/(tabs)/admin-dashboard')}
            style={styles.adminButton}
          />
        </View>
      )}

      {/* Actions */}
      <View style={[styles.section, { paddingBottom: Spacing['3xl'] }]}>
        <KoshkText variant="label" style={styles.sectionLabel}>
          ACTIONS
        </KoshkText>

        {user ? (
          <View style={styles.authButtons}>
            <KoshkButton
              title={saving ? "SAVING..." : "SAVE SETTINGS"}
              variant="outline"
              fullWidth
              onPress={handleSaveSettings}
              style={styles.authBtn}
              disabled={saving}
            />
            <KoshkButton
              title="SIGN OUT"
              variant="danger"
              fullWidth
              onPress={handleLogout}
            />
          </View>
        ) : (
          <View style={styles.authButtons}>
            <KoshkButton
              title="SIGN IN"
              variant="primary"
              fullWidth
              onPress={() => router.push('/(auth)/login')}
              style={styles.authBtn}
            />
            <KoshkButton
              title="CREATE ACCOUNT"
              variant="outline"
              fullWidth
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: Borders.brutalist,
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: Borders.radius.full,
    borderWidth: Borders.brutalist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: { marginBottom: Spacing.xs },
  adminBadge: { marginTop: Spacing.sm },
  adminTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: { flex: 1 },
  adminButton: { marginTop: Spacing.xs },
  authButtons: { gap: Spacing.sm },
  authBtn: { marginBottom: Spacing.xs },
});
