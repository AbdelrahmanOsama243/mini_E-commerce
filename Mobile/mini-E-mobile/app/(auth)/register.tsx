import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkButton, KoshkInput, KoshkCard } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { AuthService } from '@/Services/Auth.Service';
import { moderateScale } from '@/Utils/responsive';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await AuthService.register({ name, email, password });
      Alert.alert('Account Created', 'Please verify your email, then sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.brandSection}>
          <View
            style={[
              styles.logo,
              { borderColor: colors.border, backgroundColor: colors.primary },
            ]}
          >
            <KoshkText variant="h2" color={Palette.white} bold>
              K
            </KoshkText>
          </View>
          <KoshkText variant="overline">KOSHK STORE</KoshkText>
        </View>

        <KoshkText variant="h2" center>
          Create Account
        </KoshkText>
        <KoshkText variant="body" color={colors.textSecondary} center style={styles.subtitle}>
          Join the Koshk community
        </KoshkText>

        {/* Form */}
        <KoshkCard variant="elevated" style={styles.formCard}>
          <KoshkInput
            label="FULL NAME"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />
          <KoshkInput
            label="EMAIL"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <KoshkInput
            label="PASSWORD"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
          />
          <KoshkInput
            label="CONFIRM PASSWORD"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <KoshkButton
            title="CREATE ACCOUNT"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleRegister}
            style={styles.submitBtn}
          />
        </KoshkCard>

        {/* Login Link */}
        <View style={styles.linkSection}>
          <KoshkText variant="body" color={colors.textSecondary}>
            Already have an account?{' '}
          </KoshkText>
          <Link href="/(auth)/login">
            <KoshkText variant="body" color={colors.primary} bold>
              Sign In
            </KoshkText>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 80,
    paddingBottom: Spacing['3xl'],
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logo: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  formCard: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  linkSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});
