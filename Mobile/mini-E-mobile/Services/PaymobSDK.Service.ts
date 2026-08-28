import { Platform } from 'react-native';

export enum PaymentResultStatus {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export interface SavedBankCard {
  maskedPan: string;
  savedCardToken: string;
  creditCard?: any;
}

export interface PaymobPresentOptions {
  clientSecret: string;
  publicKey: string;
  savedBankCards?: SavedBankCard[];
  onSuccess: () => void;
  onFail: (message?: string) => void;
  onPending?: () => void;
}

let PaymobModule: any = null;
let PaymentResultEnum: any = null;

try {
  const paymobPkg = require('paymob-reactnative');
  PaymobModule = paymobPkg.default || paymobPkg;
  PaymentResultEnum = paymobPkg.PaymentResult || {
    SUCCESS: 0,
    FAIL: 1,
    PENDING: 2,
  };
} catch (e) {
  // Graceful fallback for environments where native module isn't compiled yet (e.g. Expo Go)
  PaymobModule = null;
}

export const PaymobSDKService = {
  isAvailable(): boolean {
    return !!PaymobModule && (Platform.OS === 'android' || Platform.OS === 'ios');
  },

  init(options?: { appName?: string; buttonBgColor?: string; buttonTextColor?: string }) {
    if (!this.isAvailable()) return;

    try {
      // Customize look & feel before presenting
      PaymobModule.setAppName(options?.appName || 'Koshk Store');
      PaymobModule.setButtonBackgroundColor(options?.buttonBgColor || '#000000');
      PaymobModule.setButtonTextColor(options?.buttonTextColor || '#FFFFFF');
      PaymobModule.setShowSaveCard(true);
      PaymobModule.setSaveCardDefault(true);
    } catch (err) {
      console.warn('Paymob SDK customization error:', err);
    }
  },

  presentPayment(options: PaymobPresentOptions) {
    const { clientSecret, publicKey, savedBankCards = [], onSuccess, onFail, onPending } = options;

    if (!this.isAvailable()) {
      onFail('Paymob Native SDK is only available in custom dev client or standalone build.');
      return;
    }

    try {
      this.init();

      // Listen for payment results
      PaymobModule.setSdkListener((status: any) => {
        if (
          status === PaymentResultEnum.SUCCESS ||
          status === 'SUCCESS' ||
          status === 0
        ) {
          onSuccess();
        } else if (
          status === PaymentResultEnum.FAIL ||
          status === 'FAIL' ||
          status === 1
        ) {
          onFail('Payment transaction failed or was cancelled.');
        } else if (
          status === PaymentResultEnum.PENDING ||
          status === 'PENDING' ||
          status === 2
        ) {
          if (onPending) {
            onPending();
          } else {
            onSuccess();
          }
        }
      });

      // Invoke native payment VC
      PaymobModule.presentPayVC(clientSecret, publicKey, savedBankCards);
    } catch (error: any) {
      console.error('Error invoking Paymob SDK:', error);
      onFail(error?.message || 'Failed to open Paymob payment interface');
    }
  },
};
