import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkCard, KoshkBadge, KoshkButton } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { ProductService, Product } from '@/Services/Product.Service';
import { OrderService, Order } from '@/Services/Order.Service';
import { TokenStorage } from '@/Services/TokenStorage';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  totalProducts: number;
  totalSKUs: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  recentOrders: Order[];
  lowStockItems: Product[];
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const { colors, isDark, shadows } = useTheme();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      if (!accessToken) return;

      const [productsData, ordersData] = await Promise.all([
        ProductService.getProducts({ limit: 100 }),
        OrderService.getOrders(true),
      ]);

      const products = productsData.items || [];
      const orders = ordersData || [];

      const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
      const outOfStock = products.filter((p) => p.stock <= 0);
      const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

      setMetrics({
        totalProducts: products.length,
        totalSKUs: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalInventoryValue: totalValue,
        recentOrders: orders.slice(0, 5),
        lowStockItems: lowStock.slice(0, 6),
      });
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? Palette.darkSurface : Palette.offWhite, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <KoshkText variant="overline" color={colors.textSecondary}>
              MANAGEMENT TERMINAL
            </KoshkText>
            <KoshkText variant="h2">Admin Dashboard</KoshkText>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <KoshkText variant="body">✕</KoshkText>
          </TouchableOpacity>
        </View>

        {/* System Status Bar */}
        <View style={[styles.statusBar, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: Palette.success }]} />
            <KoshkText variant="caption" color={colors.textSecondary}>
              DATA SYNC
            </KoshkText>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: Palette.success }]} />
            <KoshkText variant="caption" color={colors.textSecondary}>
              CACHE: OK
            </KoshkText>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: Palette.yellow }]} />
            <KoshkText variant="caption" color={colors.textSecondary}>
              THROUGHPUT: ◉
            </KoshkText>
          </View>
        </View>
      </View>

      {/* ── Metric Cards ─────────────────────────────────────────────── */}
      <View style={styles.metricsGrid}>
        {/* Total Products */}
        <KoshkCard variant="elevated" style={styles.metricCard}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            TOTAL PRODUCTS
          </KoshkText>
          <KoshkText variant="h1" color={colors.primary}>
            {metrics?.totalProducts ?? 0}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            SKUs tracked
          </KoshkText>
        </KoshkCard>

        {/* Low Stock Alerts */}
        <KoshkCard
          variant="elevated"
          style={[styles.metricCard, { borderColor: (metrics?.lowStockCount ?? 0) > 0 ? colors.danger : colors.border }]}
        >
          <KoshkText variant="overline" color={colors.textSecondary}>
            LOW STOCK
          </KoshkText>
          <KoshkText
            variant="h1"
            color={(metrics?.lowStockCount ?? 0) > 0 ? colors.danger : colors.success}
          >
            {metrics?.lowStockCount ?? 0}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            Items need attention
          </KoshkText>
        </KoshkCard>

        {/* Out of Stock */}
        <KoshkCard variant="elevated" style={styles.metricCard}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            OUT OF STOCK
          </KoshkText>
          <KoshkText
            variant="h1"
            color={(metrics?.outOfStockCount ?? 0) > 0 ? colors.warning : colors.success}
          >
            {metrics?.outOfStockCount ?? 0}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            Unavailable
          </KoshkText>
        </KoshkCard>

        {/* Inventory Value */}
        <KoshkCard variant="elevated" style={styles.metricCard}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            INVENTORY VALUE
          </KoshkText>
          <KoshkText variant="h2" color={colors.accent}>
            ${(metrics?.totalInventoryValue ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            Net equity
          </KoshkText>
        </KoshkCard>
      </View>

      {/* ── Low Stock Alerts Table ────────────────────────────────────── */}
      {(metrics?.lowStockItems?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <KoshkText variant="label">LOW STOCK ALERTS</KoshkText>
            <KoshkBadge variant="lowStock" label={`${metrics?.lowStockCount ?? 0} CRITICAL`} />
          </View>
          <KoshkCard style={styles.tableCard}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.border }]}>
              <KoshkText variant="caption" bold style={styles.colProduct} color={colors.textSecondary}>
                PRODUCT
              </KoshkText>
              <KoshkText variant="caption" bold style={styles.colStock} color={colors.textSecondary}>
                STOCK
              </KoshkText>
              <KoshkText variant="caption" bold style={styles.colStatus} color={colors.textSecondary}>
                STATUS
              </KoshkText>
            </View>

            {metrics?.lowStockItems.map((item) => (
              <View
                key={item._id}
                style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}
              >
                <View style={styles.colProduct}>
                  <KoshkText variant="bodySmall" numberOfLines={1}>
                    {item.name}
                  </KoshkText>
                  <KoshkText variant="caption" color={colors.textMuted}>
                    {item.category}
                  </KoshkText>
                </View>
                <KoshkText variant="body" bold style={styles.colStock} color={colors.danger}>
                  {item.stock}
                </KoshkText>
                <View style={styles.colStatus}>
                  <KoshkBadge variant={item.stock <= 2 ? 'lowStock' : 'limited'} label={item.stock <= 2 ? 'CRITICAL' : 'LOW'} />
                </View>
              </View>
            ))}
          </KoshkCard>
        </View>
      )}

      {/* ── Recent Orders ─────────────────────────────────────────────── */}
      {(metrics?.recentOrders?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <KoshkText variant="label" style={styles.sectionLabel}>
            RECENT ORDERS
          </KoshkText>
          {metrics?.recentOrders.map((order) => (
            <KoshkCard key={order._id} style={styles.orderRow}>
              <View style={styles.orderRowInner}>
                <View style={{ flex: 1 }}>
                  <KoshkText variant="bodySmall" semiBold>
                    #{order._id.slice(-8).toUpperCase()}
                  </KoshkText>
                  <KoshkText variant="caption" color={colors.textSecondary}>
                    {order.items.length} items • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </KoshkText>
                </View>
                <KoshkText variant="body" semiBold color={colors.primary}>
                  ${order.totalPrice.toFixed(2)}
                </KoshkText>
              </View>
            </KoshkCard>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.section, { paddingBottom: Spacing['3xl'] }]}>
        <KoshkText variant="label" style={styles.sectionLabel}>
          ACTIONS
        </KoshkText>
        <KoshkButton
          title="ADD PRODUCT"
          variant="primary"
          fullWidth
          onPress={() => router.push('/admin/add-product')}
          style={styles.navBtn}
        />
        <KoshkButton
          title="INVENTORY MANAGEMENT"
          variant="secondary"
          fullWidth
          onPress={() => router.push('/admin/inventory')}
          style={styles.navBtn}
        />
        <KoshkButton
          title="BACK TO STORE"
          variant="outline"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
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
  statusBar: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    padding: Spacing.sm,
    gap: Spacing.lg,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Metrics
  metricsGrid: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  metricCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  // Sections
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  // Table
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderBottomWidth: Borders.medium,
  },
  colProduct: { flex: 2 },
  colStock: { width: 50, textAlign: 'center' },
  colStatus: { flex: 1, alignItems: 'flex-end' },
  // Orders
  orderRow: {
    marginTop: Spacing.xs,
  },
  orderRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    marginBottom: Spacing.sm,
  },
});
