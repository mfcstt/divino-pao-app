import React from 'react';
import { View, Text, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChefHat } from 'lucide-react-native';

export default function HomeHeader() {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <View className="px-6 pt-14 pb-12 bg-tiffany">
      {/* Logo
      <View className="items-start">
        <Image
          source={require('../../assets/LOGO BRANCO COM NUDE.png')}
          style={{ width: 200, height: 50 }}
          resizeMode="contain"
        />
      </View> */}

      {/* Linha Inferior: Saudação e UX Writing Acolhedor */}
      <View className="mt-6">
        <Text className="text-cream-light/90 text-sm font-medium">
          {getGreeting()}{user ? `, ${user.name.split(' ')[0]}` : ''}!
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-white text-2xl font-bold leading-7 mr-1.5 font-castle">
            O que vamos encomendar hoje?
          </Text>
          <ChefHat size={24} color="#FAF7F2" />
        </View>
      </View>
    </View>
  );
}
