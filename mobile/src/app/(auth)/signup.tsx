import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';

const signupSchema = z.object({
  name: z.string().min(3, 'O nome deve conter pelo menos 3 caracteres'),
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
  phone: z.string().min(10, 'O telefone deve conter no mínimo 10 dígitos (com DDD)'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres')
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { control, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    try {
      await signUp(data.name, data.email, data.password, data.phone);
      Alert.alert('Conta Criada!', 'Seja bem-vindo à Família Divino Pão!');
    } catch (error: any) {
      Alert.alert('Erro no Cadastro', error.message || 'Houve um problema ao criar a sua conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          className="flex-1 bg-cream-light dark:bg-[#1a120e]"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6">
        <Text className="text-3xl font-extrabold text-terracotta dark:text-cream">
          Criar Conta
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Cadastre-se para aproveitar promoções e fazer encomendas exclusivas.
        </Text>
      </View>

      {/* Formulário */}
      <View className="space-y-4">
        {/* Nome */}
        <View>
          <Text className="text-xs font-semibold text-terracotta dark:text-cream mb-1 uppercase tracking-wider">
            Nome Completo
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Ex: João da Silva"
                placeholderTextColor={isDark ? '#666' : '#999'}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.name && (
            <Text className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</Text>
          )}
        </View>

        {/* E-mail */}
        <View className="mt-3">
          <Text className="text-xs font-semibold text-terracotta dark:text-cream mb-1 uppercase tracking-wider">
            E-mail
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Ex: joao@gmail.com"
                placeholderTextColor={isDark ? '#666' : '#999'}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</Text>
          )}
        </View>

        {/* Telefone */}
        <View className="mt-3">
          <Text className="text-xs font-semibold text-terracotta dark:text-cream mb-1 uppercase tracking-wider">
            WhatsApp / Telefone
          </Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="Ex: 11999998888"
                placeholderTextColor={isDark ? '#666' : '#999'}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
              />
            )}
          />
          {errors.phone && (
            <Text className="text-red-500 text-xs mt-1 font-medium">{errors.phone.message}</Text>
          )}
        </View>

        {/* Senha */}
        <View className="mt-3">
          <Text className="text-xs font-semibold text-terracotta dark:text-cream mb-1 uppercase tracking-wider">
            Senha
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="w-full bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:border-terracotta"
                placeholder="••••••"
                placeholderTextColor={isDark ? '#666' : '#999'}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</Text>
          )}
        </View>

        {/* Botão de Enviar */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full bg-terracotta py-4 rounded-xl mt-6 items-center shadow-md active:opacity-90"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold uppercase tracking-wider">
              Criar Minha Conta
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Voltar */}
      <View className="flex-row justify-center items-center mt-6">
        <Text className="text-gray-500 dark:text-gray-400 text-sm">Já possui uma conta? </Text>
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="text-tiffany font-bold text-sm">Entrar</Text>
          </TouchableOpacity>
        </Link>
      </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
