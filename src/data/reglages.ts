import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import { cles } from './cles';

function useRafraichir(tontineId: string) {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: cles.tontine(tontineId) });
    client.invalidateQueries({ queryKey: ['historique', tontineId] });
    client.invalidateQueries({ queryKey: ['evenements', tontineId] });
    client.invalidateQueries({ queryKey: cles.mesTontines });
  };
}

export type Reglages = { jMoins3: boolean; jourJ: boolean; jPlus1: boolean; penalite: number };

export function useModifierReglages(tontineId: string) {
  const rafraichir = useRafraichir(tontineId);
  return useMutation({
    mutationFn: async (r: Reglages) => {
      const { error } = await supabase.rpc('modifier_reglages', {
        p_tontine_id: tontineId,
        p_j_moins_3: r.jMoins3,
        p_jour_j: r.jourJ,
        p_j_plus_1: r.jPlus1,
        p_penalite: r.penalite,
      });
      if (error) throw error;
    },
    onSuccess: rafraichir,
  });
}

export function useModifierReglement(tontineId: string) {
  const rafraichir = useRafraichir(tontineId);
  return useMutation({
    mutationFn: async (lignes: string[]) => {
      const { error } = await supabase.rpc('modifier_reglement', {
        p_tontine_id: tontineId,
        p_lignes_libres: lignes,
      });
      if (error) throw error;
    },
    onSuccess: rafraichir,
  });
}

export function useAccepterReglement(tontineId: string) {
  const rafraichir = useRafraichir(tontineId);
  return useMutation({
    mutationFn: async (version: number) => {
      const { error } = await supabase.rpc('accepter_reglement', {
        p_tontine_id: tontineId,
        p_version: version,
      });
      if (error) throw error;
    },
    onSuccess: rafraichir,
  });
}

export function useRelancer(tontineId: string) {
  const rafraichir = useRafraichir(tontineId);
  return useMutation({
    mutationFn: async (membreId?: string) => {
      const { data, error } = await supabase.rpc('relancer', {
        p_tontine_id: tontineId,
        ...(membreId ? { p_membre_id: membreId } : {}),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: rafraichir,
  });
}

export function useAnnulerPenalite(tontineId: string) {
  const rafraichir = useRafraichir(tontineId);
  return useMutation({
    mutationFn: async (evenementId: string) => {
      const { error } = await supabase.rpc('annuler_penalite', { p_evenement_id: evenementId });
      if (error) throw error;
    },
    onSuccess: rafraichir,
  });
}

/** Pénalités et annulations de la tontine (événements). */
export function useEvenementsPenalites(tontineId: string) {
  return useQuery({
    queryKey: ['evenements', tontineId, 'penalites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evenements')
        .select('id, type, donnees, membre_id')
        .eq('tontine_id', tontineId)
        .in('type', ['penalite', 'penalite_annulee']);
      if (error) throw error;
      return data;
    },
  });
}

/** Écran 22 : mes notifications (les 100 dernières). */
export function useNotifications() {
  return useQuery({
    queryKey: cles.notifications,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export async function marquerNotificationsLues(): Promise<void> {
  await supabase
    .from('notifications')
    .update({ lu_at: new Date().toISOString() })
    .is('lu_at', null);
}
