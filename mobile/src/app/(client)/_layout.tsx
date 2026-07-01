import { Tabs, useRouter } from 'expo-router';
import { useColorScheme, View, TouchableOpacity, Text } from 'react-native';
import { Croissant, Heart, ShoppingBag, User } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ClientLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const router = useRouter();
  const isAdminPreview = user?.role === 'ADMINISTRADOR';

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#44A09E', // Tiffany como cor principal
          tabBarInactiveTintColor: '#888',
          tabBarStyle: isAdminPreview ? { display: 'none' } : {
            backgroundColor: '#ffffffff',
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

      {/* Floating Pill para Administrador visualizando a loja */}
      {isAdminPreview && (
        <View className="absolute bottom-12 self-center z-50">
          <TouchableOpacity
            onPress={() => router.replace('/(admin)/dashboard')}
            className="bg-black/25 dark:bg-white/70 px-6 py-3.5 rounded-full flex-row items-center shadow-lg border border-white/20 dark:border-black/10 active:opacity-80"
          >
            <Ionicons name="shield-checkmark" size={18} color={isDark ? "#111" : "#fff"} />
            <Text className="text-white dark:text-zinc-900 font-bold ml-2 tracking-wide text-xs">Voltar ao Painel Admin</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
