import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkButton, KoshkCard, KoshkBadge, ProductCard } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { ProductService, Product } from '@/Services/Product.Service';
import { getGridItemWidth, verticalScale, moderateScale } from '@/Utils/responsive';

// ─── Category Data ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Decor', icon: '◆', color: Palette.red },
  { name: 'Bedding', icon: '◈', color: Palette.blue },
  { name: 'Lighting', icon: '◉', color: Palette.yellow },
  { name: 'Dining', icon: '◧', color: Palette.success },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, shadows, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const gridItemWidth = getGridItemWidth(screenWidth, Spacing.lg * 2, Spacing.sm, 2) - 1;

  const loadProducts = useCallback(async () => {
    try {
      const data = await ProductService.getProducts({ limit: 6 });
      setFeaturedProducts(data.items || []);
    } catch {
      // Use empty array on error
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: isDark ? Palette.darkSurface : Palette.offWhite,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Theme Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[
            styles.themeToggle,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <KoshkText variant="body">{isDark ? '☀' : '☾'}</KoshkText>
        </TouchableOpacity>

        {/* Brand */}
        <View style={styles.brandRow}>
          <View
            style={[
              styles.logo,
              {
                borderColor: colors.border,
                backgroundColor: colors.primary,
              },
            ]}
          >
            <KoshkText variant="h3" color={Palette.white} bold>
              K
            </KoshkText>
          </View>
          <KoshkText variant="overline" style={styles.brandName}>
            KOSHK STORE
          </KoshkText>
        </View>

        {/* Hero Headline */}
        <KoshkText variant="h1" style={styles.heroTitle}>
          Elevate{'\n'}Your Space
        </KoshkText>
        <KoshkText
          variant="body"
          color={colors.textSecondary}
          style={styles.heroSubtitle}
        >
          Bold design. Honest materials.{'\n'}Form follows function.
        </KoshkText>

        <KoshkButton
          title="EXPLORE COLLECTION"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(tabs)/catalog')}
          style={styles.heroButton}
        />
      </View>

      {/* ── Categories ────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <KoshkText variant="overline" style={styles.sectionLabel}>
          CATEGORIES
        </KoshkText>
        <KoshkText variant="h3" style={styles.sectionTitle}>
          Shop by Category
        </KoshkText>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/catalog',
                  params: { category: cat.name },
                })
              }
              style={[
                styles.categoryCard,
                {
                  width: gridItemWidth,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
                shadows.brutalistSm,
              ]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: cat.color, borderColor: colors.border },
                ]}
              >
                <KoshkText variant="h3" color={Palette.white}>
                  {cat.icon}
                </KoshkText>
              </View>
              <KoshkText variant="label" style={styles.categoryLabel}>
                {cat.name}
              </KoshkText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Featured Products ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <KoshkText variant="overline" style={styles.sectionLabel}>
              SPOTLIGHT
            </KoshkText>
            <KoshkText variant="h3">Featured Items</KoshkText>
          </View>
          <KoshkButton
            title="See All"
            variant="outline"
            size="sm"
            onPress={() => router.push('/(tabs)/catalog')}
          />
        </View>

        {loading ? (
          <View style={styles.loadingGrid}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.skeletonCard,
                  { width: gridItemWidth, backgroundColor: colors.surface, borderColor: colors.borderLight },
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.productGrid}>
            {featuredProducts.map((product, idx) => (
              <View key={product._id} style={styles.productGridItem}>
                <ProductCard
                  product={product}
                  badge={idx === 0 ? 'new' : idx === 1 ? 'limited' : undefined}
                  onPress={(p) => router.push(`/products/${p._id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* ── Promo Banner ──────────────────────────────────────────────── */}
      <View style={[styles.section, { paddingBottom: Spacing['3xl'] }]}>
        <KoshkCard
          variant="elevated"
          style={[
            styles.promoBanner,
            { backgroundColor: colors.primary },
          ]}
        >
          <KoshkText variant="overline" color={Palette.white}>
            LIMITED TIME
          </KoshkText>
          <KoshkText variant="h2" color={Palette.white} style={styles.promoTitle}>
            20% OFF
          </KoshkText>
          <KoshkText variant="body" color={Palette.white} style={styles.promoSub}>
            On all new arrivals this week
          </KoshkText>
          <KoshkButton
            title="SHOP NOW"
            variant="outline"
            onPress={() => router.push('/(tabs)/catalog')}
            style={{
              borderColor: Palette.white,
              marginTop: Spacing.md,
            }}
          />
        </KoshkCard>
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Hero
  hero: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    borderBottomWidth: Borders.brutalist,
  },
  themeToggle: {
    position: 'absolute',
    top: 56,
    right: Spacing.lg,
    width: moderateScale(40),
    height: moderateScale(40),
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  brandName: {
    marginTop: 2,
  },
  heroTitle: {
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    marginBottom: Spacing.xl,
  },
  heroButton: {
    marginTop: Spacing.sm,
  },
  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    padding: Spacing.md,
    alignItems: 'center',
  },
  categoryIcon: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    textAlign: 'center',
  },
  // Products
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  productGridItem: {
    width: '50%',
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skeletonCard: {
    height: verticalScale(220),
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
  },
  // Promo
  promoBanner: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  promoTitle: {
    marginTop: Spacing.xs,
  },
  promoSub: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
