import { versDate } from '@/lib/format';

/**
 * Statuts de paiement — cahier des charges, règles P1, P3 et P5.
 * Statut stocké : a_payer → declare → paye.
 * Statut affiché : « Payé », « En attente », « En retard ».
 *
 * L'échéance est le dernier jour pour payer : une déclaration faite le jour de l'échéance
 * est à l'heure, le retard commence le lendemain.
 */
export type StatutPaiement = 'a_payer' | 'declare' | 'paye';
export type StatutAffiche = 'paye' | 'en_attente' | 'en_retard';

export type Cotisation = {
  statut: StatutPaiement;
  /** Date de la déclaration du membre (`cotisations.declare_at`). */
  declareAt?: Date | string | null;
  /** Date de la confirmation par la gérante (`cotisations.paye_at`). */
  payeAt?: Date | string | null;
};

/**
 * P1 :
 * - `paye` → « Payé » ;
 * - `declare` avant (ou le jour de) l'échéance → « En attente », même une fois l'échéance passée ;
 * - sinon → « En retard » si l'échéance est passée, « En attente » avant.
 */
export function statutAffiche(
  cotisation: Cotisation,
  echeance: Date | string,
  maintenant: Date = new Date(),
): StatutAffiche {
  if (cotisation.statut === 'paye') return 'paye';
  if (
    cotisation.statut === 'declare' &&
    cotisation.declareAt &&
    !apres(cotisation.declareAt, echeance)
  ) {
    return 'en_attente';
  }
  return apres(maintenant, echeance) ? 'en_retard' : 'en_attente';
}

/**
 * P5 : la cotisation est-elle en retard au sens de la pénalité ?
 * Oui si le paiement a été déclaré (ou, à défaut de déclaration, confirmé) après l'échéance,
 * ou s'il n'a toujours pas été déclaré une fois l'échéance passée.
 * Une déclaration faite à temps n'est jamais pénalisée, même confirmée plus tard.
 */
export function estPenalisable(
  cotisation: Cotisation,
  echeance: Date | string,
  maintenant: Date = new Date(),
): boolean {
  const dateDuPaiement =
    cotisation.declareAt ?? (cotisation.statut === 'paye' ? cotisation.payeAt : null);
  if (dateDuPaiement) return apres(dateDuPaiement, echeance);
  if (cotisation.statut === 'paye') return false;
  return apres(maintenant, echeance);
}

function jourCalendaire(d: Date): number {
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
}

/** Vrai si `date` tombe un jour calendaire strictement après `echeance`. */
function apres(date: Date | string, echeance: Date | string): boolean {
  return jourCalendaire(versDate(date)) > jourCalendaire(versDate(echeance));
}
