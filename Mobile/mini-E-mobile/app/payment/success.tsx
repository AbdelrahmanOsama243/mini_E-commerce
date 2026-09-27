import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useThemeContext";
import { KoshkText, KoshkButton } from "../../components/Mobile";
import { Spacing } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useOrderStore } from "../../store/orderStore";

export default function PaymentSuccessScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { loadOrders } = useOrderStore();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Ionicons name="checkmark-circle" size={100} color={colors.success} />
      <KoshkText variant="h1" style={styles.title} center>Success!</KoshkText>
      <KoshkText variant="body" color={colors.textSecondary} center style={styles.desc}>
        Your payment was processed successfully.
      </KoshkText>

      <KoshkButton 
        title="View Orders" 
        variant="success" 
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
