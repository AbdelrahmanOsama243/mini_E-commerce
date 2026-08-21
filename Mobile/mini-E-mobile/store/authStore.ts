import { create } from 'zustand';
import { AuthService, User, LoginPayload, RegisterPayload } from '../Services/Auth.Service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initAuth: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  initAuth: async () => {
    set({ loading: true });
    try {
      const session = await AuthService.initSession();
      if (session) {
        set({ user: session.user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  login: async (payload) => {
    set({ loading: true });
    try {
      const authData = await AuthService.login(payload);
      set({ user: authData.user, isAuthenticated: true });
    } catch (error) {
      set({ user: null, isAuthenticated: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      await AuthService.register(payload);
      // Registration successful, usually requires login next
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await AuthService.logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      set({ loading: false });
    }
  }
}));
