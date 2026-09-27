import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useThemeContext";
import { KoshkText, KoshkButton, KoshkInput } from "../../components/Mobile";
import { Borders, Spacing } from "../../constants/theme";
import { useCartStore } from "../../store/cartStore";
import { usePaymentStore } from "../../store/paymentStore";
import { useOrderStore } from "../../store/orderStore";
import { PaymentService, PaymentMethodType } from "../../Services/Payment.Service";
import { PaymobSDKService } from "../../Services/PaymobSDK.Service";
import { Ionicons } from "@expo/vector-icons";
import { showSuccess, showError, showInfo } from "@/Utils/toast";

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { cart, clearCart } = useCartStore();
  const { savedMethods, hasSavedMethods, loadSavedMethods } = usePaymentStore();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("card");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State (Email is automatically handled by the user's logged in account)
  const [shippingAddress, setShippingAddress] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    loadSavedMethods();
  }, []);

  const phoneRegex = /^(010|011|012|015)[0-9]{8}$/;

  const validateForm = () => {
    // 1. Name validations (Always Required)
    if (!firstName.trim() || firstName.trim().length < 2) {
      showInfo("Validation Error", "First name is required (minimum 2 characters).");
      return false;
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      showInfo("Validation Error", "Last name is required (minimum 2 characters).");
      return false;
    }

    // 2. Phone validation (Always Required)
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      showInfo("Validation Error", "Please enter a valid 11-digit Egyptian mobile number (e.g. 01012345678).");
      return false;
    }

    // 3. Shipping Address (Always Required)
    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      showInfo("Validation Error", "Please enter a valid shipping address (minimum 5 characters).");
      return false;
    }

    // 4. Method Specific Validations
    if (selectedMethod === "cod") {
      if (!hasSavedMethods) {
        showInfo("Payment Error", "Cash on Delivery requires at least one saved payment method (Card/Wallet).");
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      setSubmitted(true);
      return;
    }

    setLoading(true);

    if (selectedMethod === "cod") {
      try {
        await PaymentService.initiateCOD({
          shippingAddress: shippingAddress.trim(),
          billingData: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
          },
        });
        await clearCart();
        // Update orders list immediately in the background
        useOrderStore.getState().loadOrders();
        showSuccess("Order Placed", "Your Cash on Delivery order has been placed!");
        router.replace("../payment/success");
      } catch (err: any) {
        showError("Order Failed", err);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await PaymentService.initiatePayment({
          paymentMethod: selectedMethod,
          shippingAddress: shippingAddress.trim(),
          billingData: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: undefined as any, // Backend uses authenticated user's email
            phone: phone.trim(),
            city: "Cairo",
            street: shippingAddress.trim(),
          },
          walletPhone: selectedMethod === "wallet" ? phone.trim() : undefined,
        });

        // Note: Cart is cleared only AFTER payment confirmation in the success/fail handlers below

        if (selectedMethod === "card" || selectedMethod === "valu") {
          const secret = res.clientSecret || res.paymentToken;
          if (PaymobSDKService.isAvailable() && secret && res.publicKey) {
            const formattedCards = savedMethods
              .filter((m) => m.type === "card" && m.lastFourDigits)
              .map((m) => ({
                maskedPan: m.lastFourDigits!,
                savedCardToken: m._id,
              }));

            PaymobSDKService.presentPayment({
              clientSecret: secret,
              publicKey: res.publicKey,
              savedBankCards: formattedCards,
              onSuccess: async () => {
                try {
                  await PaymentService.recordTransaction({
                    orderId: res.orderId,
                    paymobOrderId: (res as any).paymobOrderId,
                  });
                } catch (e) {
                  console.warn("Could not record transaction:", e);
                }
                await clearCart();
                useOrderStore.getState().loadOrders();
                showSuccess("Payment Successful", "Your transaction was completed.");
                router.replace("../payment/success");
              },
              onFail: (msg) => {
                // Don't clear cart on failure - let user retry
                showError("Payment Failed", msg || "Your payment was not completed.");
                router.replace("../payment/failed");
              },
              onPending: async () => {
                try {
                  await PaymentService.recordTransaction({
                    orderId: res.orderId,
                    paymobOrderId: (res as any).paymobOrderId,
                  });
                } catch (e) {
                  console.warn("Could not record transaction:", e);
                }
                await clearCart();
                useOrderStore.getState().loadOrders();
                showInfo("Payment Pending", "Your payment is being processed.");
                router.replace("../payment/success");
              },
            });
          } else {
            // Webview fallback for development / simulator
            router.push({ pathname: "../payment/webview", params: { url: res.iframeUrl, orderId: res.orderId } });
          }
        } else if (selectedMethod === "kiosk") {
          useOrderStore.getState().loadOrders();
          router.push({ pathname: "../payment/fawry", params: { ref: res.fawryReferenceNumber, orderId: res.orderId } });
        } else if (selectedMethod === "wallet") {
          router.push({ pathname: "../payment/webview", params: { url: res.redirectUrl, orderId: res.orderId } });
        }
      } catch (err: any) {
        showError("Payment Error", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const methods = [
    { id: "card", label: "Card", icon: "card" },
    { id: "wallet", label: "Wallet", icon: "wallet" },
    { id: "kiosk", label: "Fawry", icon: "storefront" },
    { id: "valu", label: "ValU", icon: "pie-chart" },
    { id: "cod", label: "COD", icon: "cash" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <KoshkText variant="h2" style={styles.title}>Checkout</KoshkText>

        {/* Payment Methods */}
        <KoshkText variant="h4" style={styles.sectionTitle}>Payment Method</KoshkText>
        <View style={styles.methodsGrid}>
          {methods.map((m) => {
            const isSelected = selectedMethod === m.id;
            const disabled = m.id === "cod" && !hasSavedMethods;
            return (
              <TouchableOpacity
                key={m.id}
                disabled={disabled}
                style={[
                  styles.methodCard,
                  { borderColor: isSelected ? colors.primary : colors.border },
                  disabled && { opacity: 0.5 },
                ]}
                onPress={() => setSelectedMethod(m.id as PaymentMethodType)}
              >
                <Ionicons name={m.icon as any} size={24} color={isSelected ? colors.primary : colors.textSecondary} />
                <KoshkText variant="bodySmall" bold color={isSelected ? colors.primary : colors.text}>
                  {m.label}
                </KoshkText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Customer & Delivery Details (Always Shown and Required) */}
        <KoshkText variant="h4" style={styles.sectionTitle}>Customer Details *</KoshkText>
        <View style={{ flexDirection: "row", gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <KoshkInput placeholder="First Name *" value={firstName} onChangeText={setFirstName} />
            {submitted && (!firstName.trim() || firstName.trim().length < 2) && (
              <KoshkText variant="caption" style={styles.errorText}>Min 2 characters</KoshkText>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <KoshkInput placeholder="Last Name *" value={lastName} onChangeText={setLastName} />
            {submitted && (!lastName.trim() || lastName.trim().length < 2) && (
              <KoshkText variant="caption" style={styles.errorText}>Min 2 characters</KoshkText>
            )}
          </View>
        </View>

        <View style={{ marginTop: Spacing.xs }}>
          <KoshkInput
            placeholder="Phone Number (e.g. 01012345678) *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          {submitted && (!phone.trim() || !phoneRegex.test(phone.trim())) && (
            <KoshkText variant="caption" style={styles.errorText}>
              Valid 11-digit Egyptian mobile number required.
            </KoshkText>
          )}
        </View>

        {/* Shipping Address */}
        <KoshkText variant="h4" style={styles.sectionTitle}>Shipping Address *</KoshkText>
        <KoshkInput
          placeholder="e.g. 123 Designer Street, Nasr City, Cairo"
          value={shippingAddress}
          onChangeText={setShippingAddress}
        />
        {submitted && (!shippingAddress.trim() || shippingAddress.trim().length < 5) && (
          <KoshkText variant="caption" style={styles.errorText}>
            Shipping address is required (minimum 5 characters).
          </KoshkText>
        )}

        <View style={{ height: Spacing.xl }} />

        <KoshkButton
          title={loading ? "PROCESSING PAYMENT..." : selectedMethod === "cod" ? "PLACE ORDER (COD)" : "PAY & PLACE ORDER"}
          variant="success"
          size="lg"
          icon={<Ionicons name={selectedMethod === "cod" ? "bag-check-outline" : "lock-closed-outline"} size={18} color="#FFFFFF" />}
          onPress={handleCheckout}
          disabled={loading}
          fullWidth
          style={styles.orderBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: 100 },
  orderBtn: {
    height: 54,
    borderRadius: Borders.radius.sm,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { marginBottom: Spacing.xl },
  sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  methodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  methodCard: {
    flex: 1,
    minWidth: "30%",
    borderWidth: Borders.brutalist,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: Borders.radius.sm,
  },
  errorText: {
    color: "#e11d48",
    fontWeight: "bold",
    marginTop: 4,
    marginLeft: 2,
  },
});
