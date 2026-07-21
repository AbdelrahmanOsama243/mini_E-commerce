import { Product } from './product.model';

export interface CartItemWithProduct {
  productId: Product | string;
  quantity: number;
}

export interface CartModel {
  _id: string;
  userId: string;
  items: CartItemWithProduct[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  productId: string;
  quantity: number;
}

export interface RemoveFromCartPayload {
  productId: string;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  cart: CartModel;
}

export interface StockCheckResult {
  productId: string;
  available: boolean;
  requestedQuantity: number;
  currentStock: number;
  message?: string;
}
