import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { useTheme } from "@/hooks/useThemeContext";
import {
  KoshkText,
  KoshkButton,
  KoshkInput,
  KoshkCard,
} from "@/components/Mobile";
import { Spacing } from "@/constants/theme";
import { AuthService } from "@/Services/Auth.Service";

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Minimum 6 characters";

    if (!confirmPassword.trim()) newErrors.confirmPassword = "Confirm password is required";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!token) {
      Alert.alert("Error", "Reset token is missing from link");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      await AuthService.resetPassword(token, password);
      Alert.alert("Success", "Password has been reset successfully. Please log in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: any) {
      Alert.alert("Reset Failed", err.message || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandSection}>
          <KoshkText variant="h1" bold uppercase>
            RESET PASSWORD
          </KoshkText>
          <KoshkText
            variant="body"
            color={colors.textSecondary}
            style={styles.subtitle}
          >
            Enter your new password below.
          </KoshkText>
        </View>

        <KoshkCard style={styles.formCard}>
          <KoshkInput
            label="NEW PASSWORD"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
          />

          <KoshkInput
            label="CONFIRM PASSWORD"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            secureTextEntry
            autoCapitalize="none"
            error={errors.confirmPassword}
          />

          <KoshkButton
            title="SAVE NEW PASSWORD"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleReset}
            style={styles.submitBtn}
          />
        </KoshkCard>

        <View style={styles.linkSection}>
          <Link href="/(auth)/login">
            <KoshkText variant="body" color={colors.primary} bold>
              ← Back to Sign In
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
  subtitle: {
    marginTop: Spacing.xs,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
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
