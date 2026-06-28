import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, useColorScheme, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function loadPushPreference() {
      try {
        const optOut = await AsyncStorage.getItem('@divinopao_push_optout');
        if (optOut === 'true') {
          setPushEnabled(false);
        } else {
          setPushEnabled(true);
        }
      } catch (err) {
        console.warn(err);
      }
    }
    if (user) {
      loadPushPreference();
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome não pode ser vazio.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(name, phone);
      setEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair de sua conta?', [
      { text: 'Cancelar' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() }
    ]);
  };

  // Solicitar e registrar Token Push no servidor
  const toggleNotifications = async (value: boolean) => {
    setPushEnabled(value);
    if (!user) return;

    if (value) {
      // Ativar notificações
      if (Platform.OS === 'web') return;
      
      if (!Device.isDevice) {
        Alert.alert('Aviso ⚠️', 'Notificações push só funcionam em dispositivos físicos reais. Configure um EAS Project ID no seu app.json para habilitar em produção.');
        return;
      }

      setLoading(true);
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert('Permissão Negada ❌', 'Você precisa autorizar as notificações push nas configurações do sistema.');
          setPushEnabled(false);
          return;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
        if (!projectId) {
          Alert.alert('EAS Project Ausente ℹ️', 'As notificações push estão ativas no app por padrão, mas o token só pode ser gerado em produção após configurar o projectId no seu app.json.');
          await AsyncStorage.setItem('@divinopao_push_optout', 'false');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const pushToken = tokenData.data;

        await apiRequest(`/users/${user?.id}/push-token`, {
          method: 'PATCH',
          body: JSON.stringify({ pushToken })
        });

        await AsyncStorage.setItem('@divinopao_push_optout', 'false');
        Alert.alert('Notificações Ativadas 🎉', 'Você receberá avisos quando o pão estiver saindo do forno!');
      } catch (error: any) {
        console.error(error);
        Alert.alert('Erro', 'Falha ao configurar notificações push.');
        setPushEnabled(false);
      } finally {
        setLoading(false);
      }
    } else {
      // Inativar notificações
      setLoading(true);
      try {
        await apiRequest(`/users/${user?.id}/push-token`, {
          method: 'PATCH',
          body: JSON.stringify({ pushToken: null })
        });
        await AsyncStorage.setItem('@divinopao_push_optout', 'true');
        Alert.alert('Desativado 📴', 'Você não receberá mais notificações push neste aparelho.');
      } catch (err) {
        console.error(err);
        Alert.alert('Erro', 'Falha ao desativar notificações.');
        setPushEnabled(true);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) {
    return (
      <View className="flex-1 bg-cream-light dark:bg-[#150d0a] px-6 justify-center items-center">
        <View className="p-6 bg-white dark:bg-zinc-800 rounded-3xl items-center shadow-sm w-full border border-gray-100 dark:border-zinc-700">
          <Ionicons name="person-outline" size={64} color="#C0532E" />
          <Text className="text-xl font-bold text-terracotta mt-4 text-center">Minha Conta</Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center text-sm">
            Entre na sua conta para editar dados cadastrais, gerenciar endereços e configurar notificações push.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="mt-6 bg-terracotta px-8 py-3 rounded-full w-full items-center"
          >
            <Text className="text-white font-bold uppercase tracking-wider text-xs">Entrar na Conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-cream-light dark:bg-[#150d0a]">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-[#FAF7F2] dark:bg-[#1a120e] border-b border-cream-dark/30 dark:border-zinc-800">
        <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">Configurações</Text>
        <Text className="text-xl font-bold text-terracotta dark:text-cream">Minha Conta</Text>
      </View>

      <View className="p-6 space-y-6 pb-20">
        {/* Painel Administrativo de atalho se for admin */}
        {user.role === 'ADMINISTRADOR' && (
          <TouchableOpacity
            onPress={() => router.push('/(admin)/dashboard')}
            className="flex-row items-center bg-tiffany p-4 rounded-2xl shadow-sm mb-4"
          >
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
            <View className="ml-3 flex-1">
              <Text className="text-white font-bold text-sm">Acessar Painel Admin</Text>
              <Text className="text-white/80 text-xs">Gerenciar produtos, estoque, pedidos e IA.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Informações Gerais */}
        <View className="bg-white dark:bg-zinc-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-700">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-terracotta text-sm uppercase tracking-wider">Dados Pessoais</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={20} color="#C0532E" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setEditing(false)}>
                <Text className="text-xs text-gray-400 font-bold">Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View className="space-y-4">
              <View>
                <Text className="text-xs text-gray-400 font-semibold mb-1">Nome Completo</Text>
                <TextInput
                  className="bg-cream-light dark:bg-zinc-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-zinc-600 focus:border-terracotta"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs text-gray-400 font-semibold mb-1">WhatsApp / Celular</Text>
                <TextInput
                  className="bg-cream-light dark:bg-zinc-700 text-gray-800 dark:text-gray-100 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-zinc-600 focus:border-terracotta"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={loading}
                className="bg-terracotta py-3 rounded-xl mt-4 items-center justify-center"
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Salvar Dados</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-3">
              <View className="flex-row justify-between py-1 border-b border-gray-50 dark:border-zinc-700/50">
                <Text className="text-gray-400 text-sm">Nome</Text>
                <Text className="text-gray-800 dark:text-gray-200 font-semibold text-sm">{user.name}</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-gray-50 dark:border-zinc-700/50 mt-1">
                <Text className="text-gray-400 text-sm">E-mail</Text>
                <Text className="text-gray-800 dark:text-gray-200 font-semibold text-sm">{user.email}</Text>
              </View>
              <View className="flex-row justify-between py-1 border-b border-gray-50 dark:border-zinc-700/50 mt-1">
                <Text className="text-gray-400 text-sm">Celular</Text>
                <Text className="text-gray-800 dark:text-gray-200 font-semibold text-sm">{user.phone || 'Não informado'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Notificações Push Setup */}
        <View className="bg-white dark:bg-zinc-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-700 mt-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-4">
              <Text className="font-bold text-terracotta text-sm uppercase tracking-wider">Notificações Push</Text>
              <Text className="text-gray-400 text-xs mt-1">Receba avisos instantâneos quando o seu pão estiver saindo do forno.</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: '#44A09E' }}
              thumbColor={pushEnabled ? '#FAF7F2' : '#f4f3f4'}
              disabled={loading}
            />
          </View>
        </View>

        {/* Sair da Conta */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 p-4 rounded-2xl mt-6 active:opacity-90"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-red-500 font-bold ml-2">Sair da Minha Conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
