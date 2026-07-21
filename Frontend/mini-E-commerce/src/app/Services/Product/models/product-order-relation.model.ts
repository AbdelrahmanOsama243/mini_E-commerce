import { Product } from './product.model';

export interface OrderItemWithProduct {
  productId: Product | string;
  quantity: number;
  priceAtPurchase: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'paid' | 'cancelled';

export interface OrderModel {
  _id: string;
  userId: string;
  items: OrderItemWithProduct[];
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  items?: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: OrderModel;
}

export interface OrderListResponse {
  success: boolean;
  data: OrderModel[];
}
