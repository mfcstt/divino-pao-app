import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import logoMarromNude from '../../../assets/LOGO MARROM COM NUDE.png';

const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('Formato de e-mail inválido'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres')
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
            {/* Botão de Voltar / Pular Login */}
            <TouchableOpacity
              onPress={() => router.replace('/(client)/home')}
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
            <View className="flex-1 bg-white dark:bg-zinc-900 rounded-t-[40px] px-8 pt-8 pb-10 shadow-2xl">

              {/* Segmented Control Pill */}
              <View className="flex-row bg-[#FAF7F2] dark:bg-zinc-800 p-1.5 rounded-full border border-gray-100 dark:border-zinc-700/50 mb-6">
                <TouchableOpacity className="flex-1 py-3 rounded-full items-center justify-center bg-terracotta shadow-sm">
                  <Text className="text-white font-bold text-sm">Entrar</Text>
                </TouchableOpacity>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity className="flex-1 py-3 rounded-full items-center justify-center">
                    <Text className="text-[#999] dark:text-zinc-400 font-semibold text-sm">Cadastrar</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Título de Boas-Vindas */}
              <View className="mb-6 items-center">
                <Text className="text-2xl font-bold text-[#150d0a] dark:text-cream">
                  Seja Bem-vindo!
                </Text>
                <Text className="text-[#999] dark:text-zinc-400 text-xs mt-1 text-center px-4">
                  Faça login para gerenciar suas encomendas e saborear as delícias do dia.
                </Text>
              </View>

              {/* Campos do Formulário */}
              <View className="space-y-4">

                {/* E-mail */}
                <View>
                  <Text className="text-xs font-semibold text-stone-400 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    E-mail
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

                {/* Senha */}
                <View className="mt-3">
                  <Text className="text-xs font-semibold text-stone-400 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    Senha
                  </Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className={`flex-row items-center bg-[#FAF7F2] dark:bg-zinc-800 px-4 py-3 rounded-2xl border ${passwordFocused ? 'border-tiffany' : 'border-gray-100 dark:border-zinc-700'} shadow-sm`}>
                        <Ionicons name="lock-closed-outline" size={18} color="#44A09E" />
                        <TextInput
                          className="flex-1 ml-3 text-gray-800 dark:text-gray-100 text-sm py-1"
                          placeholder="Digite sua senha"
                          placeholderTextColor={isDark ? '#666' : '#999'}
                          onBlur={() => {
                            onBlur();
                            setPasswordFocused(false);
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          onChangeText={onChange}
                          value={value}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#999" />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.password && (
                    <Text className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.password.message}</Text>
                  )}
                </View>

                {/* Lembrar-me e Esqueci Senha */}
                <View className="flex-row justify-between items-center mt-3">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <Ionicons
                      name={rememberMe ? "checkbox" : "square-outline"}
                      size={20}
                      color="#44A09E"
                    />
                    <Text className="text-xs text-stone-400 dark:text-zinc-400 ml-2">Lembrar de mim</Text>
                  </TouchableOpacity>
                  <Link href="/(auth)/recover" asChild>
                    <TouchableOpacity>
                      <Text className="text-xs text-tiffany font-semibold">Esqueceu a senha?</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

                {/* Botão Entrar */}
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading}
                  className="mt-6 bg-terracotta py-4 rounded-2xl items-center justify-center shadow-sm shadow-terracotta/20 active:opacity-90"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-sm uppercase tracking-wider">
                      Entrar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Rodapé - Link para Cadastro */}
              <View className="flex-row justify-center items-center mt-8">
                <Text className="text-stone-400 dark:text-zinc-400 text-sm">Não tem uma conta? </Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity>
                    <Text className="text-tiffany font-bold text-sm underline">Cadastre-se</Text>
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

