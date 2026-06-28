import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Carregar Favoritos
  const { data: favorites = [], isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiRequest('/favorites'),
    enabled: !!user
  });

  // 2. Mutação para remover dos favoritos
  const removeFavoriteMutation = useMutation({
    mutationFn: (productId: string) => apiRequest(`/favorites/${productId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  const handleProductPress = (id: string) => {
    router.push(`/(client)/product/${id}`);
  };

  const handleRemoveFavorite = (id: string) => {
    removeFavoriteMutation.mutate(id);
  };

  // Se não estiver autenticado
  if (!user) {
    return (
      <View className="flex-1 bg-cream-light dark:bg-[#150d0a] px-6 justify-center items-center">
        <View className="p-6 bg-white dark:bg-zinc-800 rounded-3xl items-center shadow-sm w-full border border-gray-100 dark:border-zinc-700">
          <Ionicons name="heart-dislike-outline" size={64} color="#C0532E" />
          <Text className="text-xl font-bold text-terracotta mt-4 text-center">Favoritos Exclusivos</Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center text-sm">
            Crie uma conta ou faça login para favoritar suas delícias e encontrá-las facilmente depois.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="mt-6 bg-terracotta px-8 py-3 rounded-full w-full items-center"
          >
            <Text className="text-white font-bold uppercase tracking-wider text-xs">Entrar ou Cadastrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream-light dark:bg-[#150d0a]">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-[#FAF7F2] dark:bg-[#1a120e] border-b border-cream-dark/30 dark:border-zinc-800">
        <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">Meus Preferidos</Text>
        <Text className="text-xl font-bold text-terracotta dark:text-cream">Produtos Favoritos</Text>
      </View>

      <View className="p-6 pb-20">
        {isLoading ? (
          <ActivityIndicator size="large" color="#C0532E" className="mt-8" />
        ) : favorites.length === 0 ? (
          <View className="items-center justify-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl p-6 border border-dashed border-gray-200 dark:border-zinc-700">
            <Ionicons name="heart-outline" size={48} color="#ccc" />
            <Text className="text-gray-400 dark:text-gray-500 mt-4 text-center font-medium">Nenhum favorito salvo ainda.</Text>
            <Text className="text-gray-400 dark:text-gray-500 text-xs text-center mt-1">Navegue no catálogo e favorite seus pães favoritos.</Text>
            <TouchableOpacity 
              onPress={() => router.replace('/(client)/home')} 
              className="mt-6 bg-tiffany px-6 py-2.5 rounded-full"
            >
              <Text className="text-white font-bold text-xs">Ver Catálogo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {favorites.map((item: any) => (
              <View 
                key={item.id} 
                className="flex-row bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm mb-4"
              >
                <TouchableOpacity 
                  onPress={() => handleProductPress(item.id)} 
                  className="flex-row flex-1"
                >
                  <Image 
                    source={{ uri: item.images[0] }} 
                    className="w-20 h-20 rounded-xl bg-gray-100" 
                    resizeMode="cover"
                  />
                  <View className="flex-1 ml-4 justify-center">
                    <Text className="text-gray-800 dark:text-gray-100 font-bold text-base" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-tiffany text-xs font-bold uppercase mt-0.5">{item.category}</Text>
                    <Text className="text-terracotta font-extrabold text-sm mt-1">R$ {item.price.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleRemoveFavorite(item.id)}
                  className="p-2 justify-center items-center"
                >
                  <Ionicons name="trash-outline" size={20} color="#C0532E" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
