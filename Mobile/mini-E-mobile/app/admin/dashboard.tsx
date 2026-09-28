import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { KoshkText, KoshkCard, KoshkBadge, KoshkButton } from '@/components/Mobile';
import { Borders, Spacing, Palette } from '@/constants/theme';
import { moderateScale } from '@/Utils/responsive';
import { ProductService, Product } from '@/Services/Product.Service';
import { OrderService, Order } from '@/Services/Order.Service';
import {
  AnalyticsService,
  AdminOverview,
  AdminProductRanking,
  LowStockProduct,
} from '@/Services/Analytics.Service';
import { TokenStorage } from '@/Services/TokenStorage';
import { showSuccess, showError, showInfo } from '@/Utils/toast';

export default function AdminDashboardScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [topProducts, setTopProducts] = useState<AdminProductRanking[]>([]);
  const [leastProducts, setLeastProducts] = useState<AdminProductRanking[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog States
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);

  // Active target for Restock / Edit
  const [activeItem, setActiveItem] = useState<{ id: string; name: string; stock: number; price?: number; category?: string; description?: string; image?: string } | null>(null);
  const [restockQty, setRestockQty] = useState<string>('10');

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('decor');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      if (!accessToken) return;

      const [adminOverview, topProds, leastProds, lowStock, ordersData, prodsData] = await Promise.all([
        AnalyticsService.getAdminOverview(),
        AnalyticsService.getAdminTopProducts(5),
        AnalyticsService.getAdminLeastProducts(5),
        AnalyticsService.getAdminLowStock(5),
        OrderService.getOrders(true),
        ProductService.getProducts({ page: 1, limit: 100 }),
      ]);

      setOverview(adminOverview);
      setTopProducts(topProds || []);
      setLeastProducts(leastProds || []);
      setLowStockItems(lowStock || []);
      setRecentOrders(ordersData?.slice(0, 5) || []);
      setAllProducts(prodsData?.items || []);
    } catch {
      setOverview(null);
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

  // --- Handlers: Quick Restock ---
  const openRestock = (item: { _id?: string; id?: string; name: string; stock?: number; currentStock?: number; price?: number; category?: string }) => {
    const id = item._id || item.id || '';
    const stock = item.stock ?? item.currentStock ?? 0;
    setActiveItem({ id, name: item.name, stock, price: item.price, category: item.category });
    setRestockQty('10');
    setRestockModalVisible(true);
  };

  const handleSaveRestock = async () => {
    if (!activeItem?.id) return;
    const addQty = parseInt(restockQty, 10);
    if (isNaN(addQty) || addQty <= 0) {
      showInfo('Invalid Quantity', 'Please enter a positive restock quantity.');
      return;
    }

    const nextStock = (activeItem.stock || 0) + addQty;

    try {
      setActionLoading(true);
      await ProductService.updateProduct(activeItem.id, { stock: nextStock });
      showSuccess('Stock Updated', `Added +${addQty} units to "${activeItem.name}". New stock is ${nextStock} units.`);
      setRestockModalVisible(false);
      loadDashboard();
    } catch (e: any) {
      showError('Restock Failed', e);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Add Product ---
  const openAddModal = () => {
    setFormName('');
    setFormCategory('decor');
    setFormPrice('');
    setFormStock('10');
    setFormImage('');
    setFormDescription('');
    setAddModalVisible(true);
  };

  const handleCreateProduct = async () => {
    if (!formName.trim()) {
      showInfo('Validation Error', 'Product name is required.');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showInfo('Validation Error', 'Please enter a valid price.');
      return;
    }
    const stockNum = parseInt(formStock, 10);

    try {
      setActionLoading(true);
      await ProductService.createProduct({
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        stock: isNaN(stockNum) ? 0 : stockNum,
        image: formImage.trim() || undefined,
        description: formDescription.trim() || undefined,
      });
      showSuccess('Product Created', `"${formName}" created successfully!`);
      setAddModalVisible(false);
      loadDashboard();
    } catch (e: any) {
      showError('Failed to Create Product', e);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Edit Product ---
  const openEdit = (item: Product | AdminProductRanking | LowStockProduct) => {
    const id = item._id;
    setActiveItem({
      id,
      name: item.name,
      stock: item.stock,
      price: item.price,
      category: item.category,
      description: (item as Product).description || '',
      image: (item as Product).image || '',
    });
    setFormName(item.name);
    setFormCategory(item.category || 'decor');
    setFormPrice(item.price.toString());
    setFormStock(item.stock.toString());
    setFormImage((item as Product).image || '');
    setFormDescription((item as Product).description || '');
    setEditModalVisible(true);
  };

  const handleUpdateProduct = async () => {
    if (!activeItem?.id) return;
    if (!formName.trim()) {
      showInfo('Validation Error', 'Product name is required.');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showInfo('Validation Error', 'Please enter a valid price.');
      return;
    }

    try {
      setActionLoading(true);
      await ProductService.updateProduct(activeItem.id, {
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        stock: parseInt(formStock, 10) || 0,
        image: formImage.trim() || undefined,
        description: formDescription.trim() || undefined,
      });
      showSuccess('Product Updated', `"${formName}" updated successfully!`);
      setEditModalVisible(false);
      loadDashboard();
    } catch (e: any) {
      showError('Update Failed', e);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Handlers: Delete Product ---
  const handleDeleteProduct = (id: string, name: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to permanently delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await ProductService.deleteProduct(id);
              showSuccess('Product Deleted', `"${name}" removed successfully.`);
              loadDashboard();
            } catch (e: any) {
              showError('Delete Failed', e);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              SELLER TERMINAL & ANALYTICS
            </KoshkText>
            <KoshkText variant="h2">Admin Dashboard</KoshkText>
            <KoshkText variant="caption" color={colors.textSecondary}>
              Real-time multi-admin store intelligence
            </KoshkText>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <KoshkText variant="body">✕</KoshkText>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Header Bar */}
        <View style={styles.quickHeaderActions}>
          <TouchableOpacity
            onPress={openAddModal}
            style={[styles.actionBtnPrimary, { backgroundColor: Palette.yellow, borderColor: colors.border }]}
          >
            <KoshkText variant="caption" bold color={Palette.black}>➕ ADD PRODUCT</KoshkText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setInventoryModalVisible(true)}
            style={[styles.actionBtnSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <KoshkText variant="caption" bold color={colors.text}>📦 PRODUCTS HUB</KoshkText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Metric Cards Grid ─────────────────────────────────────────── */}
      <View style={styles.metricsGrid}>
        {/* Total Revenue */}
        <KoshkCard variant="elevated" style={[styles.metricCard, { borderColor: Palette.accentGreen }]}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            STORE REVENUE
          </KoshkText>
          <KoshkText variant="h1" color={Palette.accentGreen}>
            ${(overview?.totalRevenue ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            {overview?.totalOrdersCount ?? 0} orders processed
          </KoshkText>
        </KoshkCard>

        {/* Units Sold */}
        <KoshkCard variant="elevated" style={styles.metricCard}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            UNITS SOLD
          </KoshkText>
          <KoshkText variant="h1" color={colors.primary}>
            {overview?.totalItemsSold ?? 0}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            Across all product listings
          </KoshkText>
        </KoshkCard>

        {/* Total Products & Inventory Value */}
        <KoshkCard variant="elevated" style={styles.metricCard}>
          <KoshkText variant="overline" color={colors.textSecondary}>
            MY PRODUCTS
          </KoshkText>
          <KoshkText variant="h1" color={colors.primary}>
            {overview?.totalProducts ?? 0}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            Inventory Value: ${(overview?.totalInventoryValue ?? 0).toFixed(0)}
          </KoshkText>
        </KoshkCard>

        {/* Low Stock Alerts */}
        <KoshkCard
          variant="elevated"
          style={[styles.metricCard, { borderColor: (overview?.lowStockCount ?? 0) > 0 ? colors.danger : colors.border }]}
        >
          <KoshkText variant="overline" color={colors.textSecondary}>
            LOW STOCK ALERTS
          </KoshkText>
          <KoshkText
            variant="h1"
            color={(overview?.lowStockCount ?? 0) > 0 ? colors.danger : colors.success}
          >
            {overview?.lowStockCount ?? 0}
          </KoshkText>
          <KoshkText variant="caption" color={colors.textMuted}>
            {overview?.outOfStockCount ?? 0} completely out of stock
          </KoshkText>
        </KoshkCard>
      </View>

      {/* ── Critical Low Stock Table with Direct Restock / Edit ───────── */}
      {lowStockItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <KoshkText variant="label" color={colors.danger}>⚠️ RESTOCK ALERTS (≤ 5 units)</KoshkText>
            <KoshkBadge variant="lowStock" label={`${lowStockItems.length} CRITICAL`} />
          </View>
          <KoshkCard style={styles.tableCard}>
            {lowStockItems.map((item) => (
              <View
                key={item._id}
                style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}
              >
                <View style={styles.colProduct}>
                  <KoshkText variant="bodySmall" bold numberOfLines={1}>
                    {item.name}
                  </KoshkText>
                  <KoshkText variant="caption" color={colors.textMuted}>
                    {item.category} • ${item.price.toFixed(2)}
                  </KoshkText>
                </View>
                <KoshkText variant="body" bold style={styles.colStock} color={colors.danger}>
                  {item.stock} left
                </KoshkText>
                <View style={styles.rowActionGroup}>
                  <TouchableOpacity
                    onPress={() => openRestock(item)}
                    style={[styles.miniBtn, { backgroundColor: Palette.accentGreen, borderColor: colors.border }]}
                  >
                    <KoshkText variant="caption" bold color={Palette.white}>⚡</KoshkText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openEdit(item)}
                    style={[styles.miniBtn, { backgroundColor: Palette.blue, borderColor: colors.border }]}
                  >
                    <KoshkText variant="caption" bold color={Palette.white}>✏️</KoshkText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </KoshkCard>
        </View>
      )}

      {/* ── Top Selling Products ─────────────────────────────────────── */}
      {topProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <KoshkText variant="label">TOP SELLING PRODUCTS</KoshkText>
            <KoshkBadge variant="optimal" label="HIGH VELOCITY" />
          </View>
          <KoshkCard style={styles.tableCard}>
            {topProducts.map((item, idx) => (
              <View
                key={item._id || idx}
                style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}
              >
                <View style={styles.colProduct}>
                  <KoshkText variant="bodySmall" bold numberOfLines={1}>
                    {item.name}
                  </KoshkText>
                  <KoshkText variant="caption" color={colors.textMuted}>
                    {item.category} • ${item.price.toFixed(2)}
                  </KoshkText>
                </View>
                <View style={styles.colMetrics}>
                  <KoshkText variant="bodySmall" bold color={colors.primary}>
                    {item.totalSold} sold
                  </KoshkText>
                  <KoshkText variant="caption" color={colors.success}>
                    ${item.totalRevenue.toFixed(0)}
                  </KoshkText>
                </View>
                <TouchableOpacity
                  onPress={() => openEdit(item)}
                  style={[styles.miniBtn, { backgroundColor: colors.card, borderColor: colors.border, marginLeft: Spacing.sm }]}
                >
                  <KoshkText variant="caption">✏️</KoshkText>
                </TouchableOpacity>
              </View>
            ))}
          </KoshkCard>
        </View>
      )}

      {/* ── Least Selling Products (Needs Action) ────────────────────── */}
      {leastProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <KoshkText variant="label">LEAST SELLING PRODUCTS</KoshkText>
            <KoshkBadge variant="limited" label="LOW VELOCITY" />
          </View>
          <KoshkCard style={styles.tableCard}>
            {leastProducts.map((item, idx) => (
              <View
                key={item._id || idx}
                style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}
              >
                <View style={styles.colProduct}>
                  <KoshkText variant="bodySmall" numberOfLines={1}>
                    {item.name}
                  </KoshkText>
                  <KoshkText variant="caption" color={colors.textMuted}>
                    Stock: {item.stock} • ${item.price.toFixed(2)}
                  </KoshkText>
                </View>
                <View style={styles.colMetrics}>
                  <KoshkText variant="bodySmall" bold color={colors.warning}>
                    {item.totalSold} sold
                  </KoshkText>
                </View>
                <View style={styles.rowActionGroup}>
                  <TouchableOpacity
                    onPress={() => openRestock(item)}
                    style={[styles.miniBtn, { backgroundColor: Palette.accentGreen, borderColor: colors.border }]}
                  >
                    <KoshkText variant="caption" bold color={Palette.white}>⚡</KoshkText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openEdit(item)}
                    style={[styles.miniBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <KoshkText variant="caption">✏️</KoshkText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </KoshkCard>
        </View>
      )}

      {/* ── Recent Orders ─────────────────────────────────────────────── */}
      {recentOrders.length > 0 && (
        <View style={styles.section}>
          <KoshkText variant="label" style={styles.sectionLabel}>
            RECENT STORE ORDERS
          </KoshkText>
          {recentOrders.map((order) => (
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
          MANAGEMENT ACTIONS
        </KoshkText>
        <KoshkButton
          title="➕ ADD NEW PRODUCT (POPUP)"
          variant="primary"
          fullWidth
          onPress={openAddModal}
          style={styles.navBtn}
        />
        <KoshkButton
          title="📦 PRODUCTS INVENTORY HUB (POPUP)"
          variant="secondary"
          fullWidth
          onPress={() => setInventoryModalVisible(true)}
          style={styles.navBtn}
        />
        <KoshkButton
          title="BACK TO STORE"
          variant="outline"
          fullWidth
          onPress={() => router.replace('/(tabs)')}
        />
      </View>

      {/* =============================================================== */}
      {/* POPUP DIALOG: 1. QUICK RESTOCK MODAL                            */}
      {/* =============================================================== */}
      <Modal
        visible={restockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestockModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? '#262420' : '#f3f4f6' }]}>
              <KoshkText variant="h3">⚡ Quick Restock</KoshkText>
              <TouchableOpacity onPress={() => setRestockModalVisible(false)}>
                <KoshkText variant="h3">✕</KoshkText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <KoshkText variant="body" bold>{activeItem?.name}</KoshkText>
              <KoshkText variant="caption" color={colors.textSecondary}>Current Stock: {activeItem?.stock} units</KoshkText>

              <KoshkText variant="label" style={{ marginTop: Spacing.md }}>Restock Quantity to Add (+):</KoshkText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={restockQty}
                onChangeText={setRestockQty}
                placeholder="e.g. 10"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.presetRow}>
                {[5, 10, 25, 50, 100].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setRestockQty(num.toString())}
                    style={[styles.presetChip, { borderColor: colors.border, backgroundColor: isDark ? '#33302b' : '#eee' }]}
                  >
                    <KoshkText variant="caption" bold>+{num}</KoshkText>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: isDark ? '#262420' : '#f3f4f6', borderColor: colors.border, borderWidth: 1 }}>
                <KoshkText variant="caption" color={colors.textSecondary}>
                  Current ({activeItem?.stock ?? 0}) + Adding ({parseInt(restockQty, 10) || 0}) = <KoshkText variant="caption" bold color={Palette.accentGreen}>{(activeItem?.stock ?? 0) + (parseInt(restockQty, 10) || 0)} Total Units</KoshkText>
                </KoshkText>
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <KoshkButton
                title="Cancel"
                variant="outline"
                onPress={() => setRestockModalVisible(false)}
              />
              <KoshkButton
                title={actionLoading ? 'Updating...' : `⚡ Restock (+${parseInt(restockQty, 10) || 0})`}
                variant="primary"
                loading={actionLoading}
                onPress={handleSaveRestock}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* =============================================================== */}
      {/* POPUP DIALOG: 2. ADD PRODUCT MODAL                             */}
      {/* =============================================================== */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBoxLarge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? '#262420' : '#f3f4f6' }]}>
              <KoshkText variant="h3">➕ Add New Product</KoshkText>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <KoshkText variant="h3">✕</KoshkText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <KoshkText variant="label">Product Name *</KoshkText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Minimalist Watch"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
              />

              <KoshkText variant="label">Category</KoshkText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="decor, apparel, furniture..."
                placeholderTextColor={colors.textMuted}
                value={formCategory}
                onChangeText={setFormCategory}
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <KoshkText variant="label">Price ($) *</KoshkText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="29.99"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <KoshkText variant="label">Stock *</KoshkText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="10"
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                    value={formStock}
                    onChangeText={setFormStock}
                  />
                </View>
              </View>

              <KoshkText variant="label">Image URL</KoshkText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.textMuted}
                value={formImage}
                onChangeText={setFormImage}
              />

              <KoshkText variant="label">Description</KoshkText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Product specs, dimensions..."
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.textMuted}
                value={formDescription}
                onChangeText={setFormDescription}
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <KoshkButton
                title="Cancel"
                variant="outline"
                onPress={() => setAddModalVisible(false)}
              />
              <KoshkButton
                title={actionLoading ? 'Creating...' : 'Publish Product'}
                variant="primary"
                loading={actionLoading}
                onPress={handleCreateProduct}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* =============================================================== */}
      {/* POPUP DIALOG: 3. EDIT PRODUCT MODAL                            */}
      {/* =============================================================== */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBoxLarge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? '#262420' : '#f3f4f6' }]}>
              <KoshkText variant="h3">✏️ Edit Product</KoshkText>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <KoshkText variant="h3">✕</KoshkText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <KoshkText variant="label">Product Name *</KoshkText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={formName}
                onChangeText={setFormName}
              />

              <KoshkText variant="label">Category</KoshkText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={formCategory}
                onChangeText={setFormCategory}
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <KoshkText variant="label">Price ($) *</KoshkText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <KoshkText variant="label">Stock *</KoshkText>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={formStock}
                    onChangeText={setFormStock}
                  />
                </View>
              </View>

              <KoshkText variant="label">Image URL</KoshkText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={formImage}
                onChangeText={setFormImage}
              />

              <KoshkText variant="label">Description</KoshkText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                multiline
                numberOfLines={3}
                value={formDescription}
                onChangeText={setFormDescription}
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <KoshkButton
                title="Cancel"
                variant="outline"
                onPress={() => setEditModalVisible(false)}
              />
              <KoshkButton
                title={actionLoading ? 'Saving...' : 'Save Changes'}
                variant="primary"
                loading={actionLoading}
                onPress={handleUpdateProduct}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* =============================================================== */}
      {/* POPUP DIALOG: 4. INVENTORY HUB MODAL                           */}
      {/* =============================================================== */}
      <Modal
        visible={inventoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInventoryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBoxLarge, { backgroundColor: colors.card, borderColor: colors.border, height: '85%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: isDark ? '#262420' : '#f3f4f6' }]}>
              <KoshkText variant="h3">📦 Products Hub</KoshkText>
              <TouchableOpacity onPress={() => setInventoryModalVisible(false)}>
                <KoshkText variant="h3">✕</KoshkText>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="🔍 Search products..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item._id}
              style={{ flex: 1, paddingHorizontal: Spacing.md }}
              renderItem={({ item }) => (
                <View style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={{ flex: 2 }}>
                    <KoshkText variant="bodySmall" bold numberOfLines={1}>{item.name}</KoshkText>
                    <KoshkText variant="caption" color={colors.textMuted}>
                      {item.category} • ${item.price.toFixed(2)} • {item.stock} left
                    </KoshkText>
                  </View>
                  <View style={styles.rowActionGroup}>
                    <TouchableOpacity
                      onPress={() => { setInventoryModalVisible(false); openRestock(item); }}
                      style={[styles.miniBtn, { backgroundColor: Palette.accentGreen, borderColor: colors.border }]}
                    >
                      <KoshkText variant="caption" bold color={Palette.white}>⚡</KoshkText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { setInventoryModalVisible(false); openEdit(item); }}
                      style={[styles.miniBtn, { backgroundColor: Palette.blue, borderColor: colors.border }]}
                    >
                      <KoshkText variant="caption" bold color={Palette.white}>✏️</KoshkText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProduct(item._id, item.name)}
                      style={[styles.miniBtn, { backgroundColor: Palette.danger, borderColor: colors.border }]}
                    >
                      <KoshkText variant="caption" bold color={Palette.white}>🗑️</KoshkText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <KoshkText variant="caption" color={colors.textMuted}>Total: {filteredProducts.length} items</KoshkText>
              <KoshkButton
                title="Close"
                variant="outline"
                onPress={() => setInventoryModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

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
  quickHeaderActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtnPrimary: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
  },
  actionBtnSecondary: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
  },
  metricsGrid: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  metricCard: {
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
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
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
  colProduct: { flex: 2 },
  colMetrics: { alignItems: 'flex-end', minWidth: 80 },
  colStock: { width: 70, textAlign: 'center' },
  rowActionGroup: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: Spacing.xs,
  },
  miniBtn: {
    width: 30,
    height: 30,
    borderWidth: 1.5,
    borderRadius: Borders.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.sm,
    overflow: 'hidden',
  },
  modalBoxLarge: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderWidth: Borders.brutalist,
    borderRadius: Borders.radius.sm,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: Borders.medium,
  },
  modalBody: {
    padding: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: Borders.thin,
  },
  input: {
    borderWidth: Borders.medium,
    borderRadius: Borders.radius.xs,
    padding: Spacing.sm,
    fontSize: moderateScale(13),
    marginBottom: Spacing.sm,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  presetChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: Borders.radius.xs,
  },
});
