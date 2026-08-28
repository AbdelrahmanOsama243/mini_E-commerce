import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useThemeContext";
import {
  KoshkText,
  KoshkButton,
  KoshkCard,
  KoshkInput,
} from "@/components/Mobile";
import { Borders, Spacing, Palette } from "@/constants/theme";
import { CartService, Cart, CartItem } from "@/Services/Cart.Service";
import { moderateScale } from "@/Utils/responsive";
import { Product } from "@/Services/Product.Service";
import { OrderService } from "@/Services/Order.Service";

const SHIPPING_COST = 9.99;
const TAX_RATE = 0.08;

export default function CartScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {
    cart,
    loading,
    updating,
    loadCart,
    updateQuantity,
    removeItem,
    clearCart: storeClearCart,
  } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [address, setAddress] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const getProductFromItem = (item: CartItem): Product | null => {
    if (typeof item.productId === "object") return item.productId as Product;
    return null;
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    try {
      await updateQuantity(itemId, newQty);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to remove item");
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }
    // Navigate to the new payment checkout screen
    router.push("../../../payment/checkout");
  };

  const clearCart = async () => {
    Alert.alert("Clear Cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await storeClearCart();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to clear cart");
          }
        },
      },
    ]);
  };

  // Calculate totals
  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const product = getProductFromItem(item);
    const price = product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + (items.length > 0 ? SHIPPING_COST : 0) + tax;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <KoshkText variant="overline">YOUR</KoshkText>
          <KoshkText variant="h2">Shopping Cart</KoshkText>
          <KoshkText variant="bodySmall" color={colors.textSecondary}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </KoshkText>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <KoshkText variant="h1">◻</KoshkText>
            </View>
            <KoshkText variant="h4" center>
              Your cart is empty
            </KoshkText>
            <KoshkText variant="body" color={colors.textSecondary} center>
              Add items from the catalog to get started
            </KoshkText>
            <KoshkButton
              title="BROWSE CATALOG"
              variant="primary"
              onPress={() => router.push("/(tabs)/catalog")}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <>
            {/* Clear Cart button */}
            <View style={styles.clearRow}>
              <KoshkButton
                title="CLEAR ALL"
                variant="ghost"
                size="sm"
                onPress={clearCart}
              />
            </View>

            {/* Cart Items */}
            {items.map((item) => {
              const product = getProductFromItem(item);
              const isUpdating = updating === item._id;

              return (
                <KoshkCard
                  key={item._id}
                  variant="default"
                  style={[styles.cartItem, { opacity: isUpdating ? 0.6 : 1 }]}
                >
                  {/* Product Image */}
                  <View
                    style={[
                      styles.itemImage,
                      {
                        backgroundColor: isDark
                          ? Palette.grey800
                          : Palette.grey100,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {product?.image ? (
                      <Image
                        source={{ uri: product.image }}
                        style={styles.itemImageInner}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <KoshkText variant="h4" color={colors.textMuted}>
                        ◼
                      </KoshkText>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.itemInfo}>
                    <KoshkText variant="body" semiBold numberOfLines={2}>
                      {product?.name ?? "Product"}
                    </KoshkText>
                    <KoshkText variant="bodySmall" color={colors.textSecondary}>
                      {product?.category ?? ""}
                    </KoshkText>
                    <KoshkText
                      variant="h4"
                      color={colors.primary}
                      style={styles.itemPrice}
                    >
                      ${((product?.price ?? 0) * item.quantity).toFixed(2)}
                    </KoshkText>

                    {/* Quantity Controls */}
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        onPress={() => {
                          if (item.quantity <= 1) {
                            handleRemoveItem(item._id);
                          } else {
                            handleUpdateQuantity(item._id, item.quantity - 1);
                          }
                        }}
                        disabled={isUpdating}
                        style={[
                          styles.qtyBtn,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <KoshkText variant="body" bold color={colors.danger}>
                          −
                        </KoshkText>
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.qtyDisplay,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.card,
                          },
                        ]}
                      >
                        <KoshkText variant="body" bold>
                          {item.quantity}
                        </KoshkText>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          handleUpdateQuantity(item._id, item.quantity + 1)
                        }
                        disabled={isUpdating}
                        style={[
                          styles.qtyBtn,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <KoshkText variant="body" bold color={colors.success}>
                          +
                        </KoshkText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </KoshkCard>
              );
            })}
          </>
        )}

        {/* ── Order Summary ──────────────────────────── */}
        {items.length > 0 && (
          <KoshkCard variant="elevated" style={styles.summary}>
            <KoshkText variant="overline" style={styles.summaryLabel}>
              ORDER SUMMARY
            </KoshkText>

            <View
              style={[
                styles.summaryRow,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <KoshkText variant="body" color={colors.textSecondary}>
                Subtotal
              </KoshkText>
              <KoshkText variant="body" semiBold>
                ${subtotal.toFixed(2)}
              </KoshkText>
            </View>
            <View
              style={[
                styles.summaryRow,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <KoshkText variant="body" color={colors.textSecondary}>
                Shipping
              </KoshkText>
              <KoshkText variant="body" semiBold>
                ${SHIPPING_COST.toFixed(2)}
              </KoshkText>
            </View>
            <View
              style={[
                styles.summaryRow,
                { borderBottomColor: colors.borderLight },
              ]}
            >
              <KoshkText variant="body" color={colors.textSecondary}>
                Tax (8%)
              </KoshkText>
              <KoshkText variant="body" semiBold>
                ${tax.toFixed(2)}
              </KoshkText>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <KoshkText variant="h4">Total</KoshkText>
              <KoshkText variant="h3" color={colors.primary}>
                ${total.toFixed(2)}
              </KoshkText>
            </View>

            {isCheckingOut && (
              <View style={{ marginTop: Spacing.md, marginBottom: Spacing.md }}>
                <KoshkInput
                  label="SHIPPING ADDRESS"
                  placeholder="Enter your full address"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            )}

            <KoshkButton
              title={
                checkoutLoading
                  ? "PROCESSING..."
                  : isCheckingOut
                    ? "CONFIRM ORDER"
                    : "PROCEED TO CHECKOUT"
              }
              variant="primary"
              size="lg"
              fullWidth
              style={styles.checkoutBtn}
              onPress={handleCheckout}
              disabled={checkoutLoading}
            />
            {isCheckingOut && (
              <KoshkButton
                title="CANCEL"
                variant="ghost"
                fullWidth
                onPress={() => setIsCheckingOut(false)}
                disabled={checkoutLoading}
              />
            )}
          </KoshkCard>
        )}

        <View style={{ height: Spacing["3xl"] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: Borders.brutalist,
  },
  clearRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    alignItems: "flex-end",
  },
  emptyState: {
    paddingTop: Spacing["5xl"],
    paddingHorizontal: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRightWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyButton: { marginTop: Spacing.lg },
  cartItem: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    flexDirection: "row",
  },
  itemImage: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  itemImageInner: { width: "100%", height: "100%" },
  itemInfo: { flex: 1 },
  itemPrice: { marginTop: Spacing.xs },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  qtyBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyDisplay: {
    minWidth: moderateScale(32),
    height: moderateScale(32),
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  removeBtn: {
    marginLeft: "auto",
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  summary: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  summaryLabel: { marginBottom: Spacing.md },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  totalRow: { borderBottomWidth: 0, paddingTop: Spacing.md },
  checkoutBtn: { marginTop: Spacing.lg },
});
