import React, { useEffect } from 'react';
import { View, Image, Text, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing, 
  runOnJS 
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animações com Reanimated
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

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
    // Iniciar animações de entrada
    logoScale.value = withTiming(1.0, {
      duration: 1500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    
    logoOpacity.value = withTiming(1.0, { duration: 1200 });

    textOpacity.value = withDelay(
      800,
      withTiming(1.0, { duration: 1000 })
    );

    // Quando o carregamento do Auth terminar, aguardar o fim da animação e transicionar
    if (!isLoading) {
      const timer = setTimeout(() => {
        // Animação de saída esmaecendo tudo antes de transicionar
        logoOpacity.value = withTiming(0, { duration: 500 });
        textOpacity.value = withTiming(0, { duration: 500 });
        
        setTimeout(() => {
          startNavigation();
        }, 500);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
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
    <View className="flex-1 items-center justify-center bg-cream-light dark:bg-[#1a120e]">
      <View className="items-center justify-center p-4">
        {/* Logo Animada */}
        <Animated.View style={logoAnimatedStyle} className="w-56 h-56 items-center justify-center">
          <Image 
            source={logoSource} 
            style={{ width: 220, height: 220 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Nome Comercial com Animação de Entrada */}
        <Animated.View style={textAnimatedStyle} className="mt-6 items-center">
          <Text className="text-terracotta text-2xl font-bold tracking-widest uppercase">
            Divino Pão
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1 tracking-wide font-light italic">
            Panificação Artesanal & Premium
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
