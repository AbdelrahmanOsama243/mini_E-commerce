// ─── Cart sub-documents ───────────────────────────────────────────────────────
// Mirrors Carts.Model.js — items are populated with Product on GET

import { Product } from './iproduct';

export interface CartItem {
  _id: string;
  productId: Product;   // always populated via CartRepo.getCartByUserId
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface AddItemPayload {
  productId: string;
  quantity: number;
}

export interface UpdateItemPayload {
  quantity: number;
}

// ─── API responses ────────────────────────────────────────────────────────────
// All cart endpoints use sendSuccess → { success, message, data }

export interface CartResponse {
  success: boolean;
  message: string;
  data: Cart;
}
