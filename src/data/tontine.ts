import { useQuery } from '@tanstack/react-query';

import type { Tables } from '@/lib/database.types';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

import { cles } from './cles';

export type MembreAvecProfil = Tables<'membres'> & {
  profil: { prenom: string; telephone: string } | null;
};

export type DonneesTontine = {
  tontine: Tables<'tontines'>;
  /** Membres actifs (les membres retirés sont exclus). */
  membres: MembreAvecProfil[];
  /** Tous les membres, y compris retirés (noms dans l'historique). */
  tousMembres: MembreAvecProfil[];
  tours: Tables<'tours'>[];
  cotisations: Tables<'cotisations'>[];
  reglement: Tables<'reglements'> | null;
  monMembre: MembreAvecProfil | null;
  estGerante: boolean;
};

export function prenomDe(membres: MembreAvecProfil[], membreId: string | null | undefined): string {
  return membres.find((m) => m.id === membreId)?.profil?.prenom ?? '—';
}

export async function chargerTontine(id: string, uid: string): Promise<DonneesTontine> {
  const [t, m, tr, r] = await Promise.all([
    supabase.from('tontines').select('*').eq('id', id).single(),
    supabase
      .from('membres')
      .select('*, profil:profils_publics(prenom, telephone)')
      .eq('tontine_id', id)
      .order('rang'),
    supabase.from('tours').select('*').eq('tontine_id', id).order('numero'),
    supabase
      .from('reglements')
      .select('*')
      .eq('tontine_id', id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  for (const res of [t, m, tr, r]) if (res.error) throw res.error;
  const tours = tr.data ?? [];
  const c = await supabase
    .from('cotisations')
    .select('*')
    .in(
      'tour_id',
      tours.map((x) => x.id),
    );
  if (c.error) throw c.error;
  const tousMembres = (m.data ?? []) as unknown as MembreAvecProfil[];
  const membres = tousMembres.filter((x) => !x.retire_at);
  return {
    tontine: t.data!,
    membres,
    tousMembres,
    tours,
    cotisations: c.data ?? [],
    reglement: r.data ?? null,
    monMembre: membres.find((x) => x.profil_id === uid) ?? null,
    estGerante: t.data!.gerante_id === uid,
  };
}

/** Toutes les données d'une tontine (RLS : seulement si on en est membre). */
export function useTontine(id: string) {
  const { session } = useSession();
  const uid = session?.user.id ?? '';
  return useQuery({
    queryKey: cles.tontine(id),
    queryFn: () => chargerTontine(id, uid),
    enabled: !!id && !!uid,
  });
}

/** Historique horodaté d'un membre (écran 13c), construit à partir des événements (P4). */
export function useEvenementsMembre(tontineId: string, membreId: string) {
  return useQuery({
    queryKey: cles.historiqueMembre(tontineId, membreId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evenements')
        .select('*')
        .eq('tontine_id', tontineId)
        .eq('membre_id', membreId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
