import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

export default function AdminCatalogScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Carregar Catálogo Completo
  const { data: products = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-catalog'],
    queryFn: () => apiRequest('/products') // Retorna todos os produtos
  });

  // 2. Mutação para desativar produto
  const deactivateProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      Alert.alert('Sucesso', 'Produto arquivado com sucesso.');
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message || 'Falha ao desativar produto.');
    }
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      'Desativar Receita', 
      'Tem certeza que deseja inativar este produto do catálogo? Ele não aparecerá mais para os clientes.',
      [
        { text: 'Cancelar' },
        { text: 'Confirmar', style: 'destructive', onPress: () => deactivateProductMutation.mutate(id) }
      ]
    );
  };

  const handleEdit = (id: string) => {
    router.push({
      pathname: '/(admin)/product-form',
      params: { id }
    });
  };

  return (
    <View className="flex-1 bg-cream-light dark:bg-[#150d0a]">
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header */}
        <View className="px-6 pt-14 pb-4 bg-[#FAF7F2] dark:bg-[#1a120e] border-b border-cream-dark/30 dark:border-zinc-800 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#C0532E" />
            </TouchableOpacity>
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">Controle de Receitas</Text>
              <Text className="text-xl font-bold text-terracotta dark:text-cream">Catálogo Geral</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(admin)/product-form')} 
            className="w-10 h-10 bg-terracotta rounded-full items-center justify-center shadow-md"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Lista de Receitas */}
        <View className="p-6 pb-24">
          {isLoading ? (
            <ActivityIndicator size="large" color="#C0532E" className="mt-8" />
          ) : products.length === 0 ? (
            <View className="items-center justify-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl p-6 border border-dashed border-gray-200 dark:border-zinc-700">
              <Ionicons name="pizza-outline" size={48} color="#ccc" />
              <Text className="text-gray-400 dark:text-gray-500 mt-4 text-center font-medium">Nenhum produto cadastrado.</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {products.map((item: any) => (
                <View 
                  key={item.id} 
                  className={`flex-row bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm mb-4 ${!item.isActive ? 'opacity-50' : ''}`}
                >
                  <Image 
                    source={{ uri: item.images[0] }} 
                    className="w-20 h-20 rounded-xl bg-gray-100" 
                    resizeMode="cover"
                  />
                  <View className="flex-1 ml-4 justify-between">
                    <View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-gray-800 dark:text-gray-100 font-bold text-sm" numberOfLines={1}>
                          {item.name}
                        </Text>
                        {!item.isActive && (
                          <View className="bg-gray-100 px-1.5 py-0.5 rounded">
                            <Text className="text-[8px] text-gray-400 font-bold uppercase">Inativo</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-tiffany text-[10px] font-bold uppercase mt-0.5">{item.category}</Text>
                      <Text className="text-terracotta font-extrabold text-sm mt-1">R$ {item.price.toFixed(2)}</Text>
                    </View>

                    {/* Ações */}
                    <View className="flex-row justify-end space-x-2 mt-2">
                      <TouchableOpacity 
                        onPress={() => handleEdit(item.id)}
                        className="p-1.5 bg-gray-50 dark:bg-zinc-700 rounded-lg flex-row items-center mr-2"
                      >
                        <Ionicons name="pencil" size={14} color="#C0532E" />
                        <Text className="text-[10px] text-terracotta font-semibold ml-1">Editar</Text>
                      </TouchableOpacity>
                      {item.isActive && (
                        <TouchableOpacity 
                          onPress={() => handleDelete(item.id)}
                          className="p-1.5 bg-red-50 dark:bg-zinc-700/50 rounded-lg flex-row items-center"
                        >
                          <Ionicons name="archive" size={14} color="#EF4444" />
                          <Text className="text-[10px] text-red-500 font-semibold ml-1">Arquivar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
