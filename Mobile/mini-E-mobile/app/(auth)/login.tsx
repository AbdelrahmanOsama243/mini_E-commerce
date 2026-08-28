import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Text,
  Platform,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { useTheme } from "@/hooks/useThemeContext";
import {
  KoshkText,
  KoshkButton,
  KoshkInput,
  KoshkCard,
} from "@/components/Mobile";
import { Borders, Spacing, Palette } from "@/constants/theme";
import { AuthService } from "@/Services/Auth.Service";
import { moderateScale } from "@/Utils/responsive";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const login = useAuthStore((state) => state.login);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Invalid email format";
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Minimum 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Brand */}
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
          <KoshkText variant="overline" style={styles.brandName}>
            KOSHK STORE
          </KoshkText>
        </View>

        {/* Title */}
        <KoshkText variant="h2" center>
          Welcome Back
        </KoshkText>
        <KoshkText
          variant="body"
          color={colors.textSecondary}
          center
          style={styles.subtitle}
        >
          Sign in to your account
        </KoshkText>

        {/* Form */}
        <KoshkCard variant="elevated" style={styles.formCard}>
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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
          />
          <View style={{ alignItems: 'flex-end', marginBottom: Spacing.sm, marginTop: Spacing.xs }}>
            <Link href="/(auth)/forgot-password">
              <KoshkText variant="caption" color={colors.primary} bold>
                Forgot Password?
              </KoshkText>
            </Link>
          </View>
          <KoshkButton
            title="SIGN IN"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleLogin}
            style={styles.submitBtn}
          />
        </KoshkCard>

        {/* Register Link */}
        <View style={styles.linkSection}>
          <KoshkText variant="body" color={colors.textSecondary}>
            <Text>Don&apos;t have an account? </Text>
          </KoshkText>
          <Link href="/(auth)/register">
            <KoshkText variant="body" color={colors.primary} bold>
              Create Account
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
    paddingTop: 100,
    paddingBottom: Spacing["3xl"],
  },
  brandSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logo: {
    width: moderateScale(64),
    height: moderateScale(64),
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  brandName: {
    marginTop: Spacing.xs,
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
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
});
