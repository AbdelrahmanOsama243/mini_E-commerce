import { Platform } from 'react-native';
import Constants from 'expo-constants';

let baseURL: string;

// Extract the computer's IP address from Expo's connection info
const debuggerHost = Constants.expoConfig?.hostUri;
let computerIp = '';

if (debuggerHost) {
  computerIp = debuggerHost.split(':')[0];
}

// Priority 1: Use explicitly defined API URL from .env (e.g. EXPO_PUBLIC_API_URL)
// This is used for EAS Build production/preview builds
if (process.env.EXPO_PUBLIC_API_URL) {
  baseURL = process.env.EXPO_PUBLIC_API_URL;
}
// Priority 2: Use Expo's LAN IP if available (Expo Go on same Wi-Fi)
else if (computerIp) {
  baseURL = `http://${computerIp}:3000/api`;
}
// Priority 3: Fallbacks for emulators/web (development only)
else {
  baseURL = Platform.select({
    android: 'http://10.0.2.2:3000/api', // Standard Android Emulator loopback
    ios: 'http://localhost:3000/api', 
    default: 'http://localhost:3000/api', 
  }) as string;
}

if (__DEV__) {
  console.log('[Mobile API] Base URL:', baseURL);
}

export const BASE_URL = baseURL;