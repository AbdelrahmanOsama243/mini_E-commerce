import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useThemeContext";
import { KoshkText, KoshkButton } from "../../components/Mobile";
import { Spacing } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentFailedScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="close-circle" size={100} color={colors.danger} />
      <KoshkText variant="h1" style={styles.title} center>Payment Failed</KoshkText>
      <KoshkText variant="body" color={colors.textSecondary} center style={styles.desc}>
        Unfortunately, your payment could not be processed. Please try again.
      </KoshkText>

      <KoshkButton 
        title="View Orders" 
        variant="primary" 
        onPress={() => router.replace("/(tabs)/orders")} 
        fullWidth 
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  title: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  desc: { marginBottom: Spacing.xl },
  btn: { width: '100%' }
});
