import axios from 'axios';
import { TokenStorage } from '../../../Services/TokenStorage';
import { BASE_URL } from '../../../constants/baseUrl';

// ─── Configuration ───────────────────────────────────────────────────────────

/** Endpoints that should NOT receive an Authorization header. */
const PUBLIC_ENDPOINTS = [
  '/users/login',
  '/users/register',
  '/users/forget-password',
  '/users/resend-verification',
  '/users/refresh',
];

function isPublicEndpoint(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((ep) => url.includes(ep));
}

// ─── Refresh-Lock (prevents concurrent refresh calls) ────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const { refreshToken } = await TokenStorage.getStoredTokens();
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${BASE_URL}/users/refresh`, { refreshToken });
      
      const newAccess = response.data?.data?.accessToken;
      const newRefresh = response.data?.data?.refreshToken;
      
      if (newAccess && newRefresh) {
        const user = await TokenStorage.getStoredUser();
        await TokenStorage.saveTokens(newAccess, newRefresh, user);
        return newAccess;
      }
      throw new Error('Invalid refresh response');
    } catch {
      await TokenStorage.clearSession();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Axios Instance ──────────────────────────────────────────────────────────

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  async (config) => {
    // Disable HTTP-level caching (ETag/304) for mobile app
    // Redis server-side caching stays fully functional
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['If-None-Match'] = '';
    config.headers['ngrok-skip-browser-warning'] = 'true';

    const shouldAttachToken = !config.skipAuth && !isPublicEndpoint(config.url);

    if (shouldAttachToken) {
      try {
        const { accessToken } = await TokenStorage.getStoredTokens();
        // Only set the token if one wasn't explicitly provided in the request
        if (accessToken && !config.headers['Authorization'] && !config.headers.Authorization) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
      } catch {
        // No token available — proceed without auth header
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const shouldAttachToken = !originalRequest.skipAuth && !isPublicEndpoint(originalRequest.url);

    if (error.response?.status === 401 && shouldAttachToken && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // Retry the request with the new token
        return axiosInstance(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// Add custom typing for skipAuth
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

export default axiosInstance;