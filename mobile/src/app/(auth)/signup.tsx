import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform, ScrollView, Image } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import logoMarromNude from '../../../assets/LOGO MARROM COM NUDE.png';

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
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { control, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupFormData) => {
    if (!agreeTerms) {
      Alert.alert('Termos de Uso', 'Você precisa aceitar os Termos e a Política de Privacidade para continuar.');
      return;
    }
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
            <View className="flex-1 bg-white dark:bg-zinc-900 rounded-t-[40px] px-8 pt-8 pb-10 shadow-2xl">
              
              {/* Segmented Control Pill */}
              <View className="flex-row bg-[#FAF7F2] dark:bg-zinc-800 p-1.5 rounded-full border border-gray-100 dark:border-zinc-700/50 mb-6">
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity className="flex-1 py-3 rounded-full items-center justify-center">
                    <Text className="text-[#999] dark:text-zinc-400 font-semibold text-sm">Entrar</Text>
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity className="flex-1 py-3 rounded-full items-center justify-center bg-terracotta shadow-sm">
                  <Text className="text-white font-bold text-sm">Cadastrar</Text>
                </TouchableOpacity>
              </View>

              {/* Título de Cadastro */}
              <View className="mb-6 items-center">
                <Text className="text-2xl font-bold text-[#150d0a] dark:text-cream">
                  Criar uma Conta
                </Text>
                <Text className="text-[#999] dark:text-zinc-400 text-xs mt-1 text-center px-4">
                  Cadastre-se para aproveitar promoções e encomendar seus pães favoritos.
                </Text>
              </View>

              {/* Campos do Formulário */}
              <View className="space-y-3.5">
                
                {/* Nome Completo */}
                <View>
                  <Text className="text-xs font-semibold text-stone-400 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    Nome Completo
                  </Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className={`flex-row items-center bg-[#FAF7F2] dark:bg-zinc-800 px-4 py-3 rounded-2xl border ${nameFocused ? 'border-tiffany' : 'border-gray-100 dark:border-zinc-700'} shadow-sm`}>
                        <Ionicons name="person-outline" size={18} color="#44A09E" />
                        <TextInput
                          className="flex-1 ml-3 text-gray-800 dark:text-gray-100 text-sm py-1"
                          placeholder="Ex: João da Silva"
                          placeholderTextColor={isDark ? '#666' : '#999'}
                          onBlur={() => {
                            onBlur();
                            setNameFocused(false);
                          }}
                          onFocus={() => setNameFocused(true)}
                          onChangeText={onChange}
                          value={value}
                        />
                      </View>
                    )}
                  />
                  {errors.name && (
                    <Text className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.name.message}</Text>
                  )}
                </View>

                {/* E-mail */}
                <View className="mt-3">
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

                {/* Telefone */}
                <View className="mt-3">
                  <Text className="text-xs font-semibold text-stone-400 dark:text-zinc-300 mb-1 uppercase tracking-wider">
                    WhatsApp / Celular
                  </Text>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className={`flex-row items-center bg-[#FAF7F2] dark:bg-zinc-800 px-4 py-3 rounded-2xl border ${phoneFocused ? 'border-tiffany' : 'border-gray-100 dark:border-zinc-700'} shadow-sm`}>
                        <Ionicons name="logo-whatsapp" size={18} color="#44A09E" />
                        <TextInput
                          className="flex-1 ml-3 text-gray-800 dark:text-gray-100 text-sm py-1"
                          placeholder="Ex: 11999998888"
                          placeholderTextColor={isDark ? '#666' : '#999'}
                          onBlur={() => {
                            onBlur();
                            setPhoneFocused(false);
                          }}
                          onFocus={() => setPhoneFocused(true)}
                          onChangeText={onChange}
                          value={value}
                          keyboardType="phone-pad"
                        />
                      </View>
                    )}
                  />
                  {errors.phone && (
                    <Text className="text-red-500 text-xs mt-1 font-medium ml-1">{errors.phone.message}</Text>
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

                {/* Termos & Privacidade */}
                <View className="flex-row items-center mt-3">
                  <TouchableOpacity 
                    className="flex-row items-center flex-1" 
                    onPress={() => setAgreeTerms(!agreeTerms)}
                  >
                    <Ionicons 
                      name={agreeTerms ? "checkbox" : "square-outline"} 
                      size={20} 
                      color="#44A09E" 
                    />
                    <Text className="text-xs text-stone-400 dark:text-zinc-400 ml-2 mr-4">
                      Concordo com os Termos de Uso & Política de Privacidade.
                    </Text>
                  </TouchableOpacity>
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
                      Criar Conta
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Rodapé - Link para Login */}
              <View className="flex-row justify-center items-center mt-8">
                <Text className="text-stone-400 dark:text-zinc-400 text-sm">Já possui uma conta? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-tiffany font-bold text-sm underline">Entrar</Text>
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
