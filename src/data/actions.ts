import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { cles } from './cles';

/** Rafraîchit la tontine et l'accueil après une action. */
function useInvalider(tontineId: string) {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: cles.tontine(tontineId) });
    client.invalidateQueries({ queryKey: cles.mesTontines });
    client.invalidateQueries({ queryKey: ['historique', tontineId] });
  };
}

export function useConfirmerPaiement(tontineId: string) {
  const invalider = useInvalider(tontineId);
  return useMutation({
    mutationFn: async (cotisationId: string) => {
      const { error } = await supabase.rpc('confirmer_paiement', {
        p_cotisation_id: cotisationId,
      });
      if (error) throw error;
    },
    onSuccess: invalider,
  });
}

export function useMarquerVerse(tontineId: string) {
  const invalider = useInvalider(tontineId);
  return useMutation({
    mutationFn: async (tourId: string) => {
      const { data, error } = await supabase.rpc('marquer_verse', { p_tour_id: tourId });
      if (error) throw error;
      return data;
    },
    onSuccess: invalider,
  });
}

export { useInvalider };
