import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '../../services/api';

const recoverSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
});

type RecoverFormData = z.infer<typeof recoverSchema>;

export default function RecoverScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { control, handleSubmit, formState: { errors } } = useForm<RecoverFormData>({
    resolver: zodResolver(recoverSchema)
  });

  const onSubmit = async (data: RecoverFormData) => {
    setLoading(true);
    try {
      // Chamaria rota de reset no Better Auth: /api/auth/forget-password
      await apiRequest('/auth/forget-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email })
      }).catch(() => {}); // Omitir erro se rota de mailer não estiver configurada

      Alert.alert(
        'Solicitação Enviada',
        'Se o e-mail estiver cadastrado, você receberá um link de recuperação em instantes.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar solicitação de recuperação.');
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
      <View className="mb-6">
        <Text className="text-3xl font-extrabold text-terracotta dark:text-cream">
          Recuperar Senha
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Insira seu e-mail cadastrado e enviaremos um link para redefinir a sua senha.
        </Text>
      </View>

      <View className="space-y-4">
        {/* E-mail */}
        <View>
          <Text className="text-xs font-semibold text-terracotta dark:text-cream mb-1 uppercase tracking-wider">
            E-mail Cadastrado
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
              Enviar Link
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Voltar */}
      <View className="flex-row justify-center items-center mt-6">
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity>
            <Text className="text-tiffany font-bold text-sm">Voltar para o Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
