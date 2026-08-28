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
if (process.env.EXPO_PUBLIC_API_URL) {
  baseURL = process.env.EXPO_PUBLIC_API_URL;
} 
// Priority 2: Use Expo's LAN IP if available (Expo Go / Dev Client)
else if (computerIp) {
  baseURL = `http://${computerIp}:3000/api`;
} 
// Priority 3: Fallbacks for emulators/web
else {
  baseURL = Platform.select({
    android: 'http://10.0.2.2:3000/api', // Standard Android Emulator loopback
    ios: 'http://localhost:3000/api', 
    default: 'http://localhost:3000/api', 
  }) as string;
}

// NGROK_OVERRIDE
baseURL = 'https://retype-pesky-prowling.ngrok-free.dev/api';
export const BASE_URL = baseURL;