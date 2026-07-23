import { Product } from './product.model';
import { User } from './user.model';

export interface OrderItem {
  productId?: Product | null;
  quantity: number;
  priceAtPurchase: number;
  _id?: string;
}

export interface Order {
  _id?: string;
  userId: User | string; // Populated in admin views or single order queries
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  shippingAddress: string;
  createdAt?: string;
  updatedAt?: string;
}

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
