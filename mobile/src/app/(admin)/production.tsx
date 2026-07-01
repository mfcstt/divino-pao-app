import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, Modal, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Grid, Wheat, Croissant, CakeSlice, Coffee } from 'lucide-react-native';
import { apiRequest } from '../../services/api';

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

interface ProductionItemInput {
  productId: string;
  name: string;
  targetQuantity: number;
  estimatedTime: string;
  imageUrl?: string;
}

export default function AdminProductionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ProductionItemInput[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 1. Carregar Produtos Ativos para seleção
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products-active'],
    queryFn: async () => {
      const res = await apiRequest('/products');
      return res.filter((p: any) => p.isActive);
    }
  });

  // 2. Carregar Produção de Hoje (se houver) para preencher
  const { data: currentProduction = [], isLoading: loadingProduction } = useQuery({
    queryKey: ['admin-production-today'],
    queryFn: () => apiRequest('/production')
  });

  // Mesclar dados quando carregar (Apenas 1 vez)
  useEffect(() => {
    if (!loadingProducts && !loadingProduction && !hasInitialized && products.length > 0) {
      const initialItems = currentProduction
        .filter((cp: any) => cp.isActive !== false) // Assegura que pegamos os ativos
        .map((cp: any) => {
          const prod = products.find((p: any) => p.id === cp.productId);
          return {
            productId: cp.productId,
            name: prod ? prod.name : 'Produto Desconhecido',
            targetQuantity: cp.targetQuantity,
            estimatedTime: cp.estimatedTime,
            imageUrl: prod && prod.images && prod.images.length > 0 ? prod.images[0] : null
          };
        });
      setItems(initialItems);
      setHasInitialized(true);
    }
  }, [loadingProducts, loadingProduction, products, currentProduction, hasInitialized]);

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const handleAddItem = (product: any) => {
    setItems([{
      productId: product.id,
      name: product.name,
      targetQuantity: 20,
      estimatedTime: '07:00',
      imageUrl: product.images && product.images.length > 0 ? product.images[0] : null
    }, ...items]);
    // Opcional: Fechar catálogo ao adicionar, mas deixamos aberto para adicionar vários
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleUpdateQty = (index: number, val: string) => {
    const updated = [...items];
    updated[index].targetQuantity = parseInt(val) || 0;
    setItems(updated);
  };

  const handleUpdateTime = (index: number, val: string) => {
    const updated = [...items];
    updated[index].estimatedTime = val;
    setItems(updated);
  };

  const saveProductionMutation = useMutation({
    mutationFn: (payload: any) => apiRequest('/production', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      Alert.alert('Sucesso', 'Programação de produção diária salva!');
      queryClient.invalidateQueries({ queryKey: ['admin-production-today'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message || 'Falha ao salvar programação.');
    }
  });

  const handleSave = () => {
    if (items.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um produto na produção de hoje.');
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const item of items) {
      if (!timeRegex.test(item.estimatedTime)) {
        Alert.alert('Erro', `Horário "${item.estimatedTime}" do produto ${item.name} é inválido. Use o formato HH:MM.`);
        return;
      }
      if (item.targetQuantity <= 0) {
        Alert.alert('Erro', `A quantidade do produto ${item.name} deve ser maior que zero.`);
        return;
      }
    }

    const payload = {
      items: items.map(i => ({
        productId: i.productId,
        targetQuantity: i.targetQuantity,
        estimatedTime: i.estimatedTime
      }))
    };

    saveProductionMutation.mutate(payload);
  };

  const isLoading = loadingProducts || loadingProduction;
  const availableProducts = products.filter((p: any) => !items.some(i => i.productId === p.id));
  
  // Agrupar produtos disponíveis por categoria
  const groupedProducts = availableProducts.reduce((acc: any, p: any) => {
    const cat = p.category || 'Diversos';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-tiffany dark:bg-[#1d3d3c]">
          
          {/* Header Premium Tiffany */}
          <View className="px-6 pt-14 pb-8 flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="mr-4 w-10 h-10 bg-white/10 rounded-full justify-center items-center border border-white/10 active:opacity-90 shadow-sm"
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Gestão Diária</Text>
              <Text className="text-2xl font-black text-white mt-0.5">Produção</Text>
            </View>
          </View>

          {/* Card Cream-Light de Conteúdo */}
          <View className="flex-1 bg-cream-light dark:bg-[#150d0a] rounded-t-[40px] pt-8 shadow-2xl overflow-hidden">
            {isLoading ? (
              <ActivityIndicator size="large" color="#44A09E" className="mt-8" />
            ) : (
              <>
                {/* FAB substituiu o Inline Select */}

                {/* Lista de Produção do Dia */}
                <ScrollView 
                  className="flex-1 px-6"
                  contentContainerStyle={{ paddingBottom: 120 }}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Programados para Hoje ({items.length})</Text>
                  
                  {items.length === 0 ? (
                    <View className="bg-white dark:bg-[#1a120e] p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 items-center justify-center mt-2 shadow-sm">
                      <Ionicons name="receipt-outline" size={32} color="#D1D5DB" />
                      <Text className="text-stone-400 dark:text-zinc-500 font-semibold text-sm mt-3 text-center">Nenhum produto programado ainda.</Text>
                      <Text className="text-stone-400 dark:text-zinc-500 text-xs mt-1 text-center">Toque nos produtos acima para adicionar.</Text>
                    </View>
                  ) : (
                    items.map((item, index) => (
                      <View 
                        key={item.productId} 
                        className="bg-white dark:bg-[#1a120e] rounded-2xl mb-4 border border-gray-100 dark:border-zinc-800 shadow-sm flex-row overflow-hidden h-[90px]"
                      >
                        {/* Foto 100% flush no canto esquerdo */}
                        <View className="w-[84px] bg-gray-50 dark:bg-zinc-800">
                          {item.imageUrl ? (
                            <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <View className="w-full h-full justify-center items-center opacity-30">
                              <Ionicons name="image-outline" size={24} color="#666" />
                            </View>
                          )}
                        </View>

                        {/* Conteúdo Principal (Direita) */}
                        <View className="flex-1 p-3 pl-4 flex-row items-center">
                          <View className="flex-1">
                            {/* Título do Produto */}
                            <Text className="font-bold text-[13px] text-zinc-800 dark:text-zinc-100 mb-2" numberOfLines={1}>
                              {item.name}
                            </Text>
                            
                            {/* Campos Editáveis */}
                            <View className="flex-row items-center">
                              {/* Input Qtd */}
                              <View className="flex-row items-center mr-4">
                                <Text className="text-[9px] text-zinc-400 font-semibold uppercase mr-1 tracking-wider">Meta:</Text>
                                <TextInput
                                  className="text-terracotta font-black text-sm border-b border-gray-200 dark:border-zinc-700 min-w-[28px] text-center pb-0.5"
                                  keyboardType="numeric"
                                  value={String(item.targetQuantity)}
                                  onChangeText={(val) => handleUpdateQty(index, val)}
                                />
                              </View>
                              
                              {/* Input Horário */}
                              <View className="flex-row items-center">
                                <Text className="text-[9px] text-zinc-400 font-semibold uppercase mr-1 tracking-wider">Saída:</Text>
                                <TextInput
                                  className="text-terracotta font-black text-sm border-b border-gray-200 dark:border-zinc-700 min-w-[36px] text-center pb-0.5"
                                  placeholder="07:00"
                                  placeholderTextColor="#999"
                                  value={item.estimatedTime}
                                  onChangeText={(val) => handleUpdateTime(index, val)}
                                />
                              </View>
                            </View>
                          </View>

                          {/* Botão de Remover (Lixeira) */}
                          <TouchableOpacity 
                            onPress={() => handleRemoveItem(index)}
                            className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full justify-center items-center ml-2 active:opacity-75"
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
              </>
            )}
          </View>

          {/* FAB Adicionar */}
          <TouchableOpacity 
            onPress={() => setIsCatalogOpen(true)}
            className="absolute bottom-28 right-6 bg-terracotta w-14 h-14 rounded-full justify-center items-center shadow-xl active:opacity-80"
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Ação de Salvar Fixa */}
          <View className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-white dark:bg-[#150d0a] border-t border-gray-100 dark:border-zinc-800 shadow-xl">
            <TouchableOpacity
              onPress={handleSave}
              disabled={saveProductionMutation.isPending}
              className="bg-tiffany py-3.5 px-8 rounded-full items-center shadow-sm active:opacity-90 flex-row justify-center"
            >
              {saveProductionMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-white text-xs font-bold uppercase tracking-wider">Salvar Programação</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal Bottom Sheet: Catálogo */}
          <Modal
            visible={isCatalogOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setIsCatalogOpen(false)}
          >
            <View className="flex-1 justify-end bg-black/50">
              <TouchableOpacity 
                style={{ flex: 1 }} 
                onPress={() => setIsCatalogOpen(false)} 
                activeOpacity={1} 
              />
              <View className="bg-cream-light dark:bg-[#1a120e] rounded-t-[40px] max-h-[75%] p-6 shadow-2xl border-t border-tiffany/20">
                <View className="flex-row justify-between items-center mb-6">
                  <View>
                    <Text className="text-xl font-black text-zinc-800 dark:text-zinc-100">Catálogo</Text>
                    <Text className="text-[10px] uppercase font-bold text-stone-400 mt-1">Toque no + para adicionar</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsCatalogOpen(false)} className="bg-gray-100 dark:bg-zinc-800/80 p-2.5 rounded-full active:opacity-70">
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {availableProducts.length === 0 ? (
                  <Text className="text-xs text-stone-400 font-medium text-center py-8">Todos os produtos do catálogo já foram adicionados.</Text>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {Object.keys(groupedProducts).sort().map((cat, index) => (
                      <View key={cat} className={`mb-4 ${index !== 0 ? 'pt-5 border-t border-gray-100 dark:border-zinc-800/80' : ''}`}>
                        <View className="flex-row items-center mb-3">
                          {getCategoryIcon(cat, '#C0532E', 14)}
                          <Text className="text-[10px] font-black text-terracotta uppercase tracking-wider ml-1.5">{cat}</Text>
                        </View>
                        <View className="space-y-2">
                          {groupedProducts[cat].map((p: any) => (
                            <View key={p.id} className="flex-row items-center justify-between bg-white dark:bg-zinc-800/50 px-4 py-3 rounded-[24px] border border-gray-100 dark:border-zinc-800/80 shadow-sm">
                              <Text className="text-zinc-800 dark:text-zinc-200 font-bold text-xs flex-1 mr-2">{p.name}</Text>
                              <TouchableOpacity 
                                onPress={() => handleAddItem(p)}
                                className="p-2 bg-tiffany rounded-xl active:opacity-75"
                              >
                                <Ionicons name="add" size={16} color="#fff" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
