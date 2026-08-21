import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkButton, KoshkCard, KoshkBadge } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { ProductService, Product } from '@/Services/Product.Service';
import { useCartStore } from '@/store/cartStore';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark, shadows } = useTheme();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      ProductService.getProductById(id)
        .then(setProduct)
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const { addItem } = useCartStore();

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addItem({ productId: product._id, quantity, product });
      Alert.alert('Added to Cart', `${product.name} ×${quantity} added to your cart.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background, padding: Spacing.xl }]}>
        <KoshkText variant="h3" style={{ marginBottom: Spacing.md }}>Product not found</KoshkText>
        <KoshkButton 
          title="GO BACK" 
          variant="outline" 
          onPress={() => router.back()} 
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Image */}
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: isDark ? Palette.darkCard : Palette.grey100,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <KoshkText variant="h1" color={colors.textMuted}>
            ◼
          </KoshkText>
        )}

        {/* Badges */}
        <View style={styles.badgeRow}>
          {product.stock <= 0 && <KoshkBadge variant="outOfStock" />}
          {product.stock > 0 && product.stock <= 5 && <KoshkBadge variant="lowStock" />}
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.infoSection}>
        <KoshkText variant="overline" color={colors.textSecondary}>
          {product.category}
        </KoshkText>
        <KoshkText variant="h2" style={styles.productName}>
          {product.name}
        </KoshkText>
        <KoshkText variant="h2" color={colors.primary} style={styles.price}>
          ${product.price.toFixed(2)}
        </KoshkText>

        {/* Stock */}
        <KoshkCard style={styles.stockCard}>
          <View style={styles.stockRow}>
            <KoshkText variant="label">STOCK STATUS</KoshkText>
            <KoshkText
              variant="body"
              semiBold
              color={
                product.stock <= 0
                  ? colors.danger
                  : product.stock <= 5
                  ? colors.warning
                  : colors.success
              }
            >
              {product.stock <= 0
                ? 'Out of Stock'
                : product.stock <= 5
                ? `Only ${product.stock} left`
                : `${product.stock} in stock`}
            </KoshkText>
          </View>
        </KoshkCard>

        {/* Description */}
        {product.description && (
          <View style={styles.descSection}>
            <KoshkText variant="label">DESCRIPTION</KoshkText>
            <KoshkText variant="body" color={colors.textSecondary} style={styles.desc}>
              {product.description}
            </KoshkText>
          </View>
        )}

        {/* Quantity + Add to Cart */}
        {product.stock > 0 && (
          <KoshkCard variant="elevated" style={styles.addToCartSection}>
            <View style={styles.qtyRow}>
              <KoshkText variant="label">QUANTITY</KoshkText>
              <View style={styles.qtyControls}>
                <KoshkButton
                  title="−"
                  variant="outline"
                  size="sm"
                  disabled={quantity <= 1}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={styles.qtyBtn}
                />
                <View style={[styles.qtyDisplay, { borderColor: colors.border }]}>
                  <KoshkText variant="body" bold>
                    {quantity}
                  </KoshkText>
                </View>
                <KoshkButton
                  title="+"
                  variant="outline"
                  size="sm"
                  disabled={quantity >= product.stock}
                  onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  style={styles.qtyBtn}
                />
              </View>
            </View>
            <KoshkButton
              title="ADD TO CART"
              variant="primary"
              size="lg"
              fullWidth
              loading={addingToCart}
              onPress={handleAddToCart}
              style={styles.addBtn}
            />
          </KoshkCard>
        )}
      </View>

      <View style={{ height: Spacing['3xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  imageContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: Borders.brutalist,
  },
  image: { width: '100%', height: '100%' },
  badgeRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    gap: Spacing.xs,
  },
  infoSection: {
    padding: Spacing.lg,
  },
  productName: { marginTop: Spacing.xs },
  price: { marginTop: Spacing.sm },
  stockCard: { marginTop: Spacing.lg },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descSection: { marginTop: Spacing.xl },
  desc: { marginTop: Spacing.sm },
  addToCartSection: { marginTop: Spacing.xl },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: { width: 40 },
  qtyDisplay: {
    minWidth: 44,
    height: 36,
    borderWidth: Borders.medium,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  addBtn: { marginTop: Spacing.xs },
});
