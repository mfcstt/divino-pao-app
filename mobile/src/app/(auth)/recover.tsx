import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import logoMarromNude from '../../../assets/LOGO MARROM COM NUDE.png';

const recoverSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
});

type RecoverFormData = z.infer<typeof recoverSchema>;

export default function RecoverScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { control, handleSubmit, formState: { errors } } = useForm<RecoverFormData>({
    resolver: zodResolver(recoverSchema)
  });

  const onSubmit = async (data: RecoverFormData) => {
    setLoading(true);
    try {
      await apiRequest('/auth/forget-password', {
        method: 'POST',
        body: JSON.stringify({ email: data.email })
      }).catch(() => {});

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
      className="flex-1 bg-tiffany"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-tiffany">
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Botão de Voltar */}
            <TouchableOpacity 
              onPress={() => router.back()}
              className="absolute top-14 left-6 w-11 h-11 bg-white dark:bg-zinc-850 rounded-full justify-center items-center shadow-sm z-10 active:opacity-90 border border-gray-100 dark:border-zinc-800"
            >
              <Ionicons name="arrow-back" size={20} color="#44A09E" />
            </TouchableOpacity>

            {/* Cabeçalho com o Logotipo Oficial Branco com Nude */}
            <View className="h-[290px] justify-center items-center pt-8">
              <Image 
                source={logoMarromNude} 
                style={{ width: 550, height: 550 }} 
                resizeMode="contain" 
              />
            </View>

            {/* Card Branco de Formulário */}
            <View className="flex-1 bg-white dark:bg-zinc-900 rounded-t-[40px] px-8 pt-10 pb-10 shadow-2xl">
              
              {/* Título de Recuperação */}
              <View className="mb-8 items-center">
                <Text className="text-2xl font-bold text-[#150d0a] dark:text-cream">
                  Recuperar Senha
                </Text>
                <Text className="text-[#999] dark:text-zinc-400 text-xs mt-1 text-center px-4">
                  Insira o seu e-mail cadastrado abaixo e enviaremos as instruções para você redefinir a sua senha.
                </Text>
              </View>

              {/* Campos do Formulário */}
              <View className="space-y-4">
                
                {/* E-mail */}
                <View>
                  <Text className="text-xs font-semibold text-stone-400 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    E-mail Cadastrado
                  </Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className={`flex-row items-center bg-[#FAF7F2] dark:bg-zinc-800 px-4 py-3 rounded-2xl border ${emailFocused ? 'border-tiffany' : 'border-gray-100 dark:border-zinc-700'} shadow-sm`}>
                        <Ionicons name="mail-outline" size={18} color="#44A09E" />
                        <TextInput
                          className="flex-1 ml-3 text-gray-800 dark:text-gray-100 text-sm py-1"
                          placeholder="seuemail@exemplo.com"
                          placeholderTextColor={isDark ? '#666' : '#999'}
                          onBlur={() => {
                            onBlur();
                            setEmailFocused(false);
                          }}
                          onFocus={() => setEmailFocused(true)}
                          onChangeText={onChange}
                          value={value}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                    )}
                  />
                  {errors.email && (
                    <Text className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.email.message}</Text>
                  )}
                </View>

                {/* Botão Enviar */}
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading}
                  className="mt-6 bg-terracotta py-4 rounded-2xl items-center justify-center shadow-sm shadow-terracotta/20 active:opacity-90"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-sm uppercase tracking-wider">
                      Enviar Link
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Rodapé - Link para Login */}
              <View className="flex-row justify-center items-center mt-12">
                <Text className="text-stone-400 dark:text-zinc-400 text-sm">Lembrou da senha? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-tiffany font-bold text-sm underline">Fazer Login</Text>
                  </TouchableOpacity>
                </Link>
              </View>

            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
