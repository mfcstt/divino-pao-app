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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RECEBIDO':
        return { label: 'Recebido' };
      case 'EM_PRODUCAO':
        return { label: 'Em Produção' };
      case 'PRONTO':
        return { label: 'Pronto' };
      case 'FINALIZADO':
        return { label: 'Finalizado' };
      case 'CANCELADO':
        return { label: 'Cancelado' };
      default:
        return { label: status };
    }
  };

  const getStatusIcon = (status: string, color: string, size = 16) => {
    switch (status) {
      case 'RECEBIDO':
        return <Ionicons name="cube-outline" size={size} color={color} />;
      case 'EM_PRODUCAO':
        return <Ionicons name="restaurant-outline" size={size} color={color} />;
      case 'PRONTO':
        return <Ionicons name="bag-check-outline" size={size} color={color} />;
      case 'FINALIZADO':
        return <Ionicons name="checkmark-done-circle-outline" size={size} color={color} />;
      case 'CANCELADO':
        return <Ionicons name="close-circle-outline" size={size} color={color} />;
      default:
        return <Ionicons name="ellipse-outline" size={size} color={color} />;
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-tiffany"
      contentContainerStyle={{ flexGrow: 1 }}
      bounces={true}
    >
      {/* Header Premium Tiffany */}
      <View className="px-6 pt-14 pb-8 bg-tiffany dark:bg-[#1d3d3c] flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mr-4 w-10 h-10 bg-white/10 rounded-full justify-center items-center border border-white/10 active:opacity-90 shadow-sm"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Controle de Pedidos</Text>
          <Text className="text-2xl font-black text-white mt-0.5">Encomendas do Dia</Text>
        </View>
      </View>

      {/* Card Cream-Light de Conteúdo */}
      <View className="flex-1 bg-cream-light dark:bg-[#150d0a] rounded-t-[40px] pt-8 pb-12 shadow-2xl">
        
        {/* Abas de Status */}
        <View className="mb-6 mt-2">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {statusList.map((status) => {
              const isSelected = selectedStatus === status;
              const style = getStatusStyle(status);
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  className={`px-4 py-2.5 rounded-full mr-3 border flex-row items-center ${
                    isSelected 
                      ? 'bg-tiffany border-tiffany' 
                      : 'bg-white dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'
                  }`}
                >
                  {getStatusIcon(status, isSelected ? '#fff' : '#666')}
                  <Text className={`font-semibold text-xs ml-1.5 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {style.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista de Pedidos */}
        <View className="px-6">
          {isLoading ? (
            <ActivityIndicator size="large" color="#44A09E" className="mt-8" />
          ) : orders.length === 0 ? (
            <View className="items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-[35px] p-6 border border-dashed border-gray-100 dark:border-zinc-800 shadow-sm">
              <Ionicons name="receipt-outline" size={48} color="#999" />
              <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center font-bold text-sm">Nenhum pedido nesta aba.</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {orders.map((order: any) => {
                const dateFormatted = new Date(order.pickupDate).toLocaleDateString('pt-BR');
                const style = getStatusStyle(order.status);
                return (
                  <View key={order.id} className="bg-white dark:bg-[#1a120e] p-5 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm mb-4">
                    {/* Top Header com ID e Status Badge */}
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-xs font-black text-terracotta uppercase tracking-wider">PEDIDO #{order.id.slice(0, 8).toUpperCase()}</Text>
                      <View className={`px-3 py-1.5 rounded-full flex-row items-center bg-gray-50 dark:bg-zinc-800/50`}>
                        {getStatusIcon(order.status, '#68492E', 12)}
                        <Text className={`text-terracotta dark:text-terracotta-light text-[10px] font-bold uppercase ml-1.5`}>{style.label}</Text>
                      </View>
                    </View>

                    {/* Informações do Cliente & Agendamento */}
                    <View className="mb-3.5 p-3.5 bg-cream-light/40 dark:bg-zinc-800/40 rounded-2xl border border-cream-dark/10 dark:border-zinc-800">
                      <Text className="text-zinc-800 dark:text-zinc-200 text-sm font-black">{order.clientName}</Text>
                      <Text className="text-zinc-500 dark:text-zinc-450 text-xs mt-0.5 font-semibold">{order.clientPhone}</Text>
                      
                      <View className="flex-row items-center mt-2.5 pt-2 border-t border-gray-100/50 dark:border-zinc-800/55 justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={13} color="#999" />
                          <Text className="text-stone-400 dark:text-zinc-400 text-xs ml-1 font-semibold">{dateFormatted}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={13} color="#999" />
                          <Text className="text-stone-400 dark:text-zinc-400 text-xs ml-1 font-semibold">Retirada: {order.pickupTime}h</Text>
                        </View>
                      </View>

                      {order.notes && (
                        <View className="mt-2 pt-2 border-t border-gray-100/50 dark:border-zinc-800/55 flex-row items-center">
                          <Ionicons name="chatbox-outline" size={13} color="#68492E" />
                          <Text className="text-terracotta dark:text-amber-300 text-xs ml-1 font-medium italic flex-1" numberOfLines={2}>
                            Obs: {order.notes}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Itens */}
                    <View className="space-y-2 my-3 px-1">
                      {order.items.map((item: any) => (
                        <View key={item.id} className="flex-row justify-between items-center">
                          <Text className="text-zinc-700 dark:text-zinc-350 text-sm font-bold">
                            {item.quantity}x {item.product.name}
                          </Text>
                          <Text className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="h-[1px] bg-gray-100 dark:bg-zinc-800 my-2" />

                    {/* Total Somatória */}
                    <View className="flex-row justify-between items-center mt-2 mb-4 px-1">
                      <Text className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Total do Pedido</Text>
                      <Text className="text-tiffany font-extrabold text-lg">R$ {order.total.toFixed(2)}</Text>
                    </View>
                    
                    {/* Botões de Ação */}
                    <View className="flex-row items-center w-full mt-2">
                      {order.status === 'RECEBIDO' && (
                        <TouchableOpacity 
                          onPress={() => handleUpdateStatus(order.id, 'EM_PRODUCAO')}
                          className="flex-1 bg-tiffany py-3 px-5 rounded-full active:opacity-90 shadow-sm flex-row justify-center items-center mr-2"
                        >
                          <Ionicons name="play" size={14} color="#fff" style={{ marginRight: 6 }} />
                          <Text className="text-white text-xs font-bold uppercase tracking-wider">Iniciar Produção</Text>
                        </TouchableOpacity>
                      )}
                      {order.status === 'EM_PRODUCAO' && (
                        <TouchableOpacity 
                          onPress={() => handleUpdateStatus(order.id, 'PRONTO')}
                          className="flex-1 bg-tiffany py-3 px-5 rounded-full active:opacity-90 shadow-sm flex-row justify-center items-center mr-2"
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginRight: 6 }} />
                          <Text className="text-white text-xs font-bold uppercase tracking-wider">Marcar Pronto</Text>
                        </TouchableOpacity>
                      )}
                      {order.status === 'PRONTO' && (
                        <TouchableOpacity 
                          onPress={() => handleUpdateStatus(order.id, 'FINALIZADO')}
                          className="flex-1 bg-tiffany py-3 px-5 rounded-full active:opacity-90 shadow-sm flex-row justify-center items-center mr-2"
                        >
                          <Ionicons name="flag" size={14} color="#fff" style={{ marginRight: 6 }} />
                          <Text className="text-white text-xs font-bold uppercase tracking-wider">Finalizar</Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* Cancelamento opcional */}
                      {['RECEBIDO', 'EM_PRODUCAO'].includes(order.status) && (
                        <TouchableOpacity 
                          onPress={() => {
                            Alert.alert('Cancelar Pedido', 'Tem certeza que deseja cancelar esta encomenda?', [
                              { text: 'Não' },
                              { text: 'Sim, Cancelar', style: 'destructive', onPress: () => handleUpdateStatus(order.id, 'CANCELADO') }
                            ]);
                          }}
                          className="bg-transparent border border-terracotta py-3 px-5 rounded-full active:opacity-90 justify-center items-center"
                        >
                          <Text className="text-terracotta text-xs font-bold uppercase tracking-wider">Cancelar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
