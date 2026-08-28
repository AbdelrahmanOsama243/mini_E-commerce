import {
  handleApiResponse,
  handleCentralError,
  ApiResponse,
} from "../Utils/errorHandler";
import { Product } from "./Product.Service";
import axiosInstance from "../core/interceptors/HttpTokenInterceptor/HttpTokenInterceptor";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_CART_KEY = "@guest_cart";

export interface CartItem {
  _id: string;
  productId: string | Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export const CartService = {
  /**
   * Fetch the current user's cart
   */
  async getCart(token?: string): Promise<Cart> {
    if (!token) {
      const localCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (localCartStr) {
        return JSON.parse(localCartStr);
      }
      return { _id: "guest_cart", userId: "", items: [] };
    }

    try {
      const response = await axiosInstance.get<ApiResponse<Cart>>("/cart");
      return await handleApiResponse<Cart>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Add an item to the cart
   */
  async addItemToCart(
    payload: AddToCartPayload & { product?: Product },
    token?: string,
  ): Promise<Cart> {
    if (!token) {
      const localCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
      let cart: Cart = localCartStr
        ? JSON.parse(localCartStr)
        : { _id: "guest_cart", userId: "", items: [] };

      const existingItem = cart.items.find((i) =>
        typeof i.productId === "string"
          ? i.productId === payload.productId
          : i.productId._id === payload.productId,
      );

      if (existingItem) {
        existingItem.quantity += payload.quantity;
      } else {
        // For local cart to render, we store the full product if passed in
        cart.items.push({
          _id: Date.now().toString() + Math.random().toString().slice(2, 6),
          productId: payload.product ? payload.product : payload.productId,
          quantity: payload.quantity,
        });
      }

      await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
      return cart;
    }

    try {
      const response = await axiosInstance.post<ApiResponse<Cart>>("/cart", {
        productId: payload.productId,
        quantity: payload.quantity,
      });
      return await handleApiResponse<Cart>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Update item quantity in the cart
   */
  async updateCartItemQuantity(
    itemId: string,
    payload: UpdateCartItemPayload,
    token?: string,
  ): Promise<Cart> {
    if (!token) {
      const localCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (localCartStr) {
        let cart: Cart = JSON.parse(localCartStr);
        const existingItem = cart.items.find((i) => i._id === itemId);
        if (existingItem) {
          existingItem.quantity = payload.quantity;
          await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
        }
        return cart;
      }
      return { _id: "guest_cart", userId: "", items: [] };
    }

    try {
      const response = await axiosInstance.put<ApiResponse<Cart>>(
        `/cart/${itemId}`,
        payload,
      );
      return await handleApiResponse<Cart>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Remove a single item from the cart by item ID
   */
  async removeItemFromCart(itemId: string, token?: string): Promise<Cart> {
    if (!token) {
      const localCartStr = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (localCartStr) {
        let cart: Cart = JSON.parse(localCartStr);
        cart.items = cart.items.filter((i) => i._id !== itemId);
        await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
        return cart;
      }
      return { _id: "guest_cart", userId: "", items: [] };
    }

    try {
      const response = await axiosInstance.delete<ApiResponse<Cart>>(
        `/cart/${itemId}`,
      );
      return await handleApiResponse<Cart>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Clear all items from the cart
   */
  async clearCart(token?: string): Promise<Cart> {
    if (!token) {
      await AsyncStorage.removeItem(GUEST_CART_KEY);
      return { _id: "guest_cart", userId: "", items: [] };
    }

    try {
      const response = await axiosInstance.delete<ApiResponse<Cart>>("/cart");
      return await handleApiResponse<Cart>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Merge local guest cart into backend cart
   */
  async mergeCart(
    items: { productId: string; quantity: number }[],
    token?: string,
  ): Promise<Cart> {
    try {
      const response = await axiosInstance.post<ApiResponse<Cart>>(
        "/cart/merge",
        { items },
      );
      return await handleApiResponse<Cart>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },
};
