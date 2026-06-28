import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

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
        return { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-800', icon: 'cube' };
      case 'PRODUCAO':
        return { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-800', icon: 'restaurant' };
      case 'OPORTUNIDADE':
        return { border: 'border-gold-300', bg: 'bg-gold-50', text: 'text-gold-dark', icon: 'flash' };
      default:
        return { border: 'border-zinc-200', bg: 'bg-zinc-50', text: 'text-zinc-700', icon: 'bulb' };
    }
  };

  if (loadingDash) {
    return (
      <View className="flex-1 justify-center items-center bg-milk-light">
        <ActivityIndicator size="large" color="#68492E" />
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
      className="flex-1 bg-milk-light"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#68492E" />}
    >
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-white border-b border-milk-dark/30 flex-row justify-between items-center">
        <View>
          <Text className="text-xs text-zinc-500 font-medium">Painel do Administrador</Text>
          <Text className="text-xl font-bold text-zinc-800">Dashboard de Gestão</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.replace('/(client)/home')} 
          className="bg-terracotta/10 px-4 py-2 rounded-full flex-row items-center border border-terracotta/20"
        >
          <Ionicons name="eye-outline" size={16} color="#68492E" />
          <Text className="text-terracotta text-xs font-bold ml-1">Ver Loja</Text>
        </TouchableOpacity>
      </View>

      <View className="p-6 space-y-6">
        
        {/* Recomendação da IA (Destaque do Dashboard) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-zinc-800 uppercase tracking-wider">
              Insights do Agente IA 🤖
            </Text>
            <TouchableOpacity onPress={() => refetchAi()} className="p-1">
              <Ionicons name="refresh" size={16} color="#68492E" />
            </TouchableOpacity>
          </View>
          {loadingAi ? (
            <ActivityIndicator color="#68492E" className="py-6" />
          ) : aiRecommendations.length === 0 ? (
            <View className="bg-white p-4 rounded-2xl border border-milk-dark/30">
              <Text className="text-zinc-500 text-xs text-center">Nenhum insight disponível no momento.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="space-x-4">
              {aiRecommendations.map((rec: any) => {
                const styles = getAiCardColor(rec.type);
                return (
                  <View 
                    key={rec.id} 
                    className={`w-72 bg-white p-4 rounded-2xl border ${styles.border} shadow-sm mr-4`}
                  >
                    <View className="flex-row items-center space-x-2 mb-2">
                      <View className={`${styles.bg} p-2 rounded-lg`}>
                        <Ionicons name={styles.icon as any} size={16} color={rec.type === 'OPORTUNIDADE' ? '#E1AF31' : rec.type === 'ESTOQUE' ? '#EF4444' : '#68492E'} />
                      </View>
                      <Text className="text-[10px] font-black uppercase text-zinc-500 ml-1">{rec.type}</Text>
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

        {/* Indicadores Financeiros Rápidos */}
        <View className="flex-row mb-6">
          {/* Faturamento do Dia */}
          <View className="bg-white p-4 rounded-3xl border border-milk-dark/30 shadow-sm flex-1 mr-2">
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">Faturamento Dia</Text>
            <Text className="text-lg font-black text-emerald-600 mt-1">
              R$ {summary.faturamentoDoDia.toFixed(2)}
            </Text>
            <Text className="text-[9px] text-zinc-500 mt-2">{summary.pedidosDoDia} encomendas</Text>
          </View>

          {/* Faturamento do Mês */}
          <View className="bg-white p-4 rounded-3xl border border-milk-dark/30 shadow-sm flex-1 ml-2">
            <Text className="text-zinc-500 text-[10px] uppercase font-bold">Faturamento Mês</Text>
            <Text className="text-lg font-black text-terracotta mt-1">
              R$ {summary.faturamentoMensal.toFixed(2)}
            </Text>
            <Text className="text-[9px] text-zinc-500 mt-2">Média: R$ {summary.ticketMedio.toFixed(2)}</Text>
          </View>
        </View>

        {/* Alertas de Estoque */}
        {summary.alertasEstoqueCount > 0 && (
          <TouchableOpacity 
            onPress={() => router.push('/(admin)/ingredients')}
            className="bg-red-500/10 p-4 rounded-3xl border border-red-900/30 flex-row items-center justify-between mb-6"
          >
            <View className="flex-row items-center">
              <Ionicons name="warning" size={24} color="#EF4444" />
              <View className="ml-3">
                <Text className="text-red-400 font-bold text-sm">Alerta de Estoque Crítico!</Text>
                <Text className="text-red-400/80 text-xs">{summary.alertasEstoqueCount} ingredientes abaixo do mínimo.</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Atalhos de Ação Rápidos (Grid de Navegação) */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-3">Painel de Controle</Text>
          
          <View className="space-y-3">
            {/* Gerenciar Encomendas */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/orders')}
              className="flex-row items-center bg-white p-4 rounded-2xl border border-milk-dark/30 mb-3"
            >
              <View className="bg-terracotta/10 p-2 rounded-xl">
                <Ionicons name="cart" size={20} color="#68492E" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-zinc-800 font-bold text-sm">Gerenciar Encomendas</Text>
                <Text className="text-zinc-500 text-xs">{summary.pedidosPendentes} pendentes hoje</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#a09996" />
            </TouchableOpacity>

            {/* Programar Produção Diária */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/production')}
              className="flex-row items-center bg-white p-4 rounded-2xl border border-milk-dark/30 mb-3"
            >
              <View className="bg-tiffany/10 p-2 rounded-xl">
                <Ionicons name="restaurant" size={20} color="#44A09E" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-zinc-800 font-bold text-sm">Programar Produção</Text>
                <Text className="text-zinc-500 text-xs">Definir quotas e saídas diárias</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#a09996" />
            </TouchableOpacity>

            {/* Controle de Estoque de Ingredientes */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/ingredients')}
              className="flex-row items-center bg-white p-4 rounded-2xl border border-milk-dark/30 mb-3"
            >
              <View className="bg-blue-50 p-2 rounded-xl">
                <Ionicons name="cube" size={20} color="#3B82F6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-zinc-800 font-bold text-sm">Estoque de Ingredientes</Text>
                <Text className="text-zinc-500 text-xs">Cadastrar insumos e dar baixas</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#a09996" />
            </TouchableOpacity>

            {/* Cadastro de Catálogo (CRUD) */}
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/catalog')}
              className="flex-row items-center bg-white p-4 rounded-2xl border border-milk-dark/30 mb-3"
            >
              <View className="bg-gold/10 p-2 rounded-xl">
                <Ionicons name="list" size={20} color="#E1AF31" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-zinc-800 font-bold text-sm">Catálogo de Produtos</Text>
                <Text className="text-zinc-500 text-xs">Adicionar e editar receitas</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#a09996" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Produção Diária (Status Hoje) */}
        {dashboardData?.producaoDoDia && dashboardData.producaoDoDia.length > 0 && (
          <View className="bg-white p-5 rounded-3xl border border-milk-dark/30 shadow-sm pb-6 mb-12">
            <Text className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4">
              Status da Produção do Dia
            </Text>
            {dashboardData.producaoDoDia.map((p: any) => (
              <View key={p.name} className="mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-zinc-800 text-xs font-semibold">{p.name}</Text>
                  <Text className="text-zinc-500 text-[10px]">{p.sold} de {p.target} vendidos ({p.time}h)</Text>
                </View>
                {/* Barra de Progresso */}
                <View className="w-full bg-milk-light h-2 rounded-full overflow-hidden">
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
