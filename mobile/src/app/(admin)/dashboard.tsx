import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';
import { Croissant, Wheat, ChefHat, ShoppingBag } from 'lucide-react-native';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // 1. Carregar Métricas do Dashboard
  const { data: dashboardData, isLoading: loadingDash, refetch: refetchDash, isRefetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiRequest('/dashboard')
  });

  // 2. Carregar Recomendações da IA
  const { data: aiRecommendations = [], isLoading: loadingAi, refetch: refetchAi } = useQuery({
    queryKey: ['admin-ai-recommendations'],
    queryFn: () => apiRequest('/ai/recommendations')
  });

  useFocusEffect(
    useCallback(() => {
      refetchDash();
      refetchAi();
    }, [refetchDash, refetchAi])
  );

  const onRefresh = async () => {
    await Promise.all([refetchDash(), refetchAi()]);
  };

  const getAiCardColor = (type: string) => {
    switch (type) {
      case 'ESTOQUE':
        return { border: 'border-red-100 dark:border-red-950', bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-800 dark:text-red-300', icon: 'cube' };
      case 'PRODUCAO':
        return { border: 'border-orange-100 dark:border-orange-950', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-800 dark:text-orange-300', icon: 'restaurant' };
      case 'OPORTUNIDADE':
        return { border: 'border-amber-100 dark:border-amber-950', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-800 dark:text-amber-300', icon: 'flash' };
      default:
        return { border: 'border-gray-100 dark:border-zinc-800', bg: 'bg-gray-50 dark:bg-zinc-800/20', text: 'text-zinc-700 dark:text-zinc-300', icon: 'bulb' };
    }
  };

  if (loadingDash) {
    return (
      <View className="flex-1 justify-center items-center bg-cream-light dark:bg-[#150d0a]">
        <ActivityIndicator size="large" color="#44A09E" />
      </View>
    );
  }

  const summary = dashboardData?.summary || {
    pedidosDoDia: 0,
    faturamentoDoDia: 0,
    faturamentoMensal: 0,
    ticketMedio: 0,
    clientesRecorrentes: 0,
    pedidosPendentes: 0,
    pedidosConcluidos: 0,
    alertasEstoqueCount: 0
  };

  return (
    <ScrollView
      className="flex-1 bg-tiffany"
      contentContainerStyle={{ flexGrow: 1 }}
      bounces={true}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* Header Premium Tiffany */}
      <View className="px-6 pt-14 pb-10 bg-tiffany dark:bg-[#1d3d3c] flex-row justify-between items-center">
        <View>
          <Text className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Painel do Administrador</Text>
          <Text className="text-2xl font-black text-white mt-0.5">Dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.replace('/(client)/home')}
          className="bg-white/15 px-4 py-2.5 rounded-full flex-row items-center border border-white/20 active:opacity-90 shadow-sm"
        >
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text className="text-white text-xs font-bold ml-1.5">Ver Loja</Text>
        </TouchableOpacity>
      </View>

      {/* Card Cream-Light de Conteúdo */}
      <View className="flex-1 bg-cream-light dark:bg-[#150d0a] rounded-t-[40px] p-6 space-y-6 pb-20 shadow-2xl">

        {/* Atalhos de Ação Rápidos (Uma única linha horizontal estilo Categorias) */}
        <View className="mb-2">
          <Text className="text-xs font-bold text-stone-400 dark:text-zinc-300 uppercase tracking-wider mb-3">Painel de Controle</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="-mx-6 py-1"
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {/* Encomendas */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/orders')}
              className="px-4 py-2.5 rounded-full mr-3 border flex-row items-center justify-center bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm active:opacity-90"
            >
              <ShoppingBag size={14} color={isDark ? '#ccc' : '#666'} />
              <Text className="text-gray-600 dark:text-gray-300 font-semibold text-xs ml-1.5">
                Encomendas
              </Text>
            </TouchableOpacity>

            {/* Produção */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/production')}
              className="px-4 py-2.5 rounded-full mr-3 border flex-row items-center justify-center bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm active:opacity-90"
            >
              <ChefHat size={14} color={isDark ? '#ccc' : '#666'} />
              <Text className="text-gray-600 dark:text-gray-300 font-semibold text-xs ml-1.5">
                Produção
              </Text>
            </TouchableOpacity>

            {/* Estoque */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/ingredients')}
              className="px-4 py-2.5 rounded-full mr-3 border flex-row items-center justify-center bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm active:opacity-90"
            >
              <Wheat size={14} color={isDark ? '#ccc' : '#666'} />
              <Text className="text-gray-600 dark:text-gray-300 font-semibold text-xs ml-1.5">
                Estoque
              </Text>
            </TouchableOpacity>

            {/* Catálogo */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/catalog')}
              className="px-4 py-2.5 rounded-full mr-3 border flex-row items-center justify-center bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-sm active:opacity-90"
            >
              <Croissant size={14} color={isDark ? '#ccc' : '#666'} />
              <Text className="text-gray-600 dark:text-gray-300 font-semibold text-xs ml-1.5">
                Catálogo
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Alertas de Estoque */}
        {summary.alertasEstoqueCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(admin)/ingredients')}
            className="bg-red-500/10 p-4 rounded-3xl border border-red-900/20 flex-row items-center justify-between mb-2 shadow-sm shadow-red-500/5 active:opacity-90"
          >
            <View className="flex-row items-center">
              <Ionicons name="warning" size={22} color="#EF4444" />
              <View className="ml-3">
                <Text className="text-red-500 font-bold text-sm">Estoque Crítico!</Text>
                <Text className="text-red-500/80 text-xs">{summary.alertasEstoqueCount} insumos abaixo do mínimo.</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Indicadores Financeiros Rápidos */}
        <View className="flex-row mb-6 mt-2">
          {/* Faturamento do Dia */}
          <View className="bg-white dark:bg-[#1a120e] p-4 rounded-2xl border border-tiffany/20 dark:border-zinc-800 shadow-sm flex-1 mr-2">
            <View className="flex-row items-center mb-1.5">
              <View className="bg-tiffany/10 p-1.5 rounded-xl mr-2">
                <Ionicons name="cash-outline" size={14} color="#44A09E" />
              </View>
              <Text className="text-[9px] text-tiffany font-bold uppercase tracking-wider">Hoje</Text>
            </View>
            <Text className="text-lg font-black text-tiffany dark:text-cream mt-0.5">
              R$ {summary.faturamentoDoDia.toFixed(2)}
            </Text>
            <Text className="text-[9px] text-stone-400 dark:text-zinc-500 font-semibold mt-1">{summary.pedidosDoDia} encomendas</Text>
          </View>

          {/* Faturamento do Mês */}
          <View className="bg-white dark:bg-[#1a120e] p-4 rounded-2xl border border-terracotta/20 dark:border-zinc-800 shadow-sm flex-1 ml-2">
            <View className="flex-row items-center mb-1.5">
              <View className="bg-terracotta/10 p-1.5 rounded-xl mr-2">
                <Ionicons name="trending-up-outline" size={14} color="#68492E" />
              </View>
              <Text className="text-[9px] text-terracotta font-bold uppercase tracking-wider">Mês</Text>
            </View>
            <Text className="text-lg font-black text-terracotta dark:text-terracotta-light mt-0.5">
              R$ {summary.faturamentoMensal.toFixed(2)}
            </Text>
            <Text className="text-[9px] text-stone-400 dark:text-zinc-500 font-semibold mt-1">Média: R$ {summary.ticketMedio.toFixed(2)}</Text>
          </View>
        </View>

        {/* Recomendação da IA (Destaque do Dashboard) */}
        <View className="mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-stone-400 dark:text-zinc-300 uppercase tracking-wider">
              Insights do Agente IA 🤖
            </Text>
            <TouchableOpacity onPress={() => refetchAi()} className="p-1 active:opacity-75">
              <Ionicons name="refresh" size={16} color="#44A09E" />
            </TouchableOpacity>
          </View>
          {loadingAi ? (
            <ActivityIndicator color="#44A09E" className="py-6" />
          ) : aiRecommendations.length === 0 ? (
            <View className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
              <Text className="text-zinc-500 dark:text-zinc-400 text-xs text-center">Nenhum insight disponível no momento.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              {aiRecommendations.map((rec: any) => {
                const styles = getAiCardColor(rec.type);
                return (
                  <View
                    key={rec.id}
                    className={`w-72 bg-white dark:bg-zinc-900 p-4 rounded-3xl border ${styles.border} shadow-sm mr-4`}
                  >
                    <View className="flex-row items-center space-x-2 mb-2">
                      <View className={`${styles.bg} p-2 rounded-xl`}>
                        <Ionicons name={styles.icon as any} size={15} color={rec.type === 'OPORTUNIDADE' ? '#E1AF31' : rec.type === 'ESTOQUE' ? '#EF4444' : '#44A09E'} />
                      </View>
                      <Text className="text-[10px] font-black uppercase text-stone-400 dark:text-zinc-400 ml-1.5">{rec.type}</Text>
                    </View>
                    <Text className={`text-xs ${styles.text} font-medium leading-5`} numberOfLines={3}>
                      {rec.message}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Produção Diária (Status Hoje) */}
        {dashboardData?.producaoDoDia && dashboardData.producaoDoDia.length > 0 && (
          <View className="bg-white dark:bg-zinc-900 p-5 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm pb-6 mb-12">
            <Text className="text-xs font-bold text-stone-400 dark:text-zinc-300 uppercase tracking-wider mb-4">
              Status da Produção do Dia
            </Text>
            {dashboardData.producaoDoDia.map((p: any) => (
              <View key={p.name} className="mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold">{p.name}</Text>
                  <Text className="text-zinc-500 dark:text-zinc-400 text-[10px]">{p.sold} de {p.target} vendidos ({p.time}h)</Text>
                </View>
                {/* Barra de Progresso */}
                <View className="w-full bg-cream-light dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <View
                    style={{ width: `${Math.min(100, p.progress)}%` }}
                    className="bg-terracotta h-full rounded-full"
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
