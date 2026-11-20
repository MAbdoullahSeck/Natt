import { compareJours } from './dates';
import { type Cotisation, estPenalisable, statutAffiche, type StatutAffiche } from './statuts';

/** Calculs sur une tontine chargée (vues 13 et 16). Fonctions pures, testées. */

export type TourDonnees = {
  id: string;
  numero: number;
  echeance: string;
  beneficiaire_membre_id: string | null;
  verse_at: string | null;
};

export type CotisationDonnees = {
  id: string;
  tour_id: string;
  membre_id: string;
  statut: Cotisation['statut'];
  declare_at: string | null;
  paye_at: string | null;
};

export function versCotisation(c: CotisationDonnees): Cotisation {
  return { statut: c.statut, declareAt: c.declare_at, payeAt: c.paye_at };
}

/** Tour en cours : le premier dont la cagnotte n'a pas été remise. `null` si tout est versé. */
export function tourEnCours<T extends TourDonnees>(tours: T[]): T | null {
  return [...tours].sort((a, b) => a.numero - b.numero).find((t) => !t.verse_at) ?? null;
}

/** Statut affiché d'un membre pour un tour (« Payé », « En attente », « En retard »). */
export function statutMembre(
  tour: TourDonnees,
  cotisations: CotisationDonnees[],
  membreId: string,
  maintenant = new Date(),
): StatutAffiche {
  const c = cotisations.find((x) => x.tour_id === tour.id && x.membre_id === membreId);
  if (!c) return 'en_attente';
  return statutAffiche(versCotisation(c), tour.echeance, maintenant);
}

export type ResumeTour = {
  cagnotte: number;
  recu: number;
  nbPayes: number;
  nbMembres: number;
  toutPaye: boolean;
};

/** Écran 13 : « X F reçus · N sur M payés ». */
export function resumeTour(
  montant: number,
  nbMembres: number,
  tour: TourDonnees,
  cotisations: CotisationDonnees[],
): ResumeTour {
  const nbPayes = cotisations.filter((c) => c.tour_id === tour.id && c.statut === 'paye').length;
  return {
    cagnotte: montant * nbMembres,
    recu: montant * nbPayes,
    nbPayes,
    nbMembres,
    toutPaye: nbPayes >= nbMembres,
  };
}

/** Écran 16 : prochaine cotisation non payée du membre (la plus ancienne). */
export function prochainPaiement<T extends TourDonnees>(
  tours: T[],
  cotisations: CotisationDonnees[],
  membreId: string,
): { tour: T; cotisation: CotisationDonnees } | null {
  const tries = [...tours].sort((a, b) => a.numero - b.numero);
  for (const tour of tries) {
    const c = cotisations.find((x) => x.tour_id === tour.id && x.membre_id === membreId);
    if (c && c.statut !== 'paye') return { tour, cotisation: c };
  }
  return null;
}

/** Tour dont le membre est bénéficiaire. */
export function tourDuMembre<T extends TourDonnees>(tours: T[], membreId: string): T | null {
  return tours.find((t) => t.beneficiaire_membre_id === membreId) ?? null;
}

/**
 * Écran 13c : bilan « X à l'heure », « Y en retard ».
 * On ne compte que les tours déjà échus ou réglés.
 */
export function bilanMembre(
  tours: TourDonnees[],
  cotisations: CotisationDonnees[],
  membreId: string,
  maintenant = new Date(),
): { aLHeure: number; enRetard: number } {
  let aLHeure = 0;
  let enRetard = 0;
  for (const tour of tours) {
    const c = cotisations.find((x) => x.tour_id === tour.id && x.membre_id === membreId);
    if (!c) continue;
    const echu = compareJours(maintenant, tour.echeance) > 0;
    const regle = c.statut !== 'a_payer';
    if (!echu && !regle) continue;
    if (estPenalisable(versCotisation(c), tour.echeance, maintenant)) enRetard += 1;
    else if (regle) aLHeure += 1;
  }
  return { aLHeure, enRetard };
}
