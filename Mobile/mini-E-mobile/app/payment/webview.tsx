import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../hooks/useThemeContext";
import { usePaymentStore } from "../../store/paymentStore";

export default function PaymentWebViewScreen() {
  const { url, orderId } = useLocalSearchParams<{ url: string; orderId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { checkPaymentStatus } = usePaymentStore();
  const navigatedRef = useRef(false);

  const navigateToResult = (result: 'success' | 'failed') => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace(result === 'success' ? "../payment/success" : "../payment/failed");
  };

  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      if (navigatedRef.current) {
        clearInterval(interval);
        return;
      }
      const status = await checkPaymentStatus(orderId);
      if (status === 'paid' || status === 'processing') {
        clearInterval(interval);
        navigateToResult('success');
      } else if (status === 'failed' || status === 'payment_failed') {
        clearInterval(interval);
        navigateToResult('failed');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (!url) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState={true}
        onNavigationStateChange={(navState) => {
          const currentUrl = navState.url || '';
          if (currentUrl.includes('/payment/success') || currentUrl.includes('success=true')) {
            navigateToResult('success');
          } else if (currentUrl.includes('/payment/failed') || currentUrl.includes('success=false')) {
            navigateToResult('failed');
          }
        }}
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  loading: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
