import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, TextInput, ActivityIndicator, useColorScheme, Modal, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const orderSchema = z.object({
  pickupDate: z.string().min(1, 'Data é obrigatória'),
  pickupTime: z.string().min(1, 'Horário é obrigatório'),
  notes: z.string().optional()
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // 1. Carregar Detalhes do Produto
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiRequest(`/products/${id}`)
  });

  // 2. Carregar Favoritos do Usuário (se logado) para marcar se é favorito
  const { data: favorites = [], refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiRequest('/favorites'),
    enabled: !!user
  });

  const isFavorited = favorites.some((f: any) => f.id === id);

  // 3. Mutação para favoritar/desfavoritar
  const toggleFavoriteMutation = useMutation({
    mutationFn: () => {
      if (isFavorited) {
        return apiRequest(`/favorites/${id}`, { method: 'DELETE' });
      }
      return apiRequest('/favorites', {
        method: 'POST',
        body: JSON.stringify({ productId: id })
      });
    },
    onSuccess: () => {
      refetchFavorites();
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  });

  // 4. Mutação para criar Encomenda
  const orderMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      Alert.alert('Encomenda Realizada!', 'Sua encomenda foi registrada. Acompanhe o status na aba Pedidos.');
      setOrderModalOpen(false);
      router.push('/(client)/orders');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['production-today'] });
    },
    onError: (err: any) => {
      Alert.alert('Erro ao encomendar', err.message || 'Erro inesperado.');
    }
  });

  const handleFavoritePress = () => {
    if (!user) {
      Alert.alert('Login Obrigatório', 'Faça login para salvar seus produtos favoritos.', [
        { text: 'Cancelar' },
        { text: 'Entrar', onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  const handleOrderSubmit = (data: OrderFormData) => {
    if (!user) return;
    
    // Normalizar a data selecionada (e.g. DD/MM/AAAA para ISO)
    const [day, month, year] = data.pickupDate.split('/');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);

    const payload = {
      clientName: user.name,
      clientPhone: user.phone || '0000000000',
      pickupDate: dateObj.toISOString(),
      pickupTime: data.pickupTime,
      notes: data.notes || '',
      paymentMethod: 'PIX', // Padrão
      items: [
        {
          productId: id,
          quantity
        }
      ]
    };

    orderMutation.mutate(payload);
  };

  const { control, handleSubmit, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      pickupDate: new Date(Date.now() + 86400000).toLocaleDateString('pt-BR'), // Amanhã
      pickupTime: '15:00',
      notes: ''
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-cream-light dark:bg-[#150d0a]">
        <ActivityIndicator size="large" color="#C0532E" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 justify-center items-center bg-cream-light dark:bg-[#150d0a] px-6">
        <Text className="text-gray-500 dark:text-gray-400 font-medium">Erro ao carregar produto.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-terracotta px-6 py-2 rounded-full">
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream-light dark:bg-[#150d0a]">
      {/* Botão flutuante para voltar */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-12 left-6 z-10 w-10 h-10 bg-white/95 dark:bg-zinc-800/90 rounded-full items-center justify-center shadow-md"
      >
        <Ionicons name="arrow-back" size={24} color="#C0532E" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Imagem do Produto */}
        <Image 
          source={{ uri: product.images[0] }} 
          className="w-full h-80 bg-gray-200" 
          resizeMode="cover"
        />

        {/* Detalhes do Produto */}
        <View className="p-6 bg-cream-light dark:bg-[#150d0a] -mt-6 rounded-t-3xl border-t border-cream-dark/20 dark:border-zinc-800">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-2xl font-bold text-gray-800 dark:text-cream">{product.name}</Text>
              <Text className="text-tiffany text-xs font-bold uppercase mt-1 tracking-wider">{product.category}</Text>
            </View>
            <TouchableOpacity onPress={handleFavoritePress} className="p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
              <Ionicons 
                name={isFavorited ? "heart" : "heart-outline"} 
                size={26} 
                color={isFavorited ? "#E1AF31" : "#999"} 
              />
            </TouchableOpacity>
          </View>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-3 gap-2">
              {product.tags.map((tag: string) => (
                <View key={tag} className="bg-terracotta/10 px-2.5 py-1 rounded-full">
                  <Text className="text-terracotta text-[10px] font-bold">{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Preço */}
          <Text className="text-terracotta text-2xl font-black mt-4">
            R$ {product.price.toFixed(2)}
          </Text>

          {/* Descrição */}
          <Text className="text-gray-600 dark:text-gray-300 text-sm mt-4 leading-6">
            {product.description}
          </Text>

          <View className="h-[1px] bg-gray-200 dark:bg-zinc-800 my-6" />

          {/* Ingredientes (Ficha Técnica) */}
          <Text className="text-sm font-bold text-terracotta dark:text-cream uppercase tracking-wider mb-3">
            Ingredientes & Processo
          </Text>
          {product.ingredients && product.ingredients.length > 0 ? (
            <View className="space-y-2">
              {product.ingredients.map((item: any) => (
                <View key={item.id} className="flex-row items-center justify-between py-1 border-b border-gray-100 dark:border-zinc-800/50">
                  <Text className="text-gray-700 dark:text-gray-300 text-sm">{item.ingredient.name}</Text>
                  <Text className="text-gray-500 text-xs font-semibold">{item.quantity} {item.ingredient.unit}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-400 text-xs">Informação de ingredientes indisponível.</Text>
          )}

          {/* Info Nutricional (Opcional) */}
          {product.nutritionalInfo && (
            <View className="mt-6">
              <Text className="text-sm font-bold text-terracotta dark:text-cream uppercase tracking-wider mb-2">
                Tabela Nutricional
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs italic leading-5">
                {product.nutritionalInfo}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Barra de Ação Inferior (Encomendar) */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 p-6 flex-row justify-between items-center shadow-lg">
        <View>
          <Text className="text-gray-400 text-xs">Preço Total</Text>
          <Text className="text-terracotta text-xl font-extrabold">R$ {(product.price * quantity).toFixed(2)}</Text>
        </View>

        {user ? (
          <TouchableOpacity 
            onPress={() => setOrderModalOpen(true)}
            className="bg-terracotta px-8 py-3.5 rounded-full shadow-md active:opacity-90"
          >
            <Text className="text-white font-bold tracking-wider">Encomendar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login')}
            className="bg-tiffany px-6 py-3.5 rounded-full shadow-md active:opacity-90"
          >
            <Text className="text-white font-bold tracking-wider text-xs">Entrar para Comprar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal de Encomenda */}
      <Modal
        visible={orderModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setOrderModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-cream-light dark:bg-zinc-900 rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-lg font-bold text-terracotta dark:text-cream">Finalizar Encomenda</Text>
              <TouchableOpacity onPress={() => setOrderModalOpen(false)}>
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Seletor de Quantidade */}
            <View className="flex-row items-center justify-between mb-6 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-gray-100 dark:border-zinc-700">
              <Text className="font-semibold text-gray-700 dark:text-gray-200">Quantidade</Text>
              <View className="flex-row items-center space-x-4">
                <TouchableOpacity 
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 bg-gray-100 dark:bg-zinc-700 rounded-full items-center justify-center"
                >
                  <Ionicons name="remove" size={18} color="#C0532E" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-800 dark:text-cream px-2">{quantity}</Text>
                <TouchableOpacity 
                  onPress={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 bg-gray-100 dark:bg-zinc-700 rounded-full items-center justify-center"
                >
                  <Ionicons name="add" size={18} color="#C0532E" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Input de Data */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-terracotta mb-1">DATA DE RETIRADA (DD/MM/AAAA)</Text>
              <Controller
                control={control}
                name="pickupDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                    placeholder="Ex: 29/06/2026"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.pickupDate && (
                <Text className="text-red-500 text-xs mt-1">{errors.pickupDate.message}</Text>
              )}
            </View>

            {/* Input de Horário */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-terracotta mb-1">HORÁRIO DE RETIRADA (HH:MM)</Text>
              <Controller
                control={control}
                name="pickupTime"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                    placeholder="Ex: 15:30"
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.pickupTime && (
                <Text className="text-red-500 text-xs mt-1">{errors.pickupTime.message}</Text>
              )}
            </View>

            {/* Observações */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-terracotta mb-1">OBSERVAÇÕES (OPCIONAL)</Text>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                    placeholder="Ex: Bem torrado, cortar fatiado..."
                    placeholderTextColor="#999"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />
            </View>

            {/* Confirmar */}
            <TouchableOpacity
              onPress={handleSubmit(handleOrderSubmit)}
              disabled={orderMutation.isPending}
              className="w-full bg-terracotta py-4 rounded-xl items-center shadow-md active:opacity-90 flex-row justify-center"
            >
              {orderMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text className="text-white text-base font-bold ml-2 uppercase">Confirmar Encomenda</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </Modal>
    </View>
  );
}
