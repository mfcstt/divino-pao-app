import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="catalog" />
      <Stack.Screen name="product-form" />
      <Stack.Screen name="production" />
      <Stack.Screen name="ingredients" />
    </Stack>
  );
}
