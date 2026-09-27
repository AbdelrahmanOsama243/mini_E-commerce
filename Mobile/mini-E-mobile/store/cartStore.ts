import { create } from 'zustand';
import { CartService, Cart, AddToCartPayload } from '../Services/Cart.Service';
import { TokenStorage } from '../Services/TokenStorage';
import { Product } from '../Services/Product.Service';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  updating: string | null;
  loadCart: () => Promise<void>;
  addItem: (payload: AddToCartPayload & { product?: Product }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  loading: false,
  updating: null,

  loadCart: async () => {
    set({ loading: true });
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      const cartData = await CartService.getCart(accessToken || undefined);
      set({ cart: cartData });
    } catch (error) {
      set({ cart: null });
      console.warn('Failed to load cart:', error);
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (payload) => {
    const { accessToken } = await TokenStorage.getStoredTokens();
    const currentCart = useCartStore.getState().cart;

    // Optimistic update for authenticated users
    if (accessToken && currentCart) {
      const existingItem = currentCart.items.find(i => {
        const pid = typeof i.productId === 'string' ? i.productId : i.productId?._id;
        return pid === payload.productId;
      });
      let optimisticCart;
      if (existingItem) {
        optimisticCart = {
          ...currentCart,
          items: currentCart.items.map(i => {
            const pid = typeof i.productId === 'string' ? i.productId : i.productId?._id;
            return pid === payload.productId ? { ...i, quantity: i.quantity + payload.quantity } : i;
          }),
        };
      } else {
        optimisticCart = {
          ...currentCart,
          items: [...currentCart.items, {
            _id: Date.now().toString(),
            productId: payload.product || payload.productId,
            quantity: payload.quantity,
          }],
        };
      }
      set({ cart: optimisticCart });
    }

    set({ loading: true });
    try {
      const updatedCart = await CartService.addItemToCart(payload, accessToken || undefined);
      set({ cart: updatedCart });
    } catch (error) {
      // Rollback on failure
      if (accessToken && currentCart) {
        set({ cart: currentCart });
      }
      console.error('Failed to add item:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity < 1) return;
    set({ updating: itemId });
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      const updatedCart = await CartService.updateCartItemQuantity(
        itemId,
        { quantity },
        accessToken || undefined
      );
      set({ cart: updatedCart });
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    } finally {
      set({ updating: null });
    }
  },

  removeItem: async (itemId) => {
    set({ updating: itemId });
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      const updatedCart = await CartService.removeItemFromCart(itemId, accessToken || undefined);
      set({ cart: updatedCart });
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    } finally {
      set({ updating: null });
    }
  },

  clearCart: async () => {
    set({ loading: true });
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      const updatedCart = await CartService.clearCart(accessToken || undefined);
      set({ cart: updatedCart });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
