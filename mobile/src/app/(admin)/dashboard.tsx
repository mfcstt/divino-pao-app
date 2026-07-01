import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';
import { Croissant, Wheat, ChefHat, ShoppingBag } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
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

  const getFormattedDate = () => {
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const d = new Date();
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
  };

  return (
    <ScrollView
      className="flex-1 bg-terracotta"
      contentContainerStyle={{ flexGrow: 1 }}
      bounces={true}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* Header Premium Terracotta */}
      <View className="px-6 pt-14 pb-10 bg-terracotta dark:bg-[#3d271d] flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-[10px] text-white/70 font-semibold uppercase tracking-wider mb-2">Painel da loja</Text>
          
          <View className="flex-row items-center mb-1">
            <Text className="text-3xl text-white mr-2 font-castle">Olá, Sheila</Text>
            <ChefHat size={22} color="#fff" />
          </View>
          
          <Text className="text-xs text-tiffany font-bold">{getFormattedDate()}</Text>
        </View>

        <View className="flex-row items-center mt-1">
          <TouchableOpacity
            onPress={logout}
            className="p-2 mr-1 active:opacity-70"
          >
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace('/(client)/home')}
            className="bg-white/15 px-4 py-2.5 rounded-full flex-row items-center border border-white/20 active:opacity-90 shadow-sm"
          >
            <Ionicons name="eye-outline" size={16} color="#fff" />
            <Text className="text-white text-xs font-bold ml-1.5">Ver Loja</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Cream-Light de Conteúdo */}
      <View className="flex-1 bg-cream-light dark:bg-[#150d0a] rounded-t-[40px] p-6 space-y-6 pb-20 shadow-2xl">

        {/* O botão "Ver Loja" já está no cabeçalho. As antigas pílulas de atalho foram movidas para a Navbar inferior. */}

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

        {/* Produção Diária (Status Hoje) */}
        {dashboardData?.producaoDoDia && dashboardData.producaoDoDia.length > 0 && (
          <View className="bg-white dark:bg-[#1a120e] p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm mb-6">
            <View className="flex-row items-center mb-6">
              <View className="bg-terracotta/10 p-2.5 rounded-2xl mr-3">
                <Ionicons name="pie-chart-outline" size={20} color="#68492E" />
              </View>
              <View>
                <Text className="text-xs font-black text-terracotta uppercase tracking-wider">
                  Produção & Vendas
                </Text>
                <Text className="text-[9px] text-stone-400 dark:text-zinc-500 font-bold uppercase mt-0.5">Acompanhamento Diário</Text>
              </View>
            </View>

            {dashboardData.producaoDoDia.map((p: any) => {
              const perc = Math.min(100, Math.round(p.progress || 0));
              return (
                <View key={p.name} className="mb-5 last:mb-1">
                  <View className="flex-row justify-between items-end mb-2">
                    <View>
                      <Text className="text-zinc-800 dark:text-zinc-100 text-sm font-bold">{p.name}</Text>
                      <Text className="text-stone-400 dark:text-zinc-500 text-[10px] font-bold mt-0.5">META: {p.target} UN</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-tiffany font-black text-lg">{p.sold} <Text className="text-[10px] text-stone-400 font-semibold tracking-wide">VENDIDOS</Text></Text>
                      <Text className="text-terracotta font-bold text-[10px]">{perc}% concluído</Text>
                    </View>
                  </View>
                  {/* Barra de Progresso */}
                  <View className="w-full bg-cream-dark/30 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                    <View
                      style={{ width: `${perc}%` }}
                      className={`${perc >= 100 ? 'bg-emerald-500' : 'bg-tiffany'} h-full rounded-full`}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recomendação da IA (Destaque do Dashboard) */}
        {/* <View className="mb-2">
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
        </View> */}


      </View>
    </ScrollView>
  );
}
