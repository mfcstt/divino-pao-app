import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import '../../global.css';
import * as Notifications from 'expo-notifications';

// Configurar o Handler de notificações em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient();

import { useRealtimeSync } from '../hooks/useRealtimeSync';

function AppSyncWrapper({ children }: { children: React.ReactNode }) {
  useRealtimeSync();
  return <>{children}</>;
}

import { useColorScheme as useTailwindColorScheme } from 'nativewind';
import { useEffect } from 'react';

export default function RootLayout() {
  const { setColorScheme } = useTailwindColorScheme();
  
  useEffect(() => {
    // Força o Tailwind/NativeWind a sempre usar estilos claros (nude/branco)
    setColorScheme('light');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={DefaultTheme}>
          <AppSyncWrapper>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(client)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(admin)" options={{ animation: 'fade' }} />
            </Stack>
          </AppSyncWrapper>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export { ErrorBoundary } from 'expo-router';
