import { handleApiResponse, handleCentralError, ApiResponse } from '../Utils/errorHandler';
import axiosInstance from '../core/interceptors/HttpTokenInterceptor/HttpTokenInterceptor';

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
  value: number;
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

export const AnalyticsService = {
  // ── User Analytics ─────────────────────────────────────────────────────────

  async getUserStats(): Promise<UserOrderStats> {
    try {
      const response = await axiosInstance.get<ApiResponse<UserOrderStats>>('/analytics/user/stats');
      return await handleApiResponse<UserOrderStats>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getUserOrdersByStatus(): Promise<ChartDataPoint[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<ChartDataPoint[]>>('/analytics/user/by-status');
      return await handleApiResponse<ChartDataPoint[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getUserSpendingTimeline(): Promise<ChartDataPoint[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<ChartDataPoint[]>>('/analytics/user/spending');
      return await handleApiResponse<ChartDataPoint[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  // ── Admin Analytics (Scoped per logged-in admin) ───────────────────────────

  async getAdminOverview(): Promise<AdminOverview> {
    try {
      const response = await axiosInstance.get<ApiResponse<AdminOverview>>('/analytics/admin/overview');
      return await handleApiResponse<AdminOverview>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getAdminTopProducts(limit: number = 10): Promise<AdminProductRanking[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<AdminProductRanking[]>>('/analytics/admin/top-products', {
        params: { limit }
      });
      return await handleApiResponse<AdminProductRanking[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getAdminLeastProducts(limit: number = 10): Promise<AdminProductRanking[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<AdminProductRanking[]>>('/analytics/admin/least-products', {
        params: { limit }
      });
      return await handleApiResponse<AdminProductRanking[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getAdminLowStock(threshold: number = 5): Promise<LowStockProduct[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<LowStockProduct[]>>('/analytics/admin/low-stock', {
        params: { threshold }
      });
      return await handleApiResponse<LowStockProduct[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getAdminRevenueTimeline(): Promise<ChartDataPoint[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<ChartDataPoint[]>>('/analytics/admin/revenue');
      return await handleApiResponse<ChartDataPoint[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getAdminPaymentStats(): Promise<ChartDataPoint[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<ChartDataPoint[]>>('/analytics/admin/payment-stats');
      return await handleApiResponse<ChartDataPoint[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getAdminTopCustomers(limit: number = 10): Promise<TopCustomer[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<TopCustomer[]>>('/analytics/admin/top-customers', {
        params: { limit }
      });
      return await handleApiResponse<TopCustomer[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  }
};
