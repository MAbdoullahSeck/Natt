import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { cles } from './cles';

export type LigneMesTontines = Database['public']['Functions']['mes_tontines']['Returns'][number];

/** Écran 05 : mes tontines (gérées et rejointes). */
export function useMesTontines() {
  return useQuery({
    queryKey: cles.mesTontines,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('mes_tontines');
      if (error) throw error;
      return data;
    },
  });
}
