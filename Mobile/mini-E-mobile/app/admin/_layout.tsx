import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useThemeContext';
import { AdminGuard } from '@/core/guard/AuthGuard/AuthGuard';

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <AdminGuard>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="add-product" />
      </Stack>
    </AdminGuard>
  );
}
