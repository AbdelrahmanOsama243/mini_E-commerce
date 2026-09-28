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
import { AnalyticsService, UserOrderStats, ChartDataPoint } from '@/Services/Analytics.Service';
import { TokenStorage } from '@/Services/TokenStorage';

export default function UserAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [stats, setStats] = useState<UserOrderStats | null>(null);
  const [statusData, setStatusData] = useState<ChartDataPoint[]>([]);
  const [spendingData, setSpendingData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const [userStats, statuses, spending] = await Promise.all([
        AnalyticsService.getUserStats(),
        AnalyticsService.getUserOrdersByStatus(),
        AnalyticsService.getUserSpendingTimeline(),
      ]);

      setStats(userStats);
      setStatusData(statuses || []);
      setSpendingData(spending || []);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }, [loadAnalytics]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const maxSpending = spendingData.length > 0
    ? Math.max(...spendingData.map((d) => d.value), 1)
    : 1;

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
        <KoshkText variant="overline" color={colors.textSecondary}>
          CUSTOMER INSIGHTS
        </KoshkText>
        <KoshkText variant="h2">Dashboard</KoshkText>
        <KoshkText variant="caption" color={colors.textSecondary}>
          Purchasing metrics, orders status & spending history
        </KoshkText>
      </View>

      {/* Primary KPI Grid */}
      <View style={styles.kpiGrid}>
        <KoshkCard variant="elevated" style={styles.kpiCard}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            TOTAL ORDERS
          </KoshkText>
          <KoshkText variant="h1" color={colors.primary}>
            {stats?.totalOrders ?? 0}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            Lifetime purchases
          </KoshkText>
        </KoshkCard>

        <KoshkCard variant="elevated" style={[styles.kpiCard, { borderColor: Palette.accentGreen }]}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            TOTAL SPENT
          </KoshkText>
          <KoshkText variant="h4" color={colors.success} numberOfLines={1} adjustsFontSizeToFit>
            ${(stats?.totalSpent ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            Paid & confirmed
          </KoshkText>
        </KoshkCard>
      </View>

      {/* Orders Status Breakdown */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <KoshkText variant="label">ORDERS STATUS BREAKDOWN</KoshkText>
          <KoshkBadge variant="new" label={`${statusData.length} CATEGORIES`} />
        </View>

        <KoshkCard style={styles.breakdownCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: Palette.success }]} />
              <KoshkText variant="bodySmall">Paid & Processing</KoshkText>
            </View>
            <KoshkText variant="body" bold color={colors.success}>
              {(stats?.paidCount ?? 0) + (stats?.processingCount ?? 0)}
            </KoshkText>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: Palette.yellow }]} />
              <KoshkText variant="bodySmall">Pending Payment</KoshkText>
            </View>
            <KoshkText variant="body" bold color={colors.warning}>
              {stats?.pendingCount ?? 0}
            </KoshkText>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: Palette.blue }]} />
              <KoshkText variant="bodySmall">Shipped</KoshkText>
            </View>
            <KoshkText variant="body" bold color={colors.primary}>
              {stats?.shippedCount ?? 0}
            </KoshkText>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: Palette.accentGreen }]} />
              <KoshkText variant="bodySmall">Delivered</KoshkText>
            </View>
            <KoshkText variant="body" bold color={colors.success}>
              {stats?.deliveredCount ?? 0}
            </KoshkText>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: Palette.danger }]} />
              <KoshkText variant="bodySmall">Refunded</KoshkText>
            </View>
            <KoshkText variant="body" bold color={colors.danger}>
              {stats?.refundedCount ?? 0}
            </KoshkText>
          </View>
        </KoshkCard>
      </View>

      {/* Monthly Spending History */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <KoshkText variant="label">MONTHLY SPENDING TREND</KoshkText>
        </View>

        <KoshkCard style={styles.timelineCard}>
          {spendingData.length > 0 ? (
            spendingData.map((item) => {
              const barWidthPercent = Math.min(Math.round((item.value / maxSpending) * 100), 100);
              return (
                <View key={item.name} style={styles.spendingRow}>
                  <KoshkText variant="caption" bold style={styles.monthLabel}>
                    {item.name}
                  </KoshkText>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${barWidthPercent}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <KoshkText variant="bodySmall" bold style={styles.amountLabel}>
                    ${item.value.toFixed(0)}
                  </KoshkText>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <KoshkText variant="caption" color={colors.textMuted}>
                No monthly spending records yet.
              </KoshkText>
            </View>
          )}
        </KoshkCard>
      </View>

      {/* Quick Navigation Action */}
      <View style={[styles.section, { paddingBottom: Spacing['3xl'] }]}>
        <KoshkButton
          title="VIEW ALL ORDERS"
          variant="primary"
          fullWidth
          onPress={() => router.push('/(tabs)/orders')}
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
  kpiGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
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
  breakdownCard: {
    paddingVertical: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineCard: {
    paddingVertical: Spacing.sm,
  },
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  monthLabel: {
    width: 65,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: Borders.radius.xs,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  amountLabel: {
    width: 60,
    textAlign: 'right',
  },
  emptyContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
});
