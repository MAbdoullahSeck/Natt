import { textes } from '@/i18n';
import type { Tables } from '@/lib/database.types';
import { formatMontant } from '@/lib/format';

const t = textes.historique;

/** Libellé d'un événement du journal (écran 13c). */
export function libelleEvenement(e: Tables<'evenements'>): string {
  const d = (e.donnees ?? {}) as Record<string, unknown>;
  switch (e.type) {
    case 'declaration':
      return t.evenements.declaration(
        textes.moyens[d.moyen as keyof typeof textes.moyens] ?? String(d.moyen ?? ''),
      );
    case 'penalite':
      return t.evenements.penalite(formatMontant(Number(d.montant ?? 0)));
    case 'reglement_accepte':
      return t.evenements.reglement_accepte(Number(d.version ?? 1));
    case 'confirmation':
    case 'relance':
    case 'penalite_annulee':
    case 'echange':
    case 'membre_rejoint':
    case 'versement':
    case 'tirage':
      return t.evenements[e.type];
    default:
      return t.evenements.autre;
  }
}
