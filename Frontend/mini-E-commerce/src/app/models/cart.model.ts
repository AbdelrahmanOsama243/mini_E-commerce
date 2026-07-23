import { Product } from './product.model';

export interface CartItem {
  _id?: string;
  productId: Product;
  quantity: number;
}

export interface Cart {
  _id?: string;
  userId: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data: Cart;
}
