import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Coffee, Plus, Calendar } from 'lucide-react-native';

interface ProductCatalogProps {
  products: any[];
  loadingProducts: boolean;
  production: any[];
  onProductPress: (id: string) => void;
}

export default function ProductCatalog({
  products,
  loadingProducts,
  production,
  onProductPress,
}: ProductCatalogProps) {
  // Helper para verificar se o produto está na produção de hoje
  const getProductProductionInfo = (productId: string) => {
    const prodItem = production.find((p: any) => p.productId === productId);
    if (!prodItem) return null;
    const available = prodItem.targetQuantity - prodItem.soldQuantity;
    return {
      available,
      estimatedTime: prodItem.estimatedTime
    };
  };

  return (
    <View className="px-6 mt-12 pb-20">
      <Text className="text-3xl text-terracotta dark:text-cream font-castle">
        Catálogo Completo
      </Text>
      <View className="flex-row items-center flex-wrap mt-1 mb-5">
        <Text className="text-gray-500 dark:text-gray-400 text-xs font-final">
          Garanta o que está saindo do forno com{' '}
        </Text>
        <View className="w-4 h-4 rounded-full bg-terracotta items-center justify-center mr-1">
          <Plus size={10} color="#FAF7F2" />
        </View>
        <Text className="text-gray-500 dark:text-gray-400 text-xs font-final">
          ou planeje a sua encomenda com{' '}
        </Text>
        <View className="w-4 h-4 rounded-full border border-terracotta bg-white dark:bg-zinc-800 items-center justify-center mr-1">
          <Calendar size={9} color="#68492E" />
        </View>
        <Text className="text-gray-500 dark:text-gray-400 text-xs font-final">
          .
        </Text>
      </View>
      {loadingProducts ? (
        <ActivityIndicator size="large" color="#44A09E" className="mt-8" />
      ) : products.length === 0 ? (
        <View className="items-center justify-center py-12">
          <Coffee size={48} color="#ccc" />
          <Text className="text-gray-400 dark:text-gray-500 mt-2 font-medium font-final">
            Nenhum produto encontrado.
          </Text>
        </View>
      ) : (
        <View className="space-y-4">
          {products.map((item: any) => {
            const prodInfo = getProductProductionInfo(item.id);
            const isTodayProduction = prodInfo !== null && prodInfo.available > 0;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => onProductPress(item.id)}
                activeOpacity={0.9}
                className="flex-row bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700 mb-4 items-center overflow-hidden"
              >
                {/* Imagem do Produto ocupando 100% da altura e lateral esquerda */}
                <Image
                  source={{ uri: item.images[0] }}
                  className="w-28 h-28 bg-gray-100"
                  resizeMode="cover"
                />

                {/* Conteúdo com preenchimento interno correto */}
                <View className="flex-1 ml-4 justify-between h-28 py-3 pr-4">
                  <View>
                    <Text className="text-zinc-800 dark:text-gray-100 font-bold text-base font-final" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-gray-400 dark:text-gray-400 text-xs mt-0.5 font-final" numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>

                  {/* Preço, Tag de Status e Botão + */}
                  <View className="flex-row justify-between items-center mt-1">
                    <View className="flex-row items-center">
                      <Text className="text-tiffany font-black text-lg mr-2 font-final">
                        R$ {item.price.toFixed(2)}
                      </Text>

                      {/* Disponibilidade Status Tag */}
                      {isTodayProduction ? (
                        <View className="bg-tiffany/10 px-2 py-0.5 rounded">
                          <Text className="text-[9px] text-tiffany font-bold uppercase font-final">
                            Hoje
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-gray-50 dark:bg-zinc-700 px-2 py-0.5 rounded">
                          <Text className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase font-final">
                            Encomenda
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Botão de Ação Diferenciado por Disponibilidade */}
                    {isTodayProduction ? (
                      <View className="w-8 h-8 rounded-full bg-terracotta items-center justify-center shadow-sm">
                        <Plus size={18} color="#FAF7F2" />
                      </View>
                    ) : (
                      <View className="w-8 h-8 rounded-full border border-terracotta bg-white dark:bg-zinc-800 items-center justify-center shadow-sm">
                        <Calendar size={16} color="#68492E" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
