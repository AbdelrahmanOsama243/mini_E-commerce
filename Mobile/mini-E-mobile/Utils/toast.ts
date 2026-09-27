import React from 'react';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { StyleSheet } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  position?: 'top' | 'bottom';
  visibilityTime?: number;
  autoHide?: boolean;
  onPress?: () => void;
  onShow?: () => void;
  onHide?: () => void;
}

/**
 * Extracts a user-friendly error message from any error type
 * Handles AppError, AxiosError, standard Error, and generic objects
 */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  if (typeof error === 'object') {
    const err = error as Record<string, any>;

    // Check for nested response data from axios / API
    if (err.response?.data?.message && typeof err.response.data.message === 'string') {
      return err.response.data.message;
    }

    if (err.data?.message && typeof err.data.message === 'string') {
      return err.data.message;
    }

    if (err.message && typeof err.message === 'string') {
      return err.message;
    }

    if (err.error && typeof err.error === 'string') {
      return err.error;
    }
  }

  return fallback;
}

/**
 * Show a Success Toast notification
 */
export function showSuccess(title: string, message?: string, options?: ToastOptions) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: options?.position ?? 'top',
    visibilityTime: options?.visibilityTime ?? 3500,
    autoHide: options?.autoHide ?? true,
    topOffset: 55,
    onPress: options?.onPress,
    onShow: options?.onShow,
    onHide: options?.onHide,
  });
}

/**
 * Show an Error Toast notification
 */
export function showError(title: string, errorOrMessage?: unknown, options?: ToastOptions) {
  const message = extractErrorMessage(errorOrMessage);
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: options?.position ?? 'top',
    visibilityTime: options?.visibilityTime ?? 4000,
    autoHide: options?.autoHide ?? true,
    topOffset: 55,
    onPress: options?.onPress,
    onShow: options?.onShow,
    onHide: options?.onHide,
  });
}

/**
 * Show an Informational Toast notification
 */
export function showInfo(title: string, message?: string, options?: ToastOptions) {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: options?.position ?? 'top',
    visibilityTime: options?.visibilityTime ?? 3500,
    autoHide: options?.autoHide ?? true,
    topOffset: 55,
    onPress: options?.onPress,
    onShow: options?.onShow,
    onHide: options?.onHide,
  });
}

/**
 * Show a Warning Toast notification
 */
export function showWarning(title: string, message?: string, options?: ToastOptions) {
  Toast.show({
    type: 'warning',
    text1: title,
    text2: message,
    position: options?.position ?? 'top',
    visibilityTime: options?.visibilityTime ?? 4000,
    autoHide: options?.autoHide ?? true,
    topOffset: 55,
    onPress: options?.onPress,
    onShow: options?.onShow,
    onHide: options?.onHide,
  });
}

/**
 * Hide any active Toast immediately
 */
export function hideToast() {
  Toast.hide();
}

/**
 * Custom Toast Layout and Styling configuration
 */
export const toastConfig: ToastConfig = {
  success: (props: any) =>
    React.createElement(BaseToast, {
      ...props,
      style: styles.successContainer,
      contentContainerStyle: styles.contentContainer,
      text1Style: styles.text1,
      text2Style: styles.text2,
      text1NumberOfLines: 1,
      text2NumberOfLines: 2,
    }),
  error: (props: any) =>
    React.createElement(ErrorToast, {
      ...props,
      style: styles.errorContainer,
      contentContainerStyle: styles.contentContainer,
      text1Style: styles.text1,
      text2Style: styles.text2,
      text1NumberOfLines: 1,
      text2NumberOfLines: 3,
    }),
  info: (props: any) =>
    React.createElement(BaseToast, {
      ...props,
      style: styles.infoContainer,
      contentContainerStyle: styles.contentContainer,
      text1Style: styles.text1,
      text2Style: styles.text2,
      text1NumberOfLines: 1,
      text2NumberOfLines: 2,
    }),
  warning: (props: any) =>
    React.createElement(BaseToast, {
      ...props,
      style: styles.warningContainer,
      contentContainerStyle: styles.contentContainer,
      text1Style: styles.text1,
      text2Style: styles.text2,
      text1NumberOfLines: 1,
      text2NumberOfLines: 2,
    }),
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text1: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  text2: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  successContainer: {
    borderLeftColor: '#10B981',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 'auto',
    minHeight: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    width: '92%',
  },
  errorContainer: {
    borderLeftColor: '#EF4444',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 'auto',
    minHeight: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    width: '92%',
  },
  infoContainer: {
    borderLeftColor: '#3B82F6',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 'auto',
    minHeight: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    width: '92%',
  },
  warningContainer: {
    borderLeftColor: '#F59E0B',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 'auto',
    minHeight: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    width: '92%',
  },
});

export const AppToast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  hide: hideToast,
  config: toastConfig,
};

export default AppToast;
