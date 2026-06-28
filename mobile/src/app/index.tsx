import React, { useEffect } from 'react';
import { View, Image, Text, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();

  // Animações com Reanimated
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);

  const startNavigation = () => {
    // Redirecionamento com base na sessão
    if (user) {
      if (user.role === 'ADMINISTRADOR') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(client)/home');
      }
    } else {
      router.replace('/(client)/home');
    }
  };

  useEffect(() => {
    // Iniciar animações de entrada (mais rápidas: 800ms)
    logoScale.value = withTiming(1.0, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });

    logoOpacity.value = withTiming(1.0, { duration: 600 });

    // Animação de subida e descida suave e rápida (efeito de carregamento)
    logoTranslateY.value = withDelay(
      800, // Inicia logo após a escala terminar
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(12, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Repete infinitamente
        true // Vai e volta
      )
    );

    // Quando o carregamento do Auth terminar, pré-carrega os dados do respectivo painel
    if (!isLoading) {
      const loadDataAndTransition = async () => {
        try {
          if (user) {
            if (user.role === 'ADMINISTRADOR') {
              // Pré-carrega dados do Admin Dashboard
              await Promise.all([
                queryClient.fetchQuery({
                  queryKey: ['admin-dashboard'],
                  queryFn: () => apiRequest('/dashboard')
                }),
                queryClient.fetchQuery({
                  queryKey: ['admin-ai-recommendations'],
                  queryFn: () => apiRequest('/ai/recommendations')
                })
              ]);
            } else {
              // Pré-carrega dados do Client Home
              await Promise.all([
                queryClient.fetchQuery({
                  queryKey: ['products', 'Todos', ''],
                  queryFn: () => apiRequest('/products?category=&search=')
                }),
                queryClient.fetchQuery({
                  queryKey: ['production-today'],
                  queryFn: () => apiRequest('/production')
                })
              ]);
            }
          } else {
            // Visitante comum (abre home do cliente)
            await Promise.all([
              queryClient.fetchQuery({
                queryKey: ['products', 'Todos', ''],
                queryFn: () => apiRequest('/products?category=&search=')
              }),
              queryClient.fetchQuery({
                queryKey: ['production-today'],
                queryFn: () => apiRequest('/production')
              })
            ]);
          }
        } catch (error) {
          console.warn('Erro ao pré-carregar dados na splash:', error);
        } finally {
          // Assim que terminar de carregar, para a flutuação e inicia o zoom
          logoTranslateY.value = withTiming(0, { duration: 150 });

          // Zoom rápido de saída consumindo a tela
          logoScale.value = withTiming(25.0, {
            duration: 700,
            easing: Easing.bezier(0.3, 0, 0.8, 0.15)
          });

          logoOpacity.value = withDelay(
            450,
            withTiming(0, { duration: 250 })
          );

          setTimeout(() => {
            startNavigation();
          }, 700);
        }
      };

      loadDataAndTransition();
    }
  }, [isLoading, user]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value },
        { translateY: logoTranslateY.value }
      ],
      opacity: logoOpacity.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  // Logo adaptativa para dark/light mode
  const logoSource = isDark
    ? require('../../assets/LOGO BRANCO COM NUDE.png')
    : require('../../assets/LOGO MARROM COM NUDE.png');

  return (
    <View className="flex-1 items-center justify-center bg-tiffany-light dark:bg-[#1a120e]">
      <View className="items-center justify-center p-4">
        {/* Logo Animada */}
        <Animated.View style={logoAnimatedStyle} className="w-[650px] h-[650px] items-center justify-center">
          <Image
            source={logoSource}
            style={{ width: 650, height: 650 }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}
