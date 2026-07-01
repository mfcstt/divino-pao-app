import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // 1. Carregar Pedidos
  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiRequest('/orders'),
    enabled: !!user
  });

  useFocusEffect(
    useCallback(() => {
      if (user) {
        refetch();
      }
    }, [refetch, user])
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'RECEBIDO':
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', label: 'Recebido' };
      case 'EM_PRODUCAO':
        return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', label: 'Em Produção' };
      case 'PRONTO':
        return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Pronto para Retirada' };
      case 'FINALIZADO':
        return { bg: 'bg-gray-50 dark:bg-zinc-800', text: 'text-gray-500 dark:text-gray-400', label: 'Finalizado' };
      case 'CANCELADO':
        return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', label: 'Cancelado' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-500', label: status };
    }
  };

  // Se não estiver autenticado
  if (!user) {
    return (
      <View className="flex-1 bg-cream-light dark:bg-[#150d0a] px-6 justify-center items-center">
        <Ionicons name="receipt-outline" size={64} color="#44A09E" />
        <Text className="text-xl font-bold text-tiffany mt-4 text-center">Acompanhe seus Pedidos</Text>
        <Text className="text-stone-400 dark:text-stone-200 mt-2 text-center text-sm px-6">
          Faça login para realizar encomendas, rastrear o status de produção e acessar seu histórico de compras.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="mt-6 bg-tiffany px-8 py-3.5 rounded-full w-full items-center shadow-sm active:opacity-90"
        >
          <Text className="text-white font-bold uppercase tracking-wider text-xs">Acessar Minha Conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Separar pedidos ativos e encerrados
  const activeOrders = orders.filter((o: any) => ['RECEBIDO', 'EM_PRODUCAO', 'PRONTO'].includes(o.status));
  const historicOrders = orders.filter((o: any) => ['FINALIZADO', 'CANCELADO'].includes(o.status));

  return (
    <ScrollView
      className="flex-1 bg-cream-light dark:bg-[#150d0a]"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-[#FAF7F2] dark:bg-[#1a120e] border-b border-cream-dark/30 dark:border-zinc-800">
        <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">Minhas Encomendas</Text>
        <Text className="text-xl font-bold text-tiffany dark:text-cream">Histórico & Status</Text>
      </View>

      <View className="p-6 pb-20">
        {isLoading ? (
          <ActivityIndicator size="large" color="#C0532E" className="mt-8" />
        ) : orders.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="cart-outline" size={56} color="#44A09E" />
            <Text className="text-tiffany font-bold mt-4 text-center">Nenhum pedido realizado.</Text>
            <Text className="text-milk-dark dark:text-milk-light text-xs text-center mt-1 px-6">
              Quando realizar uma encomenda, ela aparecerá aqui.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(client)/home')}
              className="mt-6 bg-tiffany px-8 py-3 rounded-full shadow-sm active:opacity-90"
            >
              <Text className="text-white font-bold text-xs uppercase tracking-wider">Fazer Minha Primeira Encomenda</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-6">

            {/* Seção 1: Pedidos em Andamento */}
            {activeOrders.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-tiffany dark:text-cream uppercase tracking-wider mb-3">Em Andamento</Text>
                {activeOrders.map((order: any) => {
                  const style = getStatusStyle(order.status);
                  const dateFormatted = new Date(order.pickupDate).toLocaleDateString('pt-BR');

                  return (
                    <View key={order.id} className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700 shadow-sm mb-4">
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-xs text-gray-400 font-semibold">Código: #{order.id.slice(0, 8).toUpperCase()}</Text>
                        <View className={`${style.bg} px-2.5 py-1 rounded-full`}>
                          <Text className={`${style.text} text-[10px] font-bold uppercase`}>{style.label}</Text>
                        </View>
                      </View>

                      {/* Itens */}
                      <View className="space-y-1 my-2">
                        {order.items.map((item: any) => (
                          <Text key={item.id} className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                            {item.quantity}x {item.product.name}
                          </Text>
                        ))}
                      </View>

                      <View className="h-[1px] bg-gray-100 dark:bg-zinc-700/50 my-2" />

                      {/* Detalhes de Retirada */}
                      <View className="flex-row items-center justify-between text-xs text-gray-500 mt-2">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={14} color="#999" />
                          <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1">{dateFormatted}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={14} color="#999" />
                          <Text className="text-gray-500 dark:text-gray-400 text-xs ml-1">Retirada às {order.pickupTime}h</Text>
                        </View>
                        <Text className="text-tiffany font-extrabold text-sm">R$ {order.total.toFixed(2)}</Text>
                      </View>

                      {/* Alerta Visual Especial para Pedidos Prontos */}
                      {order.status === 'PRONTO' && (
                        <View className="mt-3 bg-emerald-500/10 p-3 rounded-xl flex-row items-center">
                          <Ionicons name="notifications" size={18} color="#059669" />
                          <Text className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold ml-2 flex-1">
                            Seu pedido está prontinho! Pode se dirigir à padaria para retirada.
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Seção 2: Histórico */}
            {historicOrders.length > 0 && (
              <View>
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Histórico Anterior</Text>
                {historicOrders.map((order: any) => {
                  const style = getStatusStyle(order.status);
                  const dateFormatted = new Date(order.pickupDate).toLocaleDateString('pt-BR');

                  return (
                    <View key={order.id} className="bg-white/70 dark:bg-zinc-800/60 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 shadow-sm mb-4">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-[10px] text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</Text>
                        <View className={`${style.bg} px-2 py-0.5 rounded`}>
                          <Text className={`${style.text} text-[9px] font-bold uppercase`}>{style.label}</Text>
                        </View>
                      </View>

                      <View className="my-1">
                        {order.items.map((item: any) => (
                          <Text key={item.id} className="text-gray-500 dark:text-gray-400 text-xs">
                            {item.quantity}x {item.product.name}
                          </Text>
                        ))}
                      </View>

                      <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-gray-400 text-[10px]">Retirado em {dateFormatted}</Text>
                        <Text className="text-gray-600 dark:text-gray-300 font-bold text-xs">R$ {order.total.toFixed(2)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

          </View>
        )}
      </View>
    </ScrollView>
  );
}
