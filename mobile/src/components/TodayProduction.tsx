import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Clock, Plus } from 'lucide-react-native';

interface TodayProductionProps {
  production: any[];
  onProductPress: (id: string) => void;
}

export default function TodayProduction({
  production,
  onProductPress,
}: TodayProductionProps) {
  return (
    <View className="mt-8">
      <View className="px-6 flex-row items-center justify-between mb-2">
        <Text className="text-3xl text-terracotta dark:text-cream font-castle">
          Produção de Hoje
        </Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={production}
        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const available = item.targetQuantity - item.soldQuantity;

          return (
            <TouchableOpacity
              onPress={() => onProductPress(item.product.id)}
              activeOpacity={0.9}
              className="bg-white dark:bg-zinc-800 w-56 mr-4 rounded-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden"
            >
              {/* Imagem do Produto 100% Largura com Badge Flutuante */}
              <View className="relative w-full h-32 bg-gray-100">
                <Image
                  source={{ uri: item.product.images[0] }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              {/* Informações do Card */}
              <View className="p-3 justify-between flex-1">
                <View>
                  {/* Tempo previsto de saída */}
                  <View className="flex-row items-center">
                    <Clock size={12} color="#44A09E" />
                    <Text className="text-tiffany text-[11px] font-semibold ml-1">
                      Fresco às {item.estimatedTime}h
                    </Text>
                  </View>

                  {/* Título com quebra de linha e Fonte FinalSix (Secundária) */}
                  <Text
                    className="text-zinc-800 dark:text-gray-100 font-extrabold text-base mt-1.5 font-final leading-5"
                    numberOfLines={2}
                  >
                    {item.product.name}
                  </Text>
                </View>

                {/* Rodapé do Card: Preço maior e botão + */}
                <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-gray-50 dark:border-zinc-700">
                  <Text className="text-tiffany font-black text-2xl font-final">
                    R$ {item.product.price.toFixed(2)}
                  </Text>

                  {/* Botão arredondado de adicionar */}
                  <View className="w-8 h-8 rounded-full bg-terracotta items-center justify-center shadow-sm">
                    <Plus size={18} color="#FAF7F2" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
