import { handleApiResponse, handleCentralError, AppError, ApiResponse } from '../Utils/errorHandler';
import { CartService } from './Cart.Service';
import axiosInstance from '../core/interceptors/HttpTokenInterceptor/HttpTokenInterceptor';
import { AxiosResponse } from 'axios';
import { TokenStorage } from './TokenStorage';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  isVerified?: boolean;
  themePreference?: 'light' | 'dark' | 'system';
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  themePreference?: 'light' | 'dark' | 'system';
}

/** Reuses RegisterPayload since the fields are identical. */
export type ResendVerificationPayload = RegisterPayload;


// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * Resolve an auth token: use the explicitly passed token, or fall back to the
 * stored access token. Throws AppError(401) if neither is available.
 */
async function resolveAuthToken(token?: string): Promise<string> {
  if (token) return token;

  const stored = await TokenStorage.getStoredTokens();
  if (stored.accessToken) return stored.accessToken;

  throw new AppError('User not authenticated', 401);
}

/**
 * Persist an updated user object alongside the current stored tokens.
 * No-op if tokens are missing (avoids writing a partial session).
 */
async function updateStoredUser(user: User): Promise<void> {
  const { accessToken, refreshToken } = await TokenStorage.getStoredTokens();
  if (accessToken && refreshToken) {
    await TokenStorage.saveTokens(accessToken, refreshToken, user);
  }
}

// ─── Auth Service ────────────────────────────────────────────────────────────

export const AuthService = {
  // ── Session Lifecycle ────────────────────────────────────────────────────

  /**
   * Restore a user session from AsyncStorage on app startup.
   * Validates the stored access token via getMe(); if expired, attempts a
   * token refresh. Returns null and clears storage if recovery fails.
   */
  async initSession(): Promise<{ user: User; accessToken: string } | null> {
    const self = AuthService;
    try {
      const { accessToken, refreshToken } = await TokenStorage.getStoredTokens();

      if (!accessToken) return null;

      try {
        const user = await self.getMe(accessToken);
        return { user, accessToken };
      } catch {
        // Access token likely expired — attempt refresh
        if (refreshToken) {
          try {
            const refreshed = await self.refreshTokens(refreshToken);
            if (refreshed?.accessToken) {
              const user = await self.getMe(refreshed.accessToken);
              return { user, accessToken: refreshed.accessToken };
            }
          } catch (refreshError) {
            console.warn('Token refresh failed during session init:', refreshError);
          }
        }

        await TokenStorage.clearSession();
        return null;
      }
    } catch (error) {
      await TokenStorage.clearSession();
      return null;
    }
  },

  // ── Auth Endpoints ───────────────────────────────────────────────────────

  /**
   * Register a new user.
   */
  async register(payload: RegisterPayload): Promise<null> {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>('/users/register', payload);
      return await handleApiResponse<null>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Login user, persist session to AsyncStorage, and return auth data.
   */
  async login(payload: LoginPayload): Promise<AuthResponseData> {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponseData>>('/users/login', payload);

      const authData = await handleApiResponse<AuthResponseData>(response);

      if (authData?.accessToken && authData?.refreshToken) {
        await TokenStorage.saveTokens(authData.accessToken, authData.refreshToken, authData.user);
        
        // Sync Guest Cart
        try {
          const localCart = await CartService.getCart();
          if (localCart && localCart.items && localCart.items.length > 0) {
            const itemsToMerge = localCart.items.map(item => ({
              productId: typeof item.productId === 'string' ? item.productId : item.productId._id,
              quantity: item.quantity
            }));
            await CartService.mergeCart(itemsToMerge, authData.accessToken);
            await CartService.clearCart(); // Pass nothing to clear AsyncStorage
          }
        } catch (mergeError) {
          console.warn('Failed to merge guest cart on login:', mergeError);
        }
      }

      return authData;
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Refresh tokens via the backend and update AsyncStorage.
   */
  async refreshTokens(
    providedRefreshToken?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const tokenToUse = providedRefreshToken ?? (await TokenStorage.getStoredTokens()).refreshToken;

      if (!tokenToUse) {
        throw new AppError('No refresh token available', 401);
      }

      const response = await axiosInstance.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/users/refresh', { refreshToken: tokenToUse });

      const data = await handleApiResponse<{ accessToken: string; refreshToken: string }>(response);

      if (data?.accessToken && data?.refreshToken) {
        const storedUser = await TokenStorage.getStoredUser();
        await TokenStorage.saveTokens(data.accessToken, data.refreshToken, storedUser ?? undefined);
      }

      return data;
    } catch (error) {
      // Only clear session if the server explicitly rejected the token (401)
      // Don't clear on network errors — user might just have bad connectivity
      const appError = handleCentralError(error);
      if (appError.statusCode === 401) {
        await TokenStorage.clearSession();
      }
      throw appError;
    }
  },

  // ── User Profile ─────────────────────────────────────────────────────────

  /**
   * Get the current user's profile. Optionally pass a token; otherwise the
   * stored token is used.
   */
  async getMe(token?: string): Promise<User> {
    try {
      const authToken = await resolveAuthToken(token);

      const response = await axiosInstance.get<ApiResponse<User>>('/users/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const user = await handleApiResponse<User>(response);

      if (user) await updateStoredUser(user);

      return user;
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Update the current user's profile.
   */
  async updateUserProfile(payload: UpdateProfilePayload, token?: string): Promise<User> {
    try {
      const authToken = await resolveAuthToken(token);

      const response = await axiosInstance.put<ApiResponse<User>>('/users/me', payload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const updatedUser = await handleApiResponse<User>(response);

      if (updatedUser) await updateStoredUser(updatedUser);

      return updatedUser;
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────

  /**
   * Logout: invalidate session on the backend and clear AsyncStorage.
   * Local session is always cleared, even if the network call fails.
   */
  async logout(refreshToken?: string, token?: string): Promise<void> {
    try {
      const storedTokens = await TokenStorage.getStoredTokens();
      const authToken = token ?? storedTokens.accessToken;
      const refToken = refreshToken ?? storedTokens.refreshToken;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      await axiosInstance.post('/users/logout', { refreshToken: refToken }, { headers });
    } catch (error) {
      // Network failure is non-critical — we still clear the local session below.
      console.warn('Logout network call failed (local session will still be cleared):', error);
    } finally {
      await TokenStorage.clearSession();
    }
  },

  // ── Password & Verification ──────────────────────────────────────────────

  /**
   * Request a password-reset email.
   */
  async forgetPassword(email: string): Promise<null> {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>('/users/forget-password', { email });
      return await handleApiResponse<null>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Reset password via token.
   */
  async resetPassword(token: string, password: string): Promise<null> {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>(`/users/reset-password/${token}`, { password });
      return await handleApiResponse<null>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Resend the email-verification message.
   */
  async resendVerification(payload: ResendVerificationPayload): Promise<null> {
    try {
      const response = await axiosInstance.post<ApiResponse<null>>('/users/resend-verification', payload);
      return await handleApiResponse<null>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },

  /**
   * Verify an email address via token.
   */
  async verifyEmail(token: string): Promise<null> {
    try {
      const response = await axiosInstance.get<ApiResponse<null>>(`/users/verify-email/${token}`);
      return await handleApiResponse<null>(response);
    } catch (error) {
      throw handleCentralError(error);
    }
  },
};
