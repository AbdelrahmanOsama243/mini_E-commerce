import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
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
import { Borders, Spacing } from "@/constants/theme";
import { AuthService } from "@/Services/Auth.Service";
import { moderateScale } from "@/Utils/responsive";
import { showSuccess, showError, showInfo } from "@/Utils/toast";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Email is required");
      showInfo("Required Field", "Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Invalid email format");
      showInfo("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      await AuthService.forgetPassword(email);
      setEmailSent(true);
      showSuccess("Email Sent", "Password reset instructions have been sent to your email.");
    } catch (err: any) {
      showError("Request Failed", err);
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
            FORGOT PASSWORD
          </KoshkText>
          <KoshkText
            variant="body"
            color={colors.textSecondary}
            style={styles.subtitle}
          >
            {emailSent
              ? "Check your email for the password reset link."
              : "Enter your registered email address to receive a password reset link."}
          </KoshkText>
        </View>

        <KoshkCard style={styles.formCard}>
          {emailSent ? (
            <View style={{ alignItems: "center", paddingVertical: Spacing.lg }}>
              <KoshkButton
                title="BACK TO LOGIN"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.replace("/(auth)/login")}
              />
            </View>
          ) : (
            <>
              <KoshkInput
                label="EMAIL ADDRESS"
                placeholder="user@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(undefined);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
              />

              <KoshkButton
                title="SEND RESET LINK"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onPress={handleSubmit}
                style={styles.submitBtn}
              />
            </>
          )}
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
