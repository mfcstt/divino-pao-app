import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Croissant, Heart, Receipt, ShoppingBag, User } from 'lucide-react-native';

export default function ClientLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#44A09E', // Tiffany como cor principal
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#FAF7F2',
          borderTopColor: '#E1D3BF',
          paddingBottom: 8,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Croissant size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size, focused }) => (
            <Heart size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size} color={color} fill={focused ? color : 'none'} />
          ),
        }}
      />
      {/* Ocultar a rota de detalhes de produto das abas principais */}
      <Tabs.Screen
        name="product/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
