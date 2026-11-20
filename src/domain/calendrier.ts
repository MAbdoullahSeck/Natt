import { ajouterJours, ajouterPeriodes, compareJours, echeances, type Frequence } from './dates';

/**
 * Calendrier intelligent (C2). Si un événement (Tabaski, Korité…) tombe pendant le cycle,
 * on propose de décaler la date de début pour qu'un tour tombe la veille de l'événement.
 * Rien n'est appliqué sans action de la gérante.
 */
export type EvenementCalendrier = { nom: string; date_debut: string };

export type Suggestion = {
  evenement: EvenementCalendrier;
  /** Nouvelle date de début proposée. */
  nouvelleDate: Date;
  /** Numéro du tour qui tombera la veille de l'événement. */
  tour: number;
};

export function suggererAjustement(
  debut: Date | string,
  frequence: Frequence,
  nbMembres: number,
  evenements: EvenementCalendrier[],
): Suggestion | null {
  if (frequence === 'jour') return null; // décalage d'au plus un jour : sans intérêt.
  const liste = echeances(debut, frequence, nbMembres);
  const fin = liste[liste.length - 1];
  const tries = [...evenements].sort((a, b) => compareJours(a.date_debut, b.date_debut));

  for (const evenement of tries) {
    if (compareJours(evenement.date_debut, debut) <= 0) continue;
    if (compareJours(evenement.date_debut, fin) > 0) continue;
    const veille = ajouterJours(evenement.date_debut, -1);
    // Dernier tour dont l'échéance tombe au plus tard la veille de l'événement.
    let tour = 0;
    liste.forEach((e, i) => {
      if (compareJours(e, veille) <= 0) tour = i + 1;
    });
    if (tour === 0) continue;
    if (compareJours(liste[tour - 1], veille) === 0) continue; // déjà calé.
    const nouvelleDate = ajouterPeriodes(veille, frequence, -(tour - 1));
    // On ne recule jamais la date de début (elle doit rester aujourd'hui ou plus tard).
    if (compareJours(nouvelleDate, debut) < 0) continue;
    return { evenement, nouvelleDate, tour };
  }
  return null;
}
