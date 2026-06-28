import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

export default function AdminIngredientsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [newStock, setNewStock] = useState('');
  const [updating, setUpdating] = useState(false);

  // 1. Carregar Ingredientes
  const { data: ingredients = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: () => apiRequest('/ingredients')
  });

  // 2. Mutação para atualizar estoque
  const updateStockMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => apiRequest(`/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      Alert.alert('Sucesso', 'Estoque do ingrediente atualizado.');
      setEditModalOpen(false);
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message || 'Falha ao atualizar estoque.');
    }
  });

  const handleEditPress = (ing: any) => {
    setSelectedIngredient(ing);
    setNewStock(String(ing.currentStock));
    setEditModalOpen(true);
  };

  const handleSaveStock = () => {
    if (!selectedIngredient) return;
    const stockVal = parseFloat(newStock);
    if (isNaN(stockVal) || stockVal < 0) {
      Alert.alert('Erro', 'Insira uma quantidade de estoque válida.');
      return;
    }

    const payload = {
      name: selectedIngredient.name,
      unit: selectedIngredient.unit,
      currentStock: stockVal,
      minStock: selectedIngredient.minStock,
      supplier: selectedIngredient.supplier || ''
    };

    updateStockMutation.mutate({ id: selectedIngredient.id, body: payload });
  };

  return (
    <View className="flex-1 bg-cream-light dark:bg-[#150d0a]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View className="px-6 pt-14 pb-4 bg-[#FAF7F2] dark:bg-[#1a120e] border-b border-cream-dark/30 dark:border-zinc-800 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#C0532E" />
            </TouchableOpacity>
            <View>
              <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">Controle de Matéria-Prima</Text>
              <Text className="text-xl font-bold text-terracotta dark:text-cream">Insumos & Estoque</Text>
            </View>
          </View>
        </View>

        <View className="p-6">
          {isLoading ? (
            <ActivityIndicator size="large" color="#C0532E" className="mt-8" />
          ) : (
            <View className="space-y-4">
              {ingredients.map((ing: any) => {
                const isLowStock = ing.currentStock < ing.minStock;
                return (
                  <View 
                    key={ing.id} 
                    className={`bg-white dark:bg-zinc-800 p-4 rounded-3xl border shadow-sm mb-4 flex-row items-center justify-between ${
                      isLowStock ? 'border-red-200 dark:border-red-900/30' : 'border-gray-100 dark:border-zinc-700/80'
                    }`}
                  >
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center">
                        <Text className="text-gray-800 dark:text-gray-100 font-bold text-sm">{ing.name}</Text>
                        {isLowStock && (
                          <View className="bg-red-500/10 px-2 py-0.5 rounded ml-2">
                            <Text className="text-red-500 text-[8px] font-black uppercase">Baixo Estoque</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-400 text-xs mt-1">Mínimo necessário: {ing.minStock} {ing.unit}</Text>
                      {ing.supplier && (
                        <Text className="text-[10px] text-gray-400 italic mt-0.5">Fornecedor: {ing.supplier}</Text>
                      )}
                    </View>

                    {/* Estoque atual e botão de edição */}
                    <View className="flex-row items-center space-x-3">
                      <View className="items-end mr-3">
                        <Text className="text-xs text-gray-400">Estoque Atual</Text>
                        <Text className={`text-base font-extrabold ${isLowStock ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
                          {ing.currentStock} {ing.unit}
                        </Text>
                      </View>
                      
                      <TouchableOpacity 
                        onPress={() => handleEditPress(ing)}
                        className="w-10 h-10 bg-terracotta/10 rounded-full items-center justify-center"
                      >
                        <Ionicons name="add" size={20} color="#C0532E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={editModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center bg-black/50 px-6">
              <View className="bg-cream-light dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-zinc-800">
            <Text className="text-lg font-bold text-terracotta mb-1">Ajustar Insumo</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-xs mb-4">Atualize o nível de estoque para {selectedIngredient?.name}</Text>

            <View className="flex-row items-center bg-white dark:bg-zinc-800 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 mb-6">
              <TextInput
                className="flex-1 text-gray-800 dark:text-gray-100 font-bold"
                keyboardType="numeric"
                value={newStock}
                onChangeText={setNewStock}
                placeholder="Ex: 25.0"
              />
              <Text className="text-gray-400 font-bold ml-2">{selectedIngredient?.unit}</Text>
            </View>

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity 
                onPress={() => setEditModalOpen(false)} 
                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-xl mr-2"
              >
                <Text className="text-gray-500 dark:text-gray-400 font-bold text-xs">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveStock}
                disabled={updateStockMutation.isPending}
                className="px-6 py-2 bg-terracotta rounded-xl"
              >
                {updateStockMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-xs">Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </Modal>
    </View>
  );
}
