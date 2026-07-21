// ─── Order sub-documents ──────────────────────────────────────────────────────
// Mirrors orders.Model.js — items.productId is populated on GET endpoints

import { Product } from './iproduct';
import { UserProfile } from './iauth';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

export interface OrderItem {
  _id: string;
  productId: Product;       // populated on getOrders / getOrderById
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  _id: string;
  userId: UserProfile;      // populated (admin view) or just the id string (user view)
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  shippingAddress: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

// ─── API responses ────────────────────────────────────────────────────────────
// All order endpoints use sendSuccess → { success, message, data }

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
}
