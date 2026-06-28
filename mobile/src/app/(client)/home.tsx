import React, { useState, useCallback } from 'react';
import { View, TextInput, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Search, XCircle } from 'lucide-react-native';
import HomeHeader from '../../components/HomeHeader';
import CategoryFilter from '../../components/CategoryFilter';
import TodayProduction from '../../components/TodayProduction';
import ProductCatalog from '../../components/ProductCatalog';

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

        {/* Categorias Componentizadas */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Produção do Dia Componentizada */}
        {filteredProduction.length > 0 && (
          <TodayProduction
            production={filteredProduction}
            onProductPress={handleProductPress}
          />
        )}

        {/* Catálogo Componentizado */}
        <ProductCatalog
          products={products}
          loadingProducts={loadingProducts}
          production={production}
          onProductPress={handleProductPress}
        />
      </View>
    </ScrollView>
  );
}
