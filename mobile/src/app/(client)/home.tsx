import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, XCircle, Clock, Coffee, Grid, Wheat, Croissant, CakeSlice } from 'lucide-react-native';
import HomeHeader from '../../components/HomeHeader';

// Helper para selecionar os ícones de categoria
const getCategoryIcon = (categoryName: string, color: string, size = 16) => {
  switch (categoryName) {
    case 'Todos':
      return <Grid size={size} color={color} />;
    case 'Pães':
      return <Wheat size={size} color={color} />;
    case 'Folhados':
      return <Croissant size={size} color={color} />;
    case 'Doces':
      return <CakeSlice size={size} color={color} />;
    case 'Bebidas':
      return <Coffee size={size} color={color} />;
    default:
      return <Grid size={size} color={color} />;
  }
};

export default function ClientHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const categories = ['Todos', 'Pães', 'Folhados', 'Doces', 'Bebidas'];

  // 1. Buscar produtos do catálogo
  const { 
    data: products = [], 
    isLoading: loadingProducts, 
    refetch: refetchProducts,
    isRefetching: refetchingProducts 
  } = useQuery({
    queryKey: ['products', selectedCategory, search],
    queryFn: () => apiRequest(`/products?category=${selectedCategory === 'Todos' ? '' : selectedCategory}&search=${search}`)
  });

  // 2. Buscar produção diária de hoje
  const { 
    data: production = [], 
    isLoading: loadingProduction, 
    refetch: refetchProduction 
  } = useQuery({
    queryKey: ['production-today'],
    queryFn: () => apiRequest('/production')
  });

  // Filtra a produção de hoje localmente baseado na aba selecionada
  const filteredProduction = production.filter((item: any) => {
    if (selectedCategory === 'Todos') return true;
    return item.product.category === selectedCategory;
  });

  useFocusEffect(
    useCallback(() => {
      refetchProducts();
      refetchProduction();
    }, [refetchProducts, refetchProduction])
  );

  const onRefresh = async () => {
    await Promise.all([refetchProducts(), refetchProduction()]);
  };

  const handleProductPress = (id: string) => {
    router.push(`/(client)/product/${id}`);
  };

  // Helper para verificar se um produto está na produção de hoje e tem cota disponível
  const getProductProductionInfo = (productId: string) => {
    const prodItem = production.find((p: any) => p.productId === productId);
    if (!prodItem) return null;
    const available = prodItem.targetQuantity - prodItem.soldQuantity;
    return {
      available,
      estimatedTime: prodItem.estimatedTime
    };
  };

  return (
    <ScrollView 
      className="flex-1 bg-cream-light dark:bg-[#150d0a]"
      refreshControl={<RefreshControl refreshing={refetchingProducts} onRefresh={onRefresh} />}
    >
      {/* Header Componentizado */}
      <HomeHeader />

      {/* Conteúdo Arredondado no Topo */}
      <View className="flex-1 bg-cream-light dark:bg-[#150d0a] rounded-t-[32px] mt-[-24px] pt-6">
        {/* Caixa de Busca */}
        <View className="px-6">
          <View className="flex-row items-center bg-white dark:bg-zinc-800 px-4 py-3 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm">
            <Search size={20} color="#999" />
            <TextInput
              className="flex-1 ml-2 text-gray-700 dark:text-gray-200 text-sm"
              placeholder="Pesquisar pães, croissants..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <XCircle size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categorias (Abas) - Subiu para ficar logo abaixo da busca */}
        <View className="mt-6">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-full mr-3 border flex-row items-center ${
                    isSelected 
                      ? 'bg-tiffany border-tiffany' 
                      : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'
                  }`}
                >
                  {getCategoryIcon(cat, isSelected ? '#fff' : '#666')}
                  <Text className={`font-semibold text-xs ml-1.5 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Produção do Dia (Destaque do Dia) - Agora filtrada também */}
        {filteredProduction.length > 0 && (
          <View className="mt-8">
            <View className="px-6 flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-tiffany dark:text-cream">Produção de Hoje</Text>
              <View className="bg-tiffany/10 px-3 py-1 rounded-full">
                <Text className="text-tiffany text-xs font-semibold">Saídas Frescas</Text>
              </View>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={filteredProduction}
              contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const available = item.targetQuantity - item.soldQuantity;
                return (
                  <TouchableOpacity 
                    onPress={() => handleProductPress(item.product.id)}
                    className="bg-white dark:bg-zinc-800 w-48 mr-4 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm"
                  >
                    <Image 
                      source={{ uri: item.product.images[0] }} 
                      className="w-full h-28 rounded-xl bg-gray-100" 
                      resizeMode="cover"
                    />
                    <Text className="text-gray-800 dark:text-gray-100 font-bold text-sm mt-2" numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    
                    {/* Tempo previsto de saída */}
                    <View className="flex-row items-center mt-1">
                      <Clock size={12} color="#44A09E" />
                      <Text className="text-tiffany text-xs font-semibold ml-1">Fresco às {item.estimatedTime}h</Text>
                    </View>

                    {/* Qtd disponível */}
                    <View className="flex-row justify-between items-center mt-2">
                      <Text className="text-tiffany font-extrabold text-sm">R$ {item.product.price.toFixed(2)}</Text>
                      <View className="bg-orange-50 dark:bg-zinc-700 px-2 py-0.5 rounded">
                        <Text className="text-[10px] text-terracotta dark:text-orange-300 font-bold">
                          {available} restam
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Catálogo Geral (Lista de Produtos) */}
        <View className="px-6 mt-6 pb-20">
          <Text className="text-lg font-bold text-tiffany dark:text-cream mb-4">Catálogo de Delícias</Text>
          
          {loadingProducts ? (
            <ActivityIndicator size="large" color="#44A09E" className="mt-8" />
          ) : products.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Coffee size={48} color="#ccc" />
              <Text className="text-gray-400 dark:text-gray-500 mt-2 font-medium">Nenhum produto encontrado.</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {products.map((item: any) => {
                const prodInfo = getProductProductionInfo(item.id);
                const isTodayProduction = prodInfo !== null && prodInfo.available > 0;
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleProductPress(item.id)}
                    className="flex-row bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm mb-4"
                  >
                    <Image 
                      source={{ uri: item.images[0] }} 
                      className="w-24 h-24 rounded-xl bg-gray-100" 
                      resizeMode="cover"
                    />
                    <View className="flex-1 ml-4 justify-between">
                      <View>
                        <Text className="text-gray-800 dark:text-gray-100 font-bold text-base" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-gray-400 dark:text-gray-400 text-xs mt-1" numberOfLines={2}>
                          {item.description}
                        </Text>
                      </View>

                      <View className="flex-row justify-between items-end mt-2">
                        <Text className="text-tiffany font-extrabold text-base">
                          R$ {item.price.toFixed(2)}
                        </Text>

                        {/* Disponibilidade Status Tag */}
                        {isTodayProduction ? (
                          <View className="bg-tiffany/10 px-2 py-0.5 rounded">
                            <Text className="text-[10px] text-tiffany font-bold uppercase">
                              Pronto Hoje
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded">
                            <Text className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">
                              Sob Encomenda
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
