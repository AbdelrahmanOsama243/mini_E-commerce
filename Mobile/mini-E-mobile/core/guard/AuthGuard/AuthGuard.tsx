import React, { useEffect, useState, ReactNode } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { AuthService, User } from '../../../Services/Auth.Service';
import { TokenStorage } from '../../../Services/TokenStorage';

// ─── AuthGuard ───────────────────────────────────────────────────────────────

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Protects routes that require an authenticated user.
 * Redirects to the login screen if the user is not logged in.
 *
 * Usage (wrap around protected content in a layout):
 *   <AuthGuard>{children}</AuthGuard>
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      if (!accessToken) {
        setIsLoggedIn(false);
        return;
      }
      // Validate token by calling getMe — if it fails, token is expired/invalid
      await AuthService.getMe(accessToken);
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    if (isChecking) return;

    if (!isLoggedIn) {
      // Redirect to login, passing the current path as returnUrl
      const returnUrl = `/${segments.join('/')}`;
      router.replace({
        pathname: '/login',
        params: { returnUrl },
      });
    }
  }, [isChecking, isLoggedIn, segments, router]);

  if (isChecking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}

// ─── AdminGuard ──────────────────────────────────────────────────────────────

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Protects routes that require an admin user.
 * Redirects to the home screen if the user is not an admin.
 *
 * Usage (wrap around admin-only content in a layout):
 *   <AdminGuard>{children}</AdminGuard>
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { accessToken } = await TokenStorage.getStoredTokens();
      if (!accessToken) {
        setIsAdmin(false);
        return;
      }
      // Validate against backend in case role was changed server-side
      const user = await AuthService.getMe(accessToken);
      setIsAdmin(user?.role === 'admin');
    } catch {
      setIsAdmin(false);
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    if (isChecking) return;

    if (!isAdmin) {
      // Redirect to home page
      router.replace('/');
    }
  }, [isChecking, isAdmin, router]);

  if (isChecking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
