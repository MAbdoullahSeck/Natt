import type { Frequence } from '@/domain/dates';

import { formatDate, formatMoisAnnee } from './format';

/** Date d'un tour : « Janv. 2027 » pour une tontine mensuelle, « 5 décembre » sinon. */
export function dateDuTour(echeance: string, frequence: Frequence): string {
  return frequence === 'mois' ? formatMoisAnnee(echeance) : formatDate(echeance);
}
