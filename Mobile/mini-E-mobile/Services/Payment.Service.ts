import axiosInstance from '../core/interceptors/HttpTokenInterceptor/HttpTokenInterceptor';
import { handleApiResponse, handleCentralError, ApiResponse } from '../Utils/errorHandler';

export type PaymentMethodType = 'card' | 'wallet' | 'kiosk' | 'valu' | 'cod';

export interface BillingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  street?: string;
}

export interface InitiatePaymentPayload {
  paymentMethod: Exclude<PaymentMethodType, 'cod'>;
  shippingAddress: string;
  billingData: BillingData;
  walletPhone?: string;
}

export interface InitiateCODPayload {
  shippingAddress: string;
  billingData?: Partial<BillingData>;
}

export interface PaymentInitiateResponse {
  paymentToken?: string;
  clientSecret?: string;
  publicKey?: string;
  orderId: string;
  iframeUrl?: string;
  redirectUrl?: string;
  fawryReferenceNumber?: number;
}

export interface PaymentStatusResponse {
  status: string;
  orderStatus: string;
  transactionId?: string;
  fawryRef?: string;
}

export interface SavedPaymentMethod {
  _id: string;
  type: 'card' | 'wallet';
  lastFourDigits?: string;
  cardBrand?: string;
  walletPhone?: string;
  isDefault: boolean;
}

export interface RefundPayload {
  orderId: string;
  amountCents?: number;
}

export const PaymentService = {
  async initiatePayment(payload: InitiatePaymentPayload): Promise<PaymentInitiateResponse> {
    try {
      const response = await axiosInstance.post<ApiResponse<PaymentInitiateResponse>>('/payment/initiate', payload);
      return await handleApiResponse<PaymentInitiateResponse>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async initiateCOD(payload: InitiateCODPayload): Promise<any> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payment/cod', payload);
      return await handleApiResponse<any>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getPaymentStatus(orderId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await axiosInstance.get<ApiResponse<PaymentStatusResponse>>(`/payment/status/${orderId}`);
      return await handleApiResponse<PaymentStatusResponse>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async getSavedMethods(): Promise<SavedPaymentMethod[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<SavedPaymentMethod[]>>('/payment/methods');
      return await handleApiResponse<SavedPaymentMethod[]>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async refundPayment(payload: RefundPayload): Promise<any> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payment/refund', payload);
      return await handleApiResponse<any>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async recordTransaction(payload: { orderId: string; transactionId?: string; paymobOrderId?: string }): Promise<any> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payment/record-transaction', payload);
      return await handleApiResponse<any>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  async voidPayment(orderId: string): Promise<any> {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payment/void', { orderId });
      return await handleApiResponse<any>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  }
};

