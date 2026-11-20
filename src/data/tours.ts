import { FunctionsHttpError } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { cles } from './cles';

/** Tirage au sort de la tontine (événement « tirage ») et nombre de membres qui l'ont vu. */
export function useTirage(tontineId: string) {
  return useQuery({
    queryKey: ['tirage', tontineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evenements')
        .select('*')
        .eq('tontine_id', tontineId)
        .eq('type', 'tirage')
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const vues = await supabase
        .from('vues_tirage')
        .select('profil_id', { count: 'exact', head: true })
        .eq('evenement_id', data.id);
      return { evenement: data, vues: vues.count ?? 0 };
    },
  });
}

/** Appelle l'Edge Function « tirage-au-sort ». */
export function useLancerTirage(tontineId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('tirage-au-sort', {
        body: { tontine_id: tontineId },
      });
      if (error instanceof FunctionsHttpError) {
        const corps = await error.context.json().catch(() => null);
        throw new Error(corps?.error ?? 'inconnue');
      }
      if (error) throw error;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: cles.tontine(tontineId) });
      client.invalidateQueries({ queryKey: ['tirage', tontineId] });
    },
  });
}

export function useEchangerTours(tontineId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ a, b }: { a: string; b: string }) => {
      const { error } = await supabase.rpc('echanger_tours', { p_membre_a: a, p_membre_b: b });
      if (error) throw error;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: cles.tontine(tontineId) });
      client.invalidateQueries({ queryKey: cles.mesTontines });
    },
  });
}
