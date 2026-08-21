import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkCard, KoshkBadge, KoshkInput } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { ProductService, Product } from '@/Services/Product.Service';

type SortField = 'name' | 'stock' | 'price' | 'category';
type SortDirection = 'asc' | 'desc';

function getStockStatus(stock: number): { variant: 'optimal' | 'lowStock' | 'outOfStock'; label: string } {
  if (stock <= 0) return { variant: 'outOfStock', label: 'OUT OF STOCK' };
  if (stock <= 5) return { variant: 'lowStock', label: 'LOW STOCK' };
  return { variant: 'optimal', label: 'OPTIMAL' };
}

export default function InventoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const loadProducts = useCallback(async () => {
    try {
      const data = await ProductService.getProducts({ limit: 200 });
      setProducts(data.items || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter & Sort
  useEffect(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p._id.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'stock':
          cmp = a.stock - b.stock;
          break;
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    setFiltered(result);
  }, [products, search, sortField, sortDir]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, [loadProducts]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const renderSortHeader = (label: string, field: SortField, style?: any) => (
    <TouchableOpacity
      onPress={() => toggleSort(field)}
      style={[styles.sortCol, style]}
    >
      <KoshkText variant="caption" bold color={colors.textSecondary}>
        {label} {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : ''}
      </KoshkText>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Product }) => {
    const status = getStockStatus(item.stock);
    return (
      <View style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.colMain}>
          <KoshkText variant="bodySmall" semiBold numberOfLines={1}>
            {item.name}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            SKU: {item._id.slice(-6).toUpperCase()}
          </KoshkText>
        </View>
        <KoshkText variant="caption" style={styles.colCat} color={colors.textSecondary}>
          {item.category}
        </KoshkText>
        <KoshkText
          variant="body"
          bold
          style={styles.colStock}
          color={item.stock <= 0 ? colors.danger : item.stock <= 5 ? colors.warning : colors.text}
        >
          {item.stock}
        </KoshkText>
        <KoshkText variant="bodySmall" style={styles.colPrice} color={colors.textSecondary}>
          ${item.price.toFixed(0)}
        </KoshkText>
        <View style={styles.colStatus}>
          <KoshkBadge variant={status.variant} label={status.label} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: isDark ? Palette.darkSurface : Palette.offWhite }]}>
        <View style={styles.headerTop}>
          <View>
            <KoshkText variant="overline" color={colors.textSecondary}>
              INVENTORY
            </KoshkText>
            <KoshkText variant="h3">Stock Management</KoshkText>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.push('/admin/add-product')}
              style={[styles.backBtn, { borderColor: colors.primary, backgroundColor: colors.primary }]}
            >
              <KoshkText variant="body" color={Palette.white}>+</KoshkText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <KoshkText variant="body">←</KoshkText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <KoshkInput
          placeholder="Search by name, category, or SKU..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginTop: Spacing.sm, marginBottom: 0 }}
        />

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <KoshkText variant="caption" color={colors.textSecondary}>
            {filtered.length} items
          </KoshkText>
          <KoshkText variant="caption" color={colors.textSecondary}>
            •
          </KoshkText>
          <KoshkText variant="caption" color={colors.danger}>
            {products.filter((p) => p.stock <= 5).length} low stock
          </KoshkText>
          <KoshkText variant="caption" color={colors.textSecondary}>
            •
          </KoshkText>
          <KoshkText variant="caption" color={colors.warning}>
            {products.filter((p) => p.stock <= 0).length} out
          </KoshkText>
        </View>
      </View>

      {/* Table Header */}
      <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        {renderSortHeader('PRODUCT', 'name', styles.colMain)}
        {renderSortHeader('CAT', 'category', styles.colCat)}
        {renderSortHeader('QTY', 'stock', styles.colStock)}
        {renderSortHeader('PRICE', 'price', styles.colPrice)}
        <View style={styles.colStatus}>
          <KoshkText variant="caption" bold color={colors.textSecondary}>
            STATUS
          </KoshkText>
        </View>
      </View>

      {/* Table Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={filtered}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <KoshkText variant="body" color={colors.textSecondary} center>
                No products found
              </KoshkText>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: Borders.brutalist,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  // Table
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: Borders.medium,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  sortCol: {
    paddingVertical: 2,
  },
  colMain: { flex: 2 },
  colCat: { width: 44 },
  colStock: { width: 36, textAlign: 'center' },
  colPrice: { width: 44, textAlign: 'right' },
  colStatus: { flex: 1, alignItems: 'flex-end' },
  empty: {
    paddingTop: Spacing['4xl'],
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: Spacing['4xl'],
  }
});
