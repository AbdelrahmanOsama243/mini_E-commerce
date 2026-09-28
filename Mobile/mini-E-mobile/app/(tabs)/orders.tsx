import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkCard, KoshkBadge, KoshkButton } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { OrderService, Order, OrderStatus } from '@/Services/Order.Service';
import { PaymentService } from '@/Services/Payment.Service';
import { AuthService } from '@/Services/Auth.Service';
import { TokenStorage } from '@/Services/TokenStorage';
import { Product } from '@/Services/Product.Service';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { showSuccess, showError, showInfo } from '@/Utils/toast';
import { moderateScale } from '@/Utils/responsive';

// ─── Status Styling ──────────────────────────────────────────────────────────

function getStatusBadge(status: OrderStatus): { variant: 'optimal' | 'new' | 'limited' | 'lowStock'; label: string } {
  switch (status) {
    case 'delivered':
      return { variant: 'optimal', label: 'DELIVERED' };
    case 'shipped':
      return { variant: 'new', label: 'SHIPPED' };
    case 'processing':
      return { variant: 'limited', label: 'PROCESSING' };
    case 'refunded':
      return { variant: 'lowStock', label: 'REFUNDED' };
    case 'partially_refunded':
      return { variant: 'limited', label: 'PARTIAL REFUND' };
    case 'payment_failed':
      return { variant: 'lowStock', label: 'PAYMENT FAILED' };
    case 'cancelled':
      return { variant: 'lowStock', label: 'CANCELLED' };
    case 'failed':
      return { variant: 'lowStock', label: 'FAILED' };
    case 'pending':
    default:
      return { variant: 'lowStock', label: 'PENDING' };
  }
}

const STATUS_TIMELINE: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OrdersScreen() {
  const { colors, isDark } = useTheme();
  const { orders, loading, loadOrders } = useOrderStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

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

  const handleRefund = (order: Order) => {
    Alert.alert(
      'Issue Refund',
      `Are you sure you want to refund $${order.totalPrice.toFixed(2)} for Order #${order._id.slice(-8).toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund Order',
          style: 'destructive',
          onPress: async () => {
            try {
              setRefundingOrderId(order._id);
              await PaymentService.refundPayment({
                orderId: order._id,
                amountCents: Math.round(order.totalPrice * 100),
              });
              showSuccess('Refund Issued', 'Refund has been processed successfully.');
              await loadOrders();
            } catch (err: any) {
              showError('Refund Failed', err);
            } finally {
              setRefundingOrderId(null);
            }
          },
        },
      ]
    );
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

    const txnNumber = item.transactionId
      ? `#TXN-${item.transactionId}`
      : item.paymobOrderId
      ? `#PM-${item.paymobOrderId}`
      : item.fawryReferenceNumber
      ? `#FWRY-${item.fawryReferenceNumber}`
      : item.paymentMethod === 'cod'
      ? `#COD-${item._id.slice(-6).toUpperCase()}`
      : `#TXN-${item._id.slice(-8).toUpperCase()}`;

    const paymentLabel =
      item.paymentMethod === 'card'
        ? 'Paymob Card'
        : item.paymentMethod === 'wallet'
        ? 'Paymob Wallet'
        : item.paymentMethod === 'kiosk'
        ? 'Fawry Pay'
        : item.paymentMethod === 'valu'
        ? 'valU BNPL'
        : 'Cash on Delivery';

    const paymentIcon =
      item.paymentMethod === 'card'
        ? 'card-outline'
        : item.paymentMethod === 'wallet'
        ? 'wallet-outline'
        : item.paymentMethod === 'kiosk'
        ? 'storefront-outline'
        : item.paymentMethod === 'valu'
        ? 'pie-chart-outline'
        : 'cash-outline';

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

          {/* Transaction Number & Payment Pill */}
          <View style={[styles.transactionRow, { backgroundColor: isDark ? '#262626' : '#F4F4F5' }]}>
            <View style={{ flex: 1 }}>
              <KoshkText variant="caption" color={colors.textSecondary} style={{ fontSize: moderateScale(9) }}>
                TRANSACTION #
              </KoshkText>
              <KoshkText variant="bodySmall" bold color={colors.primary}>
                {txnNumber}
              </KoshkText>
            </View>
            <View style={[styles.paymentMethodPill, { backgroundColor: isDark ? '#171717' : '#FFFFFF', borderColor: colors.borderLight }]}>
              <Ionicons name={paymentIcon as any} size={14} color={colors.primary} />
              <KoshkText variant="caption" bold color={colors.text}>
                {paymentLabel}
              </KoshkText>
            </View>
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
              {/* Payment & Transaction Detail Record */}
              <KoshkText variant="label" style={styles.expandedLabel}>
                PAYMENT & TRANSACTION RECORD
              </KoshkText>
              <View style={[styles.txnDetailBox, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB', borderColor: colors.borderLight }]}>
                <View style={styles.txnDetailRow}>
                  <KoshkText variant="caption" color={colors.textSecondary}>Payment Gateway:</KoshkText>
                  <KoshkText variant="caption" bold>{item.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paymob Accept'}</KoshkText>
                </View>
                {item.transactionId ? (
                  <View style={styles.txnDetailRow}>
                    <KoshkText variant="caption" color={colors.textSecondary}>Paymob Transaction ID:</KoshkText>
                    <KoshkText variant="caption" bold color={colors.primary}>{item.transactionId}</KoshkText>
                  </View>
                ) : null}
                {item.paymobOrderId ? (
                  <View style={styles.txnDetailRow}>
                    <KoshkText variant="caption" color={colors.textSecondary}>Paymob Order Ref:</KoshkText>
                    <KoshkText variant="caption" bold>{item.paymobOrderId}</KoshkText>
                  </View>
                ) : null}
                {item.fawryReferenceNumber ? (
                  <View style={styles.txnDetailRow}>
                    <KoshkText variant="caption" color={colors.textSecondary}>Fawry Reference #:</KoshkText>
                    <KoshkText variant="caption" bold color={colors.primary}>{item.fawryReferenceNumber}</KoshkText>
                  </View>
                ) : null}
                <View style={styles.txnDetailRow}>
                  <KoshkText variant="caption" color={colors.textSecondary}>Payment Method:</KoshkText>
                  <KoshkText variant="caption" bold>{paymentLabel}</KoshkText>
                </View>
              </View>

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

              {/* Refund Details if refunded */}
              {(item.refundedAmount ?? 0) > 0 && (
                <View style={[styles.refundBadgeContainer, { backgroundColor: colors.surface }]}>
                  <KoshkText variant="caption" bold color={Palette.danger}>
                    REFUNDED: ${item.refundedAmount?.toFixed(2)}
                  </KoshkText>
                </View>
              )}

              {/* Action: Issue Refund (Admin only) */}
              {isAdmin && item.status !== 'refunded' && item.status !== 'cancelled' && item.status !== 'failed' && (
                <View style={styles.adminActionContainer}>
                  <KoshkButton
                    title={refundingOrderId === item._id ? "PROCESSING REFUND..." : "REQUEST REFUND"}
                    variant="outline"
                    size="sm"
                    icon={<Ionicons name="arrow-undo-outline" size={16} color={Palette.danger} />}
                    fullWidth
                    disabled={refundingOrderId === item._id}
                    onPress={() => handleRefund(item)}
                    style={styles.refundButton}
                  />
                </View>
              )}
            </View>
          )}

          {/* Expand Indicator styled as sleek action button */}
          <View style={[styles.expandIndicator, { backgroundColor: isDark ? '#262626' : '#F9FAFB', borderColor: colors.borderLight }]}>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.primary} />
            <KoshkText variant="caption" bold color={colors.primary} style={{ marginLeft: 4 }}>
              {isExpanded ? 'COLLAPSE DETAILS' : 'VIEW TRANSACTION DETAILS'}
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
  refundBadgeContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.danger,
    borderRadius: Borders.radius.xs,
    alignItems: 'center',
  },
  adminActionContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Borders.radius.xs,
    marginTop: Spacing.xs,
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Borders.radius.xs,
    borderWidth: 1,
  },
  txnDetailBox: {
    padding: Spacing.sm,
    borderRadius: Borders.radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  txnDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refundButton: {
    marginTop: Spacing.xs,
    borderRadius: Borders.radius.xs,
    borderColor: '#EF4444',
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Borders.radius.xs,
    borderWidth: 1,
  },
  emptyState: {
    paddingTop: Spacing['5xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

