import type { TourDonnees } from './tontine';

/** Ordre des tours (O1–O3). Miroir de la logique SQL, pour l'affichage et les tests. */

/** Un échange n'est possible qu'entre deux tours non encore versés (O3). */
export function peutEchanger(tours: TourDonnees[], membreA: string, membreB: string): boolean {
  if (membreA === membreB) return false;
  const a = tours.find((t) => t.beneficiaire_membre_id === membreA);
  const b = tours.find((t) => t.beneficiaire_membre_id === membreB);
  return !!a && !!b && !a.verse_at && !b.verse_at;
}

/** Membres avec qui on peut échanger le tour de `membre` (écran 15b). */
export function partenairesPossibles(tours: TourDonnees[], membre: string): string[] {
  return tours
    .filter(
      (t) => t.beneficiaire_membre_id && peutEchanger(tours, membre, t.beneficiaire_membre_id),
    )
    .map((t) => t.beneficiaire_membre_id!);
}

/** Ordre (liste de membres par rang) après échange de A et B. */
export function echangerOrdre(ordre: string[], a: string, b: string): string[] {
  return ordre.map((m) => (m === a ? b : m === b ? a : m));
}

/** Le tirage n'est possible qu'une fois, tontine complète, avant la première remise (O2). */
export function tiragePossible(
  tours: TourDonnees[],
  nbInscrits: number,
  nbMembres: number,
  tirageDejaFait: boolean,
): boolean {
  return !tirageDejaFait && nbInscrits >= nbMembres && tours.every((t) => !t.verse_at);
}
