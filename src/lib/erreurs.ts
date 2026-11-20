import { textes } from '@/i18n';

/**
 * Les fonctions SQL lèvent des erreurs dont le message est un code court (ex. « code_inconnu »).
 * On récupère ce code pour afficher un texte de fr.ts.
 */
export function codeErreur(erreur: unknown): string | null {
  if (!erreur || typeof erreur !== 'object') return null;
  const message = (erreur as { message?: unknown }).message;
  if (typeof message !== 'string') return null;
  return /^[a-z_]+$/.test(message) ? message : null;
}

export function estErreurReseau(erreur: unknown): boolean {
  const message = (erreur as { message?: unknown } | null)?.message;
  return typeof message === 'string' && /network|fetch|timeout/i.test(message);
}

/** Message lisible pour une erreur quelconque. */
export function messageErreur(erreur: unknown): string {
  if (estErreurReseau(erreur)) return textes.erreurs.reseau;
  const code = codeErreur(erreur);
  const connus = textes.erreurs.codes as Record<string, string>;
  return (code && connus[code]) || textes.erreurs.inconnue;
}
