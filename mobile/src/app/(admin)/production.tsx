import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

interface ProductionItemInput {
  productId: string;
  name: string;
  targetQuantity: number;
  estimatedTime: string;
  enabled: boolean;
}

export default function AdminProductionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ProductionItemInput[]>([]);

  // 1. Carregar Produtos Ativos para seleção
  const { data: products = [], isLoading: loadingProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['admin-products-active'],
    queryFn: async () => {
      const res = await apiRequest('/products');
      return res.filter((p: any) => p.isActive);
    }
  });

  // 2. Carregar Produção de Hoje (se houver) para preencher
  const { data: currentProduction = [], isLoading: loadingProduction, refetch: refetchProduction } = useQuery({
    queryKey: ['admin-production-today'],
    queryFn: () => apiRequest('/production')
  });

  // Mesclar dados quando carregar
  useEffect(() => {
    if (products.length > 0) {
      const initialItems = products.map((p: any) => {
        const prodItem = currentProduction.find((cp: any) => cp.productId === p.id);
        return {
          productId: p.id,
          name: p.name,
          targetQuantity: prodItem ? prodItem.targetQuantity : 20,
          estimatedTime: prodItem ? prodItem.estimatedTime : '07:00',
          enabled: !!prodItem
        };
      });
      setItems(initialItems);
    }
  }, [products, currentProduction]);

  const handleToggleItem = (index: number) => {
    const updated = [...items];
    updated[index].enabled = !updated[index].enabled;
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

  // Mutação para Salvar
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
    const activeItems = items.filter(i => i.enabled);
    if (activeItems.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um produto para produzir hoje.');
      return;
    }

    // Validar formato de horários
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const item of activeItems) {
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
      items: activeItems.map(i => ({
        productId: i.productId,
        targetQuantity: i.targetQuantity,
        estimatedTime: i.estimatedTime
      }))
    };

    saveProductionMutation.mutate(payload);
  };

  const isLoading = loadingProducts || loadingProduction;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-[#150d0a]">
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
        {/* Header */}
        <View className="px-6 pt-14 pb-4 bg-[#1a120e] border-b border-zinc-800 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#E58A67" />
          </TouchableOpacity>
          <View>
            <Text className="text-xs text-gray-400 font-medium">Programação do Dia</Text>
            <Text className="text-xl font-bold text-cream">Planejador de Produção</Text>
          </View>
        </View>

        <View className="p-6">
          {isLoading ? (
            <ActivityIndicator size="large" color="#C0532E" className="mt-8" />
          ) : (
            <View className="space-y-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Selecione o que assar hoje:</Text>
              
              {items.map((item, index) => (
                <View 
                  key={item.productId} 
                  className={`bg-[#241914] p-4 rounded-3xl border shadow-sm mb-4 flex-row items-center justify-between ${
                    item.enabled ? 'border-tiffany/40' : 'border-zinc-800/80'
                  }`}
                >
                  <TouchableOpacity 
                    onPress={() => handleToggleItem(index)}
                    className="flex-row items-center flex-1 mr-4"
                  >
                    <Ionicons 
                      name={item.enabled ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={item.enabled ? "#44A09E" : "#666"} 
                    />
                    <Text className="text-gray-100 font-bold text-sm ml-3 flex-1" numberOfLines={2}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>

                  {item.enabled && (
                    <View className="flex-row items-center space-x-3">
                      {/* Qtd */}
                      <View className="w-16 mr-3">
                        <Text className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5">Metas</Text>
                        <TextInput
                          className="bg-[#150d0a] text-center text-gray-100 font-bold px-2 py-1.5 rounded-lg border border-zinc-850"
                          keyboardType="numeric"
                          value={String(item.targetQuantity)}
                          onChangeText={(val) => handleUpdateQty(index, val)}
                        />
                      </View>
                      
                      {/* Horário */}
                      <View className="w-16">
                        <Text className="text-[9px] text-gray-400 uppercase font-semibold mb-0.5">Saída</Text>
                        <TextInput
                          className="bg-[#150d0a] text-center text-gray-100 font-semibold px-2 py-1.5 rounded-lg border border-zinc-850"
                          placeholder="07:00"
                          value={item.estimatedTime}
                          onChangeText={(val) => handleUpdateTime(index, val)}
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ação de Salvar Fixa */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-[#1a120e] border-t border-zinc-800">
        <TouchableOpacity
          onPress={handleSave}
          disabled={saveProductionMutation.isPending}
          className="bg-terracotta py-4 rounded-xl items-center shadow-md active:opacity-90 flex-row justify-center"
        >
          {saveProductionMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text className="text-white text-base font-bold ml-2 uppercase">Salvar Programação</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
