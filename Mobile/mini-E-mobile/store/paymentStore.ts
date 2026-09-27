import { create } from 'zustand';
import { PaymentService, SavedPaymentMethod } from '../Services/Payment.Service';

interface PaymentState {
  savedMethods: SavedPaymentMethod[];
  hasSavedMethods: boolean;
  loadingMethods: boolean;
  
  loadSavedMethods: () => Promise<void>;
  checkPaymentStatus: (orderId: string) => Promise<'paid' | 'failed' | 'pending' | string>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  savedMethods: [],
  hasSavedMethods: false,
  loadingMethods: false,

  loadSavedMethods: async () => {
    set({ loadingMethods: true });
    try {
      const methods = await PaymentService.getSavedMethods();
      set({ 
        savedMethods: methods, 
        hasSavedMethods: methods.length > 0,
        loadingMethods: false 
      });
    } catch (error) {
      set({ loadingMethods: false });
      console.error("Failed to load saved payment methods", error);
    }
  },

  checkPaymentStatus: async (orderId: string): Promise<'paid' | 'failed' | 'pending'> => {
    try {
      const res = await PaymentService.getPaymentStatus(orderId);
      if (res.status === 'paid' || res.status === 'failed' || res.status === 'pending') {
        return res.status;
      }
      return 'pending';
    } catch (error) {
      console.error("Failed to check payment status", error);
      return 'pending';
    }
  }
}));
