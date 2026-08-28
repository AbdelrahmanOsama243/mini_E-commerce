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
  walletPhone?: string; // required for wallet
}

export interface InitiateCODPayload {
  shippingAddress: string;
  billingData?: Partial<BillingData>;
}

export interface RefundPayload {
  orderId: string;
  amountCents?: number;
}

export interface PaymentInitiateResponse {
  success: boolean;
  message: string;
  data: {
    paymentToken?: string;
    orderId: string;
    iframeUrl?: string;         // card / valu
    redirectUrl?: string;       // wallet
    fawryReferenceNumber?: number; // kiosk
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    orderStatus: string;
    transactionId?: string;
    fawryRef?: string;
  };
}

export interface SavedPaymentMethod {
  _id: string;
  type: 'card' | 'wallet';
  lastFourDigits?: string;
  cardBrand?: string;
  walletPhone?: string;
  isDefault: boolean;
}

export interface SavedMethodsResponse {
  success: boolean;
  message: string;
  data: SavedPaymentMethod[];
}
