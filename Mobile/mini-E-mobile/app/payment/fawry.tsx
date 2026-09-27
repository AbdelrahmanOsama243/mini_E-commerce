import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../hooks/useThemeContext";
import { KoshkText, KoshkButton } from "../../components/Mobile";
import { Spacing, Borders } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useOrderStore } from "../../store/orderStore";

export default function FawryReferenceScreen() {
  const { ref, orderId } = useLocalSearchParams<{ ref: string, orderId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { loadOrders } = useOrderStore();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Ionicons name="storefront" size={80} color={colors.primary} style={{ alignSelf: 'center' }} />
        
        <KoshkText variant="h2" center style={styles.title}>Fawry Payment</KoshkText>
        <KoshkText variant="body" color={colors.textSecondary} center style={styles.desc}>
          Please use this reference number to pay at any Fawry kiosk.
        </KoshkText>

        <View style={[styles.refBox, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
          <KoshkText variant="overline" color={colors.textSecondary}>REFERENCE NUMBER</KoshkText>
          <KoshkText variant="h1" color={colors.primary} style={{ letterSpacing: 4, marginTop: Spacing.sm }}>
            {ref || 'N/A'}
          </KoshkText>
        </View>

        <KoshkText variant="bodySmall" color={colors.textMuted} center style={styles.note}>
          Note: Valid for 24 hours. Your order will be processed once payment is confirmed.
        </KoshkText>

        <View style={{ height: Spacing.xl }} />

        <KoshkButton 
          title="View Orders" 
          variant="success" 
          onPress={() => router.replace("/(tabs)/orders")} 
          fullWidth 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, justifyContent: 'center', minHeight: '100%' },
  title: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  desc: { marginBottom: Spacing.xl },
  refBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Borders.radius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg
  },
  note: { paddingHorizontal: Spacing.lg }
});
