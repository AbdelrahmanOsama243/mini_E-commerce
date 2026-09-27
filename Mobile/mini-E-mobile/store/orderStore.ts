import { create } from 'zustand';
import { OrderService, Order } from '../Services/Order.Service';
import { TokenStorage } from '../Services/TokenStorage';
import { useAuthStore } from './authStore';

interface OrderState {
  orders: Order[];
  loading: boolean;
  loadOrders: (isAdminOverride?: boolean) => Promise<void>;
  setOrders: (orders: Order[]) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  loading: false,

  loadOrders: async (isAdminOverride?: boolean) => {
    set({ loading: true });
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      if (!accessToken) {
        set({ orders: [], loading: false });
        return;
      }
      const user = useAuthStore.getState().user;
      const isAdmin = isAdminOverride ?? (user?.role === 'admin');
      const data = await OrderService.getOrders(isAdmin);
      set({ orders: data || [] });
    } catch (error) {
      console.warn('Failed to load orders:', error);
      // Don't clear orders on error — keep existing data visible
    } finally {
      set({ loading: false });
    }
  },

  setOrders: (orders) => set({ orders }),
}));
