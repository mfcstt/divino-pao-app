import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres')
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (error: any) {
      Alert.alert('Erro de Acesso', error.message || 'E-mail ou senha incorretos.');
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
        <View className="flex-1 bg-cream-light dark:bg-[#1a120e] px-6 justify-center">
      {/* Botão de Fechar / Acessar sem Login */}
      <TouchableOpacity 
        onPress={() => router.replace('/(client)/home')}
        className="absolute top-12 right-6 p-2 bg-white dark:bg-zinc-800 rounded-full shadow-sm"
      >
        <Text className="text-terracotta font-medium text-xs">Pular Login</Text>
      </TouchableOpacity>

      <View className="mb-8">
        <Text className="text-3xl font-extrabold text-terracotta dark:text-cream">
          Bem-vindo!
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Faça login para encomendar seus pães favoritos.
        </Text>
      </View>

      {/* Formulário */}
      <View className="space-y-4">
        <View>
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

        <View className="mt-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xs font-semibold text-terracotta dark:text-cream uppercase tracking-wider">
              Senha
            </Text>
            <Link href="/(auth)/recover" asChild>
              <TouchableOpacity>
                <Text className="text-xs text-tiffany font-medium">Esqueceu a senha?</Text>
              </TouchableOpacity>
            </Link>
          </View>
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

        {/* Botão de Submit */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full bg-terracotta py-4 rounded-xl mt-6 items-center shadow-md active:opacity-90"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold uppercase tracking-wider">
              Entrar
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Rodapé - Link para Cadastro */}
      <View className="flex-row justify-center items-center mt-8">
        <Text className="text-gray-500 dark:text-gray-400 text-sm">Novo na padaria? </Text>
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity>
            <Text className="text-tiffany font-bold text-sm">Criar Conta</Text>
          </TouchableOpacity>
        </Link>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
