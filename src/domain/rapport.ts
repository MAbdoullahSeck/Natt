import { compareJours } from './dates';
import { estPenalisable } from './statuts';
import { type CotisationDonnees, type TourDonnees, versCotisation } from './tontine';
import { penalitesDuMembre, totalPenalites } from './notifications';

/** Rapport de fin de cycle (F2, écran 19b), calculé à partir des données et des événements. */
export type Rapport = {
  totalVerse: number;
  nbTours: number;
  nbToursVerses: number;
  debut: string | null;
  fin: string | null;
  pourcentageALHeure: number;
  nbRetards: number;
  totalPenalites: number;
  ponctualite: { membreId: string; aLHeure: number; enRetard: number }[];
};

type Evenement = { id: string; type: string; donnees: unknown; membre_id: string | null };

export function calculerRapport(
  montant: number,
  nbMembres: number,
  membres: { id: string }[],
  tours: TourDonnees[],
  cotisations: CotisationDonnees[],
  evenements: Evenement[],
): Rapport {
  const tries = [...tours].sort((a, b) => a.numero - b.numero);
  const verses = tries.filter((t) => t.verse_at);
  const echeanceDe = new Map(tries.map((t) => [t.id, t.echeance]));

  let aLHeure = 0;
  let retards = 0;
  const parMembre = new Map(
    membres.map((m) => [m.id, { membreId: m.id, aLHeure: 0, enRetard: 0 }]),
  );
  for (const c of cotisations) {
    const echeance = echeanceDe.get(c.tour_id);
    if (!echeance || c.statut === 'a_payer') continue;
    const enRetard = estPenalisable(versCotisation(c), echeance);
    const ligne = parMembre.get(c.membre_id);
    if (enRetard) {
      retards += 1;
      if (ligne) ligne.enRetard += 1;
    } else {
      aLHeure += 1;
      if (ligne) ligne.aLHeure += 1;
    }
  }
  const total = aLHeure + retards;
  const penalites = membres.reduce(
    (s, m) => s + totalPenalites(penalitesDuMembre(evenements, m.id)),
    0,
  );

  return {
    totalVerse: verses.length * montant * nbMembres,
    nbTours: tries.length,
    nbToursVerses: verses.length,
    debut: tries[0]?.echeance ?? null,
    fin: tries[tries.length - 1]?.echeance ?? null,
    pourcentageALHeure: total === 0 ? 100 : Math.round((aLHeure / total) * 100),
    nbRetards: retards,
    totalPenalites: penalites,
    ponctualite: [...parMembre.values()].sort(
      (a, b) => b.aLHeure - a.aLHeure || a.enRetard - b.enRetard,
    ),
  };
}

/** Vrai si la date est passée (utile pour les cycles terminés en avance). */
export function estPasse(date: string, maintenant = new Date()): boolean {
  return compareJours(maintenant, date) > 0;
}
