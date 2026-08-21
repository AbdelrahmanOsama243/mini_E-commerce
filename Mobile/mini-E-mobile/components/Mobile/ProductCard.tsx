import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../hooks/useThemeContext';
import { Borders, Spacing, Palette } from '../../constants/theme';
import { KoshkText } from './KoshkText';
import { KoshkBadge } from './KoshkBadge';
import { Product } from '../../Services/Product.Service';
import { verticalScale } from '../../Utils/responsive';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  badge?: 'new' | 'limited' | 'sale';
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ProductCard = React.memo(function ProductCard({ product, onPress, badge }: ProductCardProps) {
  const { colors, shadows, isDark } = useTheme();

  const hasImage = !!product.image;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(product)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        shadows.brutalistSm,
      ]}
    >
      {/* Image Area */}
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: isDark ? Palette.grey800 : Palette.grey100,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {hasImage ? (
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <KoshkText variant="h3" color={colors.textMuted}>
              ◼
            </KoshkText>
          </View>
        )}

        {/* Badge */}
        {badge && (
          <View style={styles.badgePosition}>
            <KoshkBadge variant={badge} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <KoshkText variant="bodySmall" color={colors.textSecondary} uppercase>
          {product.category}
        </KoshkText>
        <KoshkText variant="body" semiBold numberOfLines={2} style={styles.name}>
          {product.name}
        </KoshkText>
        <View style={styles.priceRow}>
          <KoshkText variant="h4" color={colors.primary}>
            ${product.price.toFixed(2)}
          </KoshkText>
          {product.stock <= 0 && (
            <KoshkBadge variant="outOfStock" />
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <KoshkBadge variant="lowStock" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    overflow: 'hidden',
    flex: 1,
    margin: Spacing.xs,
  },
  imageContainer: {
    height: verticalScale(160),
    borderBottomWidth: Borders.brutalist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePosition: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  info: {
    padding: Spacing.sm,
  },
  name: {
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default ProductCard;
