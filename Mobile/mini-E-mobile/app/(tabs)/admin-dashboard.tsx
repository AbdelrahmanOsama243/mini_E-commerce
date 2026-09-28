import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkCard } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { ProductService } from '@/Services/Product.Service';
import { OrderService } from '@/Services/Order.Service';
import { TokenStorage } from '@/Services/TokenStorage';

export default function AdminDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [metrics, setMetrics] = useState({
    products: 0,
    orders: 0,
    pending: 0,
    delivered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      if (!accessToken) return;

      const [productsData, ordersData] = await Promise.all([
        ProductService.getProducts({ limit: 1 }),
        OrderService.getOrders(true),
      ]);

      setMetrics({
        products: productsData.total || 0,
        orders: ordersData?.length || 0,
        pending: ordersData?.filter((o: any) => o.status === 'Pending').length || 0,
        delivered: ordersData?.filter((o: any) => o.status === 'Delivered').length || 0,
      });
    } catch (err) {
      console.warn('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const quickActions = [
    { title: 'Add Product', color: Palette.success, route: '/admin/add-product' },
    { title: 'Manage Products', color: Palette.danger, route: '/admin/inventory' },
    { title: 'Manage Orders', color: Palette.warning, route: '/(tabs)/orders' },
    { title: 'Management Terminal', color: colors.primary, route: '/admin/dashboard' },
  ];

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <KoshkText variant="overline" color={colors.textSecondary}>ADMIN</KoshkText>
        <KoshkText variant="h1">Dashboard</KoshkText>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <KoshkCard variant="elevated" style={[styles.statCard, { borderLeftColor: Palette.danger }]}>
          <KoshkText variant="h3" color={colors.primary}>{metrics.products}</KoshkText>
          <KoshkText variant="caption" color={colors.textSecondary}>Total Products</KoshkText>
        </KoshkCard>
        
        <KoshkCard variant="elevated" style={[styles.statCard, { borderLeftColor: Palette.warning }]}>
          <KoshkText variant="h3" color={colors.primary}>{metrics.orders}</KoshkText>
          <KoshkText variant="caption" color={colors.textSecondary}>Total Orders</KoshkText>
        </KoshkCard>
        
        <KoshkCard variant="elevated" style={[styles.statCard, { borderLeftColor: Palette.blue }]}>
          <KoshkText variant="h3" color={colors.primary}>{metrics.pending}</KoshkText>
          <KoshkText variant="caption" color={colors.textSecondary}>Pending Orders</KoshkText>
        </KoshkCard>
        
        <KoshkCard variant="elevated" style={[styles.statCard, { borderLeftColor: Palette.success }]}>
          <KoshkText variant="h3" color={colors.primary}>{metrics.delivered}</KoshkText>
          <KoshkText variant="caption" color={colors.textSecondary}>Delivered</KoshkText>
        </KoshkCard>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <KoshkText variant="label" style={styles.sectionTitle}>QUICK ACTIONS</KoshkText>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              if (action.route) {
                router.push(action.route as any);
              }
            }}
            style={[
              styles.actionButton,
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderLeftColor: action.color 
              }
            ]}
          >
            <KoshkText variant="button">{action.title}</KoshkText>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '47%',
    borderLeftWidth: 4,
    padding: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  actionButton: {
    borderWidth: Borders.brutalist,
    borderLeftWidth: 4,
    borderRadius: Borders.radius.xs,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
