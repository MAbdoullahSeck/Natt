import { useQuery } from '@tanstack/react-query';

import { palierActif, type Abonnement } from '@/domain/abonnement';
import type { Tables } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { cles } from './cles';

/** Abonnements de l'utilisatrice connectée (RLS : seulement les siens). */
export function useAbonnements() {
  return useQuery({
    queryKey: cles.abonnements,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abonnements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Tables<'abonnements'>[];
    },
  });
}

export function usePalierActif() {
  const requete = useAbonnements();
  return { ...requete, palier: palierActif((requete.data ?? []) as Abonnement[]) };
}
