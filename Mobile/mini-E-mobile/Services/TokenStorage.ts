import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user_data',
} as const;

export const TokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string, user?: any): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
    } catch (error) {
      console.warn('Failed to save auth tokens:', error);
    }
  },

  async getStoredTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      return { accessToken, refreshToken };
    } catch (error) {
      console.warn('Failed to read auth tokens from SecureStore:', error);
      return { accessToken: null, refreshToken: null };
    }
  },

  async getStoredUser(): Promise<any | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.warn('Failed to read user data from AsyncStorage:', error);
      return null;
    }
  },

  async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.warn('Failed to clear auth session:', error);
    }
  },
};
