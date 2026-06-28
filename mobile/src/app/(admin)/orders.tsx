import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('RECEBIDO');

  const statusList = ['RECEBIDO', 'EM_PRODUCAO', 'PRONTO', 'FINALIZADO', 'CANCELADO'];

  // 1. Carregar Pedidos
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', selectedStatus],
    queryFn: () => apiRequest(`/orders?status=${selectedStatus}`)
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // 2. Mutação para alterar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      Alert.alert('Sucesso', 'Status do pedido atualizado.');
    },
    onError: (err: any) => {
      Alert.alert('Erro', err.message || 'Falha ao atualizar status.');
    }
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'RECEBIDO': return 'Recebido';
      case 'EM_PRODUCAO': return 'Em Produção';
      case 'PRONTO': return 'Pronto';
      case 'FINALIZADO': return 'Finalizado';
      case 'CANCELADO': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <ScrollView className="flex-1 bg-cream-light dark:bg-[#150d0a]">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-[#FAF7F2] dark:bg-[#1a120e] border-b border-cream-dark/30 dark:border-zinc-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#C0532E" />
        </TouchableOpacity>
        <View>
          <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">Controle de Pedidos</Text>
          <Text className="text-xl font-bold text-terracotta dark:text-cream">Encomendas do Dia</Text>
        </View>
      </View>

      {/* Abas de Status */}
      <View className="mt-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
        >
          {statusList.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-full mr-3 border ${
                  isSelected 
                    ? 'bg-terracotta border-terracotta' 
                    : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'
                }`}
              >
                <Text className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de Pedidos */}
      <View className="p-6 pb-20">
        {isLoading ? (
          <ActivityIndicator size="large" color="#C0532E" className="mt-8" />
        ) : orders.length === 0 ? (
          <View className="items-center justify-center py-20 bg-white dark:bg-zinc-800/50 rounded-3xl p-6 border border-dashed border-gray-200 dark:border-zinc-700">
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text className="text-gray-400 dark:text-gray-500 mt-4 text-center font-medium">Nenhum pedido nesta aba.</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {orders.map((order: any) => {
              const dateFormatted = new Date(order.pickupDate).toLocaleDateString('pt-BR');
              return (
                <View key={order.id} className="bg-white dark:bg-zinc-800 p-4 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-sm mb-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-xs font-bold text-terracotta">#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text className="text-xs text-gray-400 font-semibold">{dateFormatted} às {order.pickupTime}h</Text>
                  </View>

                  {/* Informações do Cliente */}
                  <View className="mb-3 p-3 bg-cream-light/50 dark:bg-zinc-700/30 rounded-2xl">
                    <Text className="text-gray-800 dark:text-gray-200 text-sm font-bold">{order.clientName}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{order.clientPhone}</Text>
                    {order.notes && (
                      <Text className="text-terracotta/90 dark:text-orange-300 text-xs mt-1.5 italic">Obs: {order.notes}</Text>
                    )}
                  </View>

                  {/* Itens */}
                  <View className="space-y-2 my-2">
                    {order.items.map((item: any) => (
                      <View key={item.id} className="flex-row justify-between">
                        <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                          {item.quantity}x {item.product.name}
                        </Text>
                        <Text className="text-gray-500 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="h-[1px] bg-gray-100 dark:bg-zinc-700/50 my-2" />

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-gray-400 text-xs">Total: <Text className="text-gray-800 dark:text-gray-100 font-black">R$ {order.total.toFixed(2)}</Text></Text>
                    
                    {/* Botões de Ação para mudar status */}
                    <View className="flex-row space-x-2">
                      {order.status === 'RECEBIDO' && (
                        <TouchableOpacity 
                          onPress={() => handleUpdateStatus(order.id, 'EM_PRODUCAO')}
                          className="bg-orange-500 px-3 py-1.5 rounded-full"
                        >
                          <Text className="text-white text-[10px] font-bold uppercase">Iniciar Produção</Text>
                        </TouchableOpacity>
                      )}
                      {order.status === 'EM_PRODUCAO' && (
                        <TouchableOpacity 
                          onPress={() => handleUpdateStatus(order.id, 'PRONTO')}
                          className="bg-emerald-500 px-3 py-1.5 rounded-full"
                        >
                          <Text className="text-white text-[10px] font-bold uppercase">Pronto para Retirada</Text>
                        </TouchableOpacity>
                      )}
                      {order.status === 'PRONTO' && (
                        <TouchableOpacity 
                          onPress={() => handleUpdateStatus(order.id, 'FINALIZADO')}
                          className="bg-gray-500 px-3 py-1.5 rounded-full"
                        >
                          <Text className="text-white text-[10px] font-bold uppercase">Entregar e Finalizar</Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* Cancelamento opcional */}
                      {['RECEBIDO', 'EM_PRODUCAO'].includes(order.status) && (
                        <TouchableOpacity 
                          onPress={() => {
                            Alert.alert('Cancelar Pedido', 'Tem certeza?', [
                              { text: 'Não' },
                              { text: 'Sim', style: 'destructive', onPress: () => handleUpdateStatus(order.id, 'CANCELADO') }
                            ]);
                          }}
                          className="bg-red-500/10 px-3 py-1.5 rounded-full ml-1"
                        >
                          <Text className="text-red-500 text-[10px] font-bold uppercase">Cancelar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
