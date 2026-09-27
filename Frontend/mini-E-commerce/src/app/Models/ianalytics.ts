// ─── Analytics Models ─────────────────────────────────────────────────────────

export interface UserOrderStats {
  totalOrders: number;
  totalSpent: number;
  paidCount: number;
  pendingCount: number;
  processingCount: number;
  shippedCount: number;
  deliveredCount: number;
  failedCount: number;
  cancelledCount: number;
  refundedCount: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  extra?: any;
}

export interface SeriesDataPoint {
  name: string;
  series: ChartDataPoint[];
}

export interface AdminOverview {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  totalItemsSold: number;
  totalRevenue: number;
  totalOrdersCount: number;
}

export interface AdminProductRanking {
  _id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  value: number; // for charts (e.g. units sold)
  totalSold: number;
  totalRevenue: number;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  isOutOfStock: boolean;
  value: number;
}

export interface TopCustomer {
  _id: string;
  userId: string;
  name: string;
  email: string;
  totalSpent: number;
  itemsPurchased: number;
  ordersCount: number;
  value: number;
}

export interface AnalyticsApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
