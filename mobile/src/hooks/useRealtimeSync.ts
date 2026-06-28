import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validar se as chaves são reais antes de instanciar o cliente
const isRealSupabase = 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' && 
  !supabaseUrl.includes('seu-projeto-supabase') && 
  !supabaseUrl.includes('divino-pao.supabase.co');

export const supabase = isRealSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) {
      console.warn('[Supabase Realtime] Chaves do Supabase não configuradas ou fictícias no .env. Sincronização em tempo real desativada.');
      return;
    }

    console.log('[Supabase Realtime] Conectando ao canal de atualizações...');

    const databaseChannel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'DailyProduction' },
        (payload) => {
          console.log('[Realtime] Produção diária alterada:', payload);
          // Invalidar consultas para forçar o TanStack Query a recarregar
          queryClient.invalidateQueries({ queryKey: ['production-today'] });
          queryClient.invalidateQueries({ queryKey: ['admin-production-today'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Order' },
        (payload) => {
          console.log('[Realtime] Novo pedido cadastrado:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Ingredient' },
        (payload) => {
          console.log('[Realtime] Estoque de ingrediente alterado:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-ingredients'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        }
      )
      .subscribe((status) => {
        console.log(`[Supabase Realtime] Status da conexão: ${status}`);
      });

    return () => {
      console.log('[Supabase Realtime] Removendo canal de atualizações...');
      supabase.removeChannel(databaseChannel);
    };
  }, [queryClient]);
}
export default useRealtimeSync;
