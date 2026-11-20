import { versDate } from '@/lib/format';

/**
 * Statuts de paiement — cahier des charges, règles P1 et P3.
 * Statut stocké : a_payer → declare → paye.
 * Statut affiché : « Payé », « En attente », « En retard ».
 */
export type StatutPaiement = 'a_payer' | 'declare' | 'paye';
export type StatutAffiche = 'paye' | 'en_attente' | 'en_retard';

/**
 * `en_retard` si l'échéance est passée et que le statut n'est pas `paye` (P1).
 * Un paiement `declare` s'affiche « En attente » tant que la gérante ne l'a pas confirmé (P3),
 * sauf s'il est en retard.
 * L'échéance est le dernier jour pour payer : le retard commence le lendemain.
 */
export function statutAffiche(
  statut: StatutPaiement,
  echeance: Date | string,
  maintenant: Date = new Date(),
): StatutAffiche {
  if (statut === 'paye') return 'paye';
  return estApresEcheance(echeance, maintenant) ? 'en_retard' : 'en_attente';
}

function jourCalendaire(d: Date): number {
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
}

function estApresEcheance(echeance: Date | string, maintenant: Date): boolean {
  return jourCalendaire(maintenant) > jourCalendaire(versDate(echeance));
}
