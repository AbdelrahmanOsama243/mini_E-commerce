import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/useThemeContext';
import { Borders, Typography } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const cart = useCartStore((state) => state.cart);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: Borders.brutalist,
          borderTopColor: colors.tabBarBorder,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamilySemiBold,
          fontSize: Typography.sizes.xs,
          letterSpacing: Typography.letterSpacing.wide,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIcon, { borderColor: colors.primary }] : undefined}>
              <IconSymbol size={24} name="house.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIcon, { borderColor: colors.primary }] : undefined}>
              <IconSymbol size={24} name="square.grid.2x2.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cart?.items?.length ? cart.items.length : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: '#fff' },
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIcon, { borderColor: colors.primary }] : undefined}>
              <IconSymbol size={24} name="cart.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIcon, { borderColor: colors.primary }] : undefined}>
              <IconSymbol size={24} name="list.bullet.rectangle.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIcon, { borderColor: colors.primary }] : undefined}>
              <IconSymbol size={24} name="person.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          href: null, // Hidden from tab bar
          title: 'DASHBOARD',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIcon: {
    borderBottomWidth: 3,
    paddingBottom: 2,
  },
});
