import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useThemeContext";
import {
  KoshkText,
  KoshkCard,
  KoshkInput,
  ProductCard,
} from "@/components/Mobile";
import { Borders, Spacing, Palette } from "@/constants/theme";
import { ProductService, Product } from "@/Services/Product.Service";

const CATEGORIES = ["All", "Decor", "Bedding", "Lighting", "Dining"];
const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 – $50", min: 25, max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "$100+", min: 100, max: Infinity },
];

export default function CatalogScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    params.category || "All",
  );
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        setLoading(!append);
        const catParam = activeCategory !== "All" ? activeCategory : undefined;
        const data = await ProductService.getProducts({
          search: search || undefined,
          category: catParam,
          page: pageNum,
          limit: 20,
        });
        const items = data.items || [];
        setProducts(append ? (prev) => [...prev, ...items] : items);
        setHasMore(items.length >= 20);
      } catch {
        if (!append) setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [activeCategory, search],
  );

  // Apply local price filter
  useEffect(() => {
    const range = PRICE_RANGES[activePriceRange];
    const result = products.filter(
      (p) => p.price >= range.min && p.price < range.max,
    );
    setFilteredProducts(result);
  }, [products, activePriceRange]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchProducts(1);
    setRefreshing(false);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  }, [loading, hasMore, page, fetchProducts]);

  const renderHeader = () => (
    <View>
      {/* Title */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <KoshkText variant="overline">BROWSE</KoshkText>
        <KoshkText variant="h2">Product Catalog</KoshkText>
        <KoshkText variant="bodySmall" color={colors.textSecondary}>
          {filteredProducts.length} items found
        </KoshkText>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <KoshkInput
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchProducts(1)}
          returnKeyType="search"
        />
      </View>

      {/* Category Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {CATEGORIES.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setActiveCategory(item)}
              style={[
                styles.pill,
                {
                  backgroundColor:
                    activeCategory === item ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <KoshkText
                variant="caption"
                bold
                uppercase
                color={activeCategory === item ? Palette.white : colors.text}
              >
                {item}
              </KoshkText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Price Range Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {PRICE_RANGES.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActivePriceRange(index)}
              style={[
                styles.pill,
                {
                  backgroundColor:
                    activePriceRange === index ? colors.secondary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <KoshkText
                variant="caption"
                bold
                color={activePriceRange === index ? Palette.white : colors.text}
              >
                {item.label}
              </KoshkText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <View style={styles.productGridItem}>
      <ProductCard
        product={item}
        badge={index < 2 ? "new" : undefined}
        onPress={(p) => router.push(`/products/${p._id}`)}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <KoshkText variant="h3" center>
                ◻
              </KoshkText>
              <KoshkText variant="body" color={colors.textSecondary} center>
                No products found
              </KoshkText>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              color={colors.primary}
              size="large"
              style={styles.loader}
            />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: Borders.brutalist,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  filterSection: {
    paddingTop: Spacing.sm,
  },
  pillRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
  },
  listContent: {
    paddingBottom: Spacing["3xl"],
  },
  productGridItem: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.sm,
    width: "100%",
  },
  empty: {
    paddingTop: Spacing["4xl"],
    alignItems: "center",
    gap: Spacing.sm,
  },
  loader: {
    paddingVertical: Spacing.xl,
  },
});
