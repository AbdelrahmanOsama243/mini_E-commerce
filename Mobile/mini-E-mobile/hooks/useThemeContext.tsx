import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Shadows, type ThemeColors } from '../constants/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  shadows: typeof Shadows.light;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  isLoaded: boolean;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function KoshkThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setIsLoaded(true);
      return;
    }

    AsyncStorage.getItem('themePreference')
      .then((stored) => {
        if (stored === 'dark' || stored === 'light') {
          setMode(stored as ThemeMode);
        } else {
          setMode(systemScheme === 'dark' ? 'dark' : 'light');
        }
        setIsLoaded(true);
      })
      .catch(() => {
        setMode(systemScheme === 'dark' ? 'dark' : 'light');
        setIsLoaded(true);
      });
  }, [initialMode, systemScheme]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const newMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem('themePreference', newMode);
      return newMode;
    });
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    AsyncStorage.setItem('themePreference', newMode);
    setMode(newMode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: Colors[mode],
      shadows: Shadows[mode],
      isDark: mode === 'dark',
      toggleTheme,
      setTheme,
      isLoaded,
    }),
    [mode, toggleTheme, setTheme, isLoaded],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a KoshkThemeProvider');
  }
  return context;
}

export default KoshkThemeProvider;
