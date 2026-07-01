import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChefHat, Croissant } from 'lucide-react-native';

export default function AdminLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#44A09E',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        }
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{
          title: 'Visão Geral',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="orders" 
        options={{
          title: 'Encomendas',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="production" 
        options={{
          title: 'Produção',
          tabBarIcon: ({ color, size }) => <ChefHat size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="catalog" 
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => <Croissant size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="product-form" 
        options={{ href: null }} 
      />
      <Tabs.Screen 
        name="ingredients" 
        options={{ href: null }} 
      />
    </Tabs>
  );
}
