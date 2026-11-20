import type { TourDonnees } from './tontine';

/** Point 6 : retrait d'un membre par la gérante (miroir de la fonction SQL retirer_membre). */
export type PossibiliteRetrait =
  | { possible: true; choixDuMode: boolean }
  | { possible: false; raison: 'gerante' | 'deja_servi' | 'terminee' };

export function possibiliteRetrait(params: {
  statutTontine: 'en_preparation' | 'en_cours' | 'terminee';
  estLaGerante: boolean;
  membreId: string;
  tours: TourDonnees[];
}): PossibiliteRetrait {
  if (params.estLaGerante) return { possible: false, raison: 'gerante' };
  if (params.statutTontine === 'terminee') return { possible: false, raison: 'terminee' };
  const dejaServi = params.tours.some(
    (t) => t.beneficiaire_membre_id === params.membreId && !!t.verse_at,
  );
  if (dejaServi) return { possible: false, raison: 'deja_servi' };
  // Avant le démarrage : la place se libère simplement. Pendant le cycle : remplaçante ou tour supprimé.
  return { possible: true, choixDuMode: params.statutTontine === 'en_cours' };
}

/** Cagnotte par tour si le tour du membre retiré est supprimé (N-1 membres). */
export function cagnotteApresSuppression(montant: number, nbMembres: number): number {
  return montant * (nbMembres - 1);
}
