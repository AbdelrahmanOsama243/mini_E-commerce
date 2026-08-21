import { BASE_URL } from '../constants/baseUrl';
import { handleApiResponse, handleCentralError, ApiResponse } from '../Utils/errorHandler';
import { Product } from './Product.Service';
import { User } from './Auth.Service';
import axiosInstance from '../core/interceptors/HttpTokenInterceptor/HttpTokenInterceptor';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | string;

export interface OrderItem {
  _id?: string;
  productId: string | Product;
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  _id: string;
  userId: string | User;
  items: OrderItem[];
  shippingAddress: string;
  totalPrice: number;
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  shippingAddress: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

export const OrderService = {
  /**
   * Create a new order from current user's active cart
   */
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    try {
      const response = await axiosInstance.post<ApiResponse<Order>>('/orders', payload);

      return await handleApiResponse<Order>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Get list of orders (returns current user's orders, or all orders if all=true and user is admin)
   */
  async getOrders(all: boolean = false): Promise<Order[]> {
    try {
      const queryString = all ? '?all=true' : '';
      const response = await axiosInstance.get<ApiResponse<Order[]>>(`/orders${queryString}`);

      return await handleApiResponse<Order[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Get single order details by ID
   */
  async getOrderById(id: string): Promise<Order> {
    try {
      const response = await axiosInstance.get<ApiResponse<Order>>(`/orders/${id}`);

      return await handleApiResponse<Order>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Update order status (Requires Admin Token)
   */
  async updateOrderStatus(
    id: string,
    payload: UpdateOrderStatusPayload
  ): Promise<Order> {
    try {
      const response = await axiosInstance.put<ApiResponse<Order>>(`/orders/${id}/status`, payload);

      return await handleApiResponse<Order>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },
};
