import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  imageUrl: z.string().url('Deve ser uma URL válida de imagem'),
  productionTime: z.number().int().nonnegative('Tempo deve ser positivo'),
  tagsStr: z.string().optional(),
  nutritionalInfo: z.string().optional()
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AdminProductFormScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const colorScheme = useColorScheme();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState<any>(null);

  // Form setup
  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Pães',
      price: 10,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
      productionTime: 60,
      tagsStr: 'Artesanal',
      nutritionalInfo: ''
    }
  });

  // Carregar dados existentes em modo edição
  const { data: productData, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product-edit', id],
    queryFn: () => apiRequest(`/products/${id}`),
    enabled: isEdit
  });

  useEffect(() => {
    if (productData) {
      reset({
        name: productData.name,
        description: productData.description,
        category: productData.category,
        price: productData.price,
        imageUrl: productData.images[0] || '',
        productionTime: productData.productionTime,
        tagsStr: productData.tags?.join(', ') || '',
        nutritionalInfo: productData.nutritionalInfo || ''
      });
    }
  }, [productData]);

  // Mutação para Salvar Produto
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return apiRequest(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      }
      return apiRequest('/products', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Sucesso', isEdit ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
      router.replace('/(admin)/catalog');
    },
    onError: (err: any) => {
      Alert.alert('Erro ao salvar', err.message || 'Falha.');
    }
  });

  const onSubmit = (data: ProductFormData) => {
    const payload = {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      images: [data.imageUrl],
      isActive: true,
      productionTime: data.productionTime,
      tags: data.tagsStr ? data.tagsStr.split(',').map(t => t.trim()) : [],
      nutritionalInfo: data.nutritionalInfo,
      ingredients: [] // Conectado via backend/semente por simplicidade
    };
    saveMutation.mutate(payload);
  };

  // Gerador de Conteúdo e Visão de IA
  const handleAIAssistant = async (currentImageUrl: string) => {
    if (!currentImageUrl) {
      Alert.alert('Erro', 'Insira uma URL de imagem válida para a IA analisar.');
      return;
    }

    setAiLoading(true);
    try {
      const response = await apiRequest('/ai/generate-content', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: currentImageUrl })
      });

      if (response) {
        // Preencher formulário automaticamente
        setValue('name', response.productName || '');
        setValue('description', response.description || '');
        if (response.suggestedTags) {
          setValue('tagsStr', response.suggestedTags.join(', '));
        }

        setAiContent(response);
        Alert.alert('IA Completada!', 'Os campos Nome e Descrição foram preenchidos. Veja os materiais de redes sociais gerados abaixo.');
      }
    } catch (err: any) {
      Alert.alert('Erro na IA', err.message || 'Erro ao processar imagem.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <View className="flex-1 justify-center items-center bg-cream-light dark:bg-[#150d0a]">
        <ActivityIndicator size="large" color="#C0532E" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          className="flex-1 bg-cream-light dark:bg-[#150d0a]" 
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-[#FAF7F2] dark:bg-[#1a120e] border-b border-cream-dark/30 dark:border-zinc-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#C0532E" />
        </TouchableOpacity>
        <View>
          <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">Editor de Catálogo</Text>
          <Text className="text-xl font-bold text-terracotta dark:text-cream">{isEdit ? 'Editar Receita' : 'Nova Receita'}</Text>
        </View>
      </View>

      <View className="p-6 space-y-6">
        
        {/* URL Imagem */}
        <Controller
          control={control}
          name="imageUrl"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <Text className="text-xs font-semibold text-terracotta mb-1">URL DA IMAGEM DO PRODUTO</Text>
              <View className="flex-row">
                <TextInput
                  className="flex-1 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-l-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                  placeholder="URL da Imagem no Unsplash/Supabase"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity 
                  onPress={() => handleAIAssistant(value)}
                  disabled={aiLoading}
                  className="bg-tiffany px-4 items-center justify-center rounded-r-xl"
                >
                  {aiLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name="sparkles" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.imageUrl && <Text className="text-red-500 text-xs mt-1">{errors.imageUrl.message}</Text>}
              <Text className="text-[10px] text-gray-400 mt-1">
                Insira a URL e clique no botão de faísca 🌟 para que a IA gere o nome, descrição e material de redes sociais.
              </Text>
            </View>
          )}
        />

        {/* Nome */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-terracotta mb-1">NOME DO PRODUTO</Text>
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Ex: Pão Italiano Sourdough"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.name && <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>}
            </View>
          )}
        />

        {/* Categoria */}
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-terracotta mb-1">CATEGORIA</Text>
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Ex: Pães, Folhados, Doces"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.category && <Text className="text-red-500 text-xs mt-1">{errors.category.message}</Text>}
            </View>
          )}
        />

        {/* Preço e Tempo de Produção */}
        <View className="flex-row mt-4 space-x-4">
          <View className="flex-1 mr-2">
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Text className="text-xs font-semibold text-terracotta mb-1">PREÇO (R$)</Text>
                  <TextInput
                    className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                    placeholder="18.00"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={val => onChange(Number(val))}
                    value={value ? String(value) : ''}
                  />
                  {errors.price && <Text className="text-red-500 text-xs mt-1">{errors.price.message}</Text>}
                </View>
              )}
            />
          </View>

          <View className="flex-1">
            <Controller
              control={control}
              name="productionTime"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Text className="text-xs font-semibold text-terracotta mb-1">TEMPO (MINUTOS)</Text>
                  <TextInput
                    className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                    placeholder="120"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={val => onChange(Number(val))}
                    value={value ? String(value) : ''}
                  />
                  {errors.productionTime && <Text className="text-red-500 text-xs mt-1">{errors.productionTime.message}</Text>}
                </View>
              )}
            />
          </View>
        </View>

        {/* Descrição */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-terracotta mb-1">DESCRIÇÃO DA RECEITA</Text>
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Detalhes dos ingredientes, método..."
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            </View>
          )}
        />

        {/* Etiquetas */}
        <Controller
          control={control}
          name="tagsStr"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-terracotta mb-1">ETIQUETAS (SEPARADAS POR VÍRGULA)</Text>
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Ex: Novo, Mais Vendido, Integral"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            </View>
          )}
        />

        {/* Informação Nutricional */}
        <Controller
          control={control}
          name="nutritionalInfo"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-terracotta mb-1">INFORMAÇÃO NUTRICIONAL (OPCIONAL)</Text>
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Valor energético, glúten..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            </View>
          )}
        />

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={saveMutation.isPending}
          className="w-full bg-terracotta py-4 rounded-xl mt-6 items-center shadow-md active:opacity-90 flex-row justify-center"
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text className="text-white text-base font-bold ml-2 uppercase">Salvar Receita</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Marketing IA Box */}
        {aiContent && (
          <View className="mt-8 bg-white dark:bg-zinc-800 p-5 rounded-3xl border border-tiffany/30 shadow-sm space-y-4">
            <View className="flex-row items-center space-x-2 border-b border-gray-100 dark:border-zinc-700 pb-3">
              <Ionicons name="sparkles" size={20} color="#44A09E" />
              <Text className="font-bold text-tiffany text-sm uppercase tracking-wider ml-1">Copywriting de Marketing (IA)</Text>
            </View>

            <View className="space-y-4 mt-2">
              <View>
                <Text className="text-[10px] font-black text-terracotta uppercase">Instagram</Text>
                <Text className="text-gray-700 dark:text-gray-300 text-xs mt-1 leading-5 bg-cream-light p-3 rounded-xl">{aiContent.socialMedia?.instagram}</Text>
              </View>

              <View className="mt-3">
                <Text className="text-[10px] font-black text-terracotta uppercase">Status do WhatsApp</Text>
                <Text className="text-gray-700 dark:text-gray-300 text-xs mt-1 leading-5 bg-cream-light p-3 rounded-xl">{aiContent.socialMedia?.whatsappStatus}</Text>
              </View>

              <View className="mt-3">
                <Text className="text-[10px] font-black text-terracotta uppercase">Roteiro sugerido para Stories/Reels</Text>
                <View className="bg-cream-light p-3 rounded-xl space-y-1">
                  <Text className="text-gray-700 dark:text-gray-300 text-xs font-semibold">Cena 1: {aiContent.videoScript?.scene1}</Text>
                  <Text className="text-gray-700 dark:text-gray-300 text-xs font-semibold mt-1">Cena 2: {aiContent.videoScript?.scene2}</Text>
                  <Text className="text-gray-700 dark:text-gray-300 text-xs font-semibold mt-1">Cena 3: {aiContent.videoScript?.scene3}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
