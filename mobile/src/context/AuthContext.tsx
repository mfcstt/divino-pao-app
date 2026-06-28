import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiRequest } from '../services/api';

// Função para registrar o push token de forma silenciosa em background
export async function registerPushNotificationsAsync(userId: string) {
  if (Platform.OS === 'web') return null;
  
  // Verificar se o usuário desativou as notificações no perfil
  try {
    const optOut = await AsyncStorage.getItem('@divinopao_push_optout');
    if (optOut === 'true') {
      console.log('[Push Service] Registro ignorado: Usuário optou por desativar notificações.');
      return null;
    }
  } catch (err) {
    console.warn('Erro ao ler opt-out de notificações:', err);
  }

  if (!Device.isDevice) {
    console.warn('[Push Service] Notificações push ignoradas em emuladores.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push Service] Permissão de notificações negada pelo usuário.');
      return null;
    }

    // Obter o ID do projeto EAS de forma segura
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[Push Service] EAS projectId não encontrado no app.json. Registrando em modo local offline.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData.data;

    // Enviar o token para o backend
    await apiRequest(`/users/${userId}/push-token`, {
      method: 'PATCH',
      body: JSON.stringify({ pushToken })
    });

    console.log('[Push Service] Token push registrado com sucesso:', pushToken);
    return pushToken;
  } catch (error) {
    console.warn('[Push Service] Erro silencioso ao configurar notificações push:', error);
    return null;
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENTE' | 'ADMINISTRADOR';
  phone?: string;
  pushToken?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Carregar sessão no boot do aplicativo
  useEffect(() => {
    async function loadSession() {
      try {
        const token = await AsyncStorage.getItem('@divinopao_token');
        if (token) {
          // Carregar os dados de sessão do Better Auth
          const sessionData = await apiRequest('/auth/get-session');
          if (sessionData && sessionData.user) {
            setUser(sessionData.user);
            registerPushNotificationsAsync(sessionData.user.id);
          } else {
            // Token expirado ou inválido
            await AsyncStorage.removeItem('@divinopao_token');
          }
        }
      } catch (error) {
        console.warn('Erro ao restaurar sessão:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response && response.token) {
        await AsyncStorage.setItem('@divinopao_token', response.token);
        setUser(response.user);
        registerPushNotificationsAsync(response.user.id);

        // Redirecionamento automático baseado na role
        if (response.user.role === 'ADMINISTRADOR') {
          router.replace('/(admin)/dashboard');
        } else {
          router.replace('/(client)/home');
        }
      } else {
        throw new Error('Falha na autenticação.');
      }
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string, phone: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('/auth/sign-up/email', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone, role: 'CLIENTE' })
      });

      if (response && response.token) {
        await AsyncStorage.setItem('@divinopao_token', response.token);
        setUser(response.user);
        registerPushNotificationsAsync(response.user.id);
        router.replace('/(client)/home');
      } else {
        throw new Error('Erro ao registrar usuário.');
      }
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('/auth/sign-out', { method: 'POST' }).catch(() => {});
    } finally {
      await AsyncStorage.removeItem('@divinopao_token');
      setUser(null);
      setIsLoading(false);
      router.replace('/(client)/home');
    }
  };

  const updateProfile = async (name: string, phone: string) => {
    if (!user) return;
    try {
      const updatedUser = await apiRequest(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, phone })
      });
      setUser(prev => prev ? { ...prev, name: updatedUser.name, phone: updatedUser.phone } : null);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signUp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
