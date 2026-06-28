import { Platform } from 'react-native';

import Constants from 'expo-constants';

const getBaseUrl = () => {
  // 1. Prioriza a URL definida manualmente no .env (essencial para dispositivos físicos)
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }

  if (__DEV__) {
    // 2. Fallback de captura automática de IP
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3000`;
    }
    
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }
  return 'https://divino-pao-backend.onrender.com';
};

export const BASE_URL = getBaseUrl();
export const API_URL = `${BASE_URL}/api`;

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Custom headers
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Origin', BASE_URL);

  // Adicionar Token JWT/Better Auth persistido
  try {
    const token = await AsyncStorage.getItem('@divinopao_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch (err) {
    console.error('Erro ao ler token do armazenamento:', err);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro de requisição: ${response.status}`);
    }

    // Se a resposta for vazia (ex: no-content)
    if (response.status === 204) return null;

    return await response.json();
  } catch (error: any) {
    console.error(`[API Request Error] ${url}:`, error.message);
    throw error;
  }
}
