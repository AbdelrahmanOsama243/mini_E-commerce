import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkCard, KoshkBadge } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { OrderService, Order, OrderStatus } from '@/Services/Order.Service';
import { AuthService } from '@/Services/Auth.Service';
import { TokenStorage } from '@/Services/TokenStorage';
import { Product } from '@/Services/Product.Service';

// ─── Status Styling ──────────────────────────────────────────────────────────

function getStatusBadge(status: OrderStatus): { variant: 'optimal' | 'new' | 'limited' | 'lowStock'; label: string } {
  switch (status) {
    case 'delivered':
      return { variant: 'optimal', label: 'DELIVERED' };
    case 'shipped':
      return { variant: 'new', label: 'SHIPPED' };
    case 'processing':
      return { variant: 'limited', label: 'PROCESSING' };
    case 'pending':
    default:
      return { variant: 'lowStock', label: 'PENDING' };
  }
}

const STATUS_TIMELINE: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const { colors, isDark } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const tokens = await TokenStorage.getStoredTokens();
      if (!tokens.accessToken) {
        setLoading(false);
        return;
      }
      const data = await OrderService.getOrders();
      setOrders(data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const renderTimeline = (currentStatus: OrderStatus) => {
    const currentIdx = STATUS_TIMELINE.indexOf(currentStatus);
    return (
      <View style={styles.timeline}>
        {STATUS_TIMELINE.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const isActive = idx === currentIdx;
          return (
            <View key={step} style={styles.timelineStep}>
              <View style={styles.timelineNodeRow}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: isCompleted ? colors.primary : colors.surface,
                      borderColor: isCompleted ? colors.primary : colors.borderLight,
                    },
                    isActive && styles.timelineDotActive,
                  ]}
                />
                {idx < STATUS_TIMELINE.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: idx < currentIdx ? colors.primary : colors.borderLight,
                      },
                    ]}
                  />
                )}
              </View>
              <KoshkText
                variant="caption"
                bold={isActive}
                color={isCompleted ? colors.text : colors.textMuted}
                uppercase
                style={styles.timelineLabel}
              >
                {step}
              </KoshkText>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusBadge = getStatusBadge(item.status);
    const isExpanded = expandedOrder === item._id;
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A';

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => toggleExpand(item._id)}>
        <KoshkCard variant="default" style={styles.orderCard}>
          {/* Header Row */}
          <View style={styles.orderHeader}>
            <View>
              <KoshkText variant="caption" color={colors.textSecondary}>
                ORDER ID
              </KoshkText>
              <KoshkText variant="body" semiBold>
                #{item._id.slice(-8).toUpperCase()}
              </KoshkText>
            </View>
            <KoshkBadge variant={statusBadge.variant} label={statusBadge.label} />
          </View>

          {/* Info Row */}
          <View style={[styles.orderInfoRow, { borderTopColor: colors.borderLight }]}>
            <View style={styles.orderInfoItem}>
              <KoshkText variant="caption" color={colors.textSecondary}>
                DATE
              </KoshkText>
              <KoshkText variant="bodySmall" semiBold>
                {date}
              </KoshkText>
            </View>
            <View style={styles.orderInfoItem}>
              <KoshkText variant="caption" color={colors.textSecondary}>
                ITEMS
              </KoshkText>
              <KoshkText variant="bodySmall" semiBold>
                {item.items.length}
              </KoshkText>
            </View>
            <View style={styles.orderInfoItem}>
              <KoshkText variant="caption" color={colors.textSecondary}>
                TOTAL
              </KoshkText>
              <KoshkText variant="bodySmall" semiBold color={colors.primary}>
                ${item.totalPrice.toFixed(2)}
              </KoshkText>
            </View>
          </View>

          {/* Expanded: Timeline + Items */}
          {isExpanded && (
            <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
              <KoshkText variant="label" style={styles.expandedLabel}>
                LOGISTICS TIMELINE
              </KoshkText>
              {renderTimeline(item.status)}

              <KoshkText variant="label" style={styles.expandedLabel}>
                ORDER ITEMS
              </KoshkText>
              {item.items.map((orderItem, idx) => {
                const product = typeof orderItem.productId === 'object'
                  ? (orderItem.productId as Product)
                  : null;
                return (
                  <View
                    key={orderItem._id ?? idx}
                    style={[styles.orderItemRow, { borderBottomColor: colors.borderLight }]}
                  >
                    <KoshkText variant="bodySmall" style={{ flex: 1 }}>
                      {product?.name ?? 'Product'}
                    </KoshkText>
                    <KoshkText variant="bodySmall" color={colors.textSecondary}>
                      ×{orderItem.quantity}
                    </KoshkText>
                    <KoshkText variant="bodySmall" semiBold style={styles.orderItemPrice}>
                      ${orderItem.priceAtPurchase.toFixed(2)}
                    </KoshkText>
                  </View>
                );
              })}

              <KoshkText variant="caption" color={colors.textSecondary} style={styles.shippingAddress}>
                Ship to: {item.shippingAddress}
              </KoshkText>
            </View>
          )}

          {/* Expand Indicator */}
          <View style={styles.expandIndicator}>
            <KoshkText variant="caption" color={colors.textMuted}>
              {isExpanded ? '▲ COLLAPSE' : '▼ DETAILS'}
            </KoshkText>
          </View>
        </KoshkCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        ListHeaderComponent={
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <KoshkText variant="overline">TRACKING</KoshkText>
            <KoshkText variant="h2">My Orders</KoshkText>
            <KoshkText variant="bodySmall" color={colors.textSecondary}>
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </KoshkText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <KoshkText variant="h3" center>
              ◻
            </KoshkText>
            <KoshkText variant="body" color={colors.textSecondary} center>
              No orders yet
            </KoshkText>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  listContent: { paddingBottom: Spacing['3xl'] },
  orderCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfoRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.lg,
  },
  orderInfoItem: {},
  expandedSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: Borders.medium,
  },
  expandedLabel: { marginBottom: Spacing.sm, marginTop: Spacing.sm },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  timelineNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: Borders.medium,
    zIndex: 1,
  },
  timelineDotActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 3,
    top: 6,
    zIndex: 0,
  },
  timelineLabel: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  orderItemPrice: {
    minWidth: 60,
    textAlign: 'right',
  },
  shippingAddress: {
    marginTop: Spacing.md,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  emptyState: {
    paddingTop: Spacing['5xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
